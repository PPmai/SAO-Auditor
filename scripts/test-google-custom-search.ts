/**
 * Test Google Custom Search API Integration
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-google-custom-search.ts [brand] [domain]
 */

// Load environment variables
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line: string) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

import {
  isGoogleCustomSearchConfigured,
  getBrandSearchPosition,
  getCompetitorPosition,
  getKeywordPosition,
  getSERPSnippet,
  getTopCompetitors
} from '../lib/modules/google-custom-search';

async function testGoogleCustomSearch() {
  console.log('🧪 Testing Google Custom Search API Integration\n');
  console.log('='.repeat(70));
  
  // Test 1: Configuration Check
  console.log('\n📡 TEST 1: Configuration Check');
  console.log('-'.repeat(70));
  const isConfigured = isGoogleCustomSearchConfigured();
  console.log(`   Google Custom Search API: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!isConfigured) {
    console.log('\n❌ GOOGLE_CUSTOM_SEARCH_API_KEY or GOOGLE_CUSTOM_SEARCH_ENGINE_ID not found in .env');
    console.log('   Setup instructions:');
    console.log('   1. Go to https://programmablesearchengine.google.com/');
    console.log('   2. Create a Custom Search Engine');
    console.log('   3. Get your Search Engine ID (CX)');
    console.log('   4. Get API Key from https://console.cloud.google.com/apis/credentials');
    console.log('   5. Add to .env:');
    console.log('      GOOGLE_CUSTOM_SEARCH_API_KEY=your_key_here');
    console.log('      GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id_here');
    process.exit(1);
  }
  
  const brand = process.argv[2] || 'msig-thai';
  const domain = process.argv[3] || 'msig-thai.com';
  
  // Test 2: Brand Search Position
  console.log('\n🔍 TEST 2: Brand Search Position');
  console.log('-'.repeat(70));
  console.log(`   Brand: ${brand}`);
  console.log(`   Domain: ${domain}`);
  console.log('\n   Calling Google Custom Search API...\n');
  
  try {
    const brandResult = await getBrandSearchPosition(brand, domain);
    
    if (brandResult.error) {
      console.log('   ❌ Error:', brandResult.error);
    } else if (brandResult.found) {
      console.log(`   ✅ Brand found at position #${brandResult.position}`);
      console.log(`   URL: ${brandResult.url}`);
      console.log(`   Title: ${brandResult.title}`);
      console.log(`   Snippet: ${brandResult.snippet?.substring(0, 100)}...`);
    } else {
      console.log('   ⚠️  Brand not found in top 10 results');
    }
    
    // Test 3: Keyword Position
    console.log('\n🔍 TEST 3: Keyword Position Check');
    console.log('-'.repeat(70));
    const testKeyword = 'insurance thailand';
    console.log(`   Keyword: "${testKeyword}"`);
    console.log(`   Domain: ${domain}`);
    console.log('\n   Calling Google Custom Search API...\n');
    
    const keywordResult = await getKeywordPosition(testKeyword, domain);
    
    if (keywordResult.error) {
      console.log('   ❌ Error:', keywordResult.error);
    } else if (keywordResult.found) {
      console.log(`   ✅ Keyword found at position #${keywordResult.position}`);
      console.log(`   URL: ${keywordResult.url}`);
      console.log(`   Title: ${keywordResult.title}`);
    } else {
      console.log(`   ⚠️  Domain not found in top 10 for "${testKeyword}"`);
    }
    
    // Test 4: SERP Snippet Preview
    console.log('\n📄 TEST 4: SERP Snippet Preview');
    console.log('-'.repeat(70));
    const snippet = await getSERPSnippet(testKeyword, domain);
    
    if (snippet) {
      console.log(`   ✅ SERP Snippet found at position #${snippet.position}`);
      console.log(`   Title: ${snippet.title}`);
      console.log(`   Description: ${snippet.description?.substring(0, 150)}...`);
      console.log(`   URL: ${snippet.url}`);
    } else {
      console.log(`   ⚠️  No SERP snippet found for "${testKeyword}"`);
    }
    
    // Test 5: Top Competitors
    console.log('\n🏆 TEST 5: Top 10 Competitors');
    console.log('-'.repeat(70));
    console.log(`   Keyword: "${testKeyword}"`);
    console.log(`   Excluding: ${domain}`);
    console.log('\n   Calling Google Custom Search API...\n');
    
    const competitorsResult = await getTopCompetitors(testKeyword, domain);
    
    if (competitorsResult.error) {
      console.log('   ❌ Error:', competitorsResult.error);
    } else {
      console.log(`   ✅ Found ${competitorsResult.competitors.length} competitors`);
      console.log(`   Total Results: ${competitorsResult.totalResults}`);
      console.log('\n   Top Competitors:');
      competitorsResult.competitors.slice(0, 5).forEach((comp, i) => {
        console.log(`\n   ${i + 1}. ${comp.domain} (Position #${comp.position})`);
        console.log(`      Title: ${comp.title}`);
        console.log(`      URL: ${comp.url}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 All tests completed!\n');
    
  } catch (error: any) {
    console.log('   ❌ Test Failed:', error.message);
    console.log('\n   Error details:', error);
    process.exit(1);
  }
}

testGoogleCustomSearch().catch(console.error);






