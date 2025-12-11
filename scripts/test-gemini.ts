/**
 * Test Gemini API Integration
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-gemini.ts
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

import { isGeminiConfigured, analyzeBrandSentiment } from '../lib/modules/gemini';

async function testGemini() {
  console.log('🧪 Testing Gemini API Integration\n');
  console.log('='.repeat(70));
  
  // Test 1: Configuration Check
  console.log('\n📡 TEST 1: Configuration Check');
  console.log('-'.repeat(70));
  const isConfigured = isGeminiConfigured();
  console.log(`   Gemini API: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!isConfigured) {
    console.log('\n❌ GEMINI_API_KEY not found in .env file');
    console.log('   Please add: GEMINI_API_KEY=your_key_here');
    process.exit(1);
  }
  
  // Test 2: Sentiment Analysis
  console.log('\n🔍 TEST 2: Brand Sentiment Analysis');
  console.log('-'.repeat(70));
  const testBrand = process.argv[2] || 'msig-thai';
  const testDomain = process.argv[3] || 'msig-thai.com';
  
  console.log(`   Brand: ${testBrand}`);
  console.log(`   Domain: ${testDomain}`);
  console.log('\n   Calling Gemini API...\n');
  
  try {
    const startTime = Date.now();
    const result = await analyzeBrandSentiment(testBrand, testDomain);
    const duration = Date.now() - startTime;
    
    console.log('   ✅ Analysis Complete!');
    console.log(`   ⏱ Duration: ${(duration / 1000).toFixed(2)}s\n`);
    
    if (result.error) {
      console.log('   ❌ Error:', result.error);
      console.log('\n   This might be due to:');
      console.log('   - Invalid API key');
      console.log('   - API quota exceeded');
      console.log('   - Network issues');
      process.exit(1);
    }
    
    console.log('   📊 Results:');
    console.log(`      Sentiment: ${result.sentiment}`);
    console.log(`      Score: ${result.score}/5 points`);
    console.log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`      Community Mentions: ${result.sources.community}`);
    console.log(`         - Positive: ${result.breakdown.positive}`);
    console.log(`         - Neutral: ${result.breakdown.neutral}`);
    console.log(`         - Negative: ${result.breakdown.negative}`);
    console.log(`      PR Mentions: ${result.sources.pr}`);
    console.log(`      Review Mentions: ${result.sources.reviews}`);
    console.log(`\n   📡 Sources Analyzed:`);
    console.log(`      Total Sources Checked: ${result.sourceDetails.totalSourcesChecked}`);
    if (result.sourceDetails.urlsAnalyzed > 0 || result.sourceDetails.pagesCrawled > 0) {
      const urlCount = result.sourceDetails.urlsAnalyzed || result.sourceDetails.pagesCrawled;
      console.log(`      URLs/Pages Researched: ${urlCount} (from Gemini training data)`);
    } else {
      console.log(`      URLs/Pages Researched: 0 (no specific URLs found in training data)`);
    }
    if (result.sourceDetails.communities.length > 0) {
      console.log(`      Communities: ${result.sourceDetails.communities.join(', ')}`);
    }
    if (result.sourceDetails.reviewSites.length > 0) {
      console.log(`      Review Sites: ${result.sourceDetails.reviewSites.join(', ')}`);
    }
    if (result.sourceDetails.newsSources.length > 0) {
      console.log(`      News Sources: ${result.sourceDetails.newsSources.join(', ')}`);
    }
    if (result.sourceDetails.totalSourcesChecked === 0 && (result.sourceDetails.urlsAnalyzed === 0 && result.sourceDetails.pagesCrawled === 0)) {
      console.log(`      Note: Analysis based on Gemini training data (not real-time web crawl)`);
    }
    
    console.log('\n   ✅ Gemini API Integration Working!');
    console.log('\n' + '='.repeat(70));
    console.log('🎉 All tests passed!\n');
    
  } catch (error: any) {
    console.log('   ❌ Test Failed:', error.message);
    console.log('\n   Error details:', error);
    process.exit(1);
  }
}

testGemini().catch(console.error);

