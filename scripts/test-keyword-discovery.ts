/**
 * Test Script for Keyword Discovery Module
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-keyword-discovery.ts
 */

// Load environment variables
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

import { scrapeWebsite } from '../lib/modules/scraper';
import { discoverKeywords } from '../lib/modules/keyword-discovery';

async function testKeywordDiscovery() {
  const url = process.argv[2] || 'https://www.msig-thai.com/th';
  
  console.log('🔍 Keyword Discovery Test');
  console.log('='.repeat(80));
  console.log(`URL: ${url}\n`);
  
  try {
    // Step 1: Scrape the website
    console.log('📄 Step 1: Scraping website...');
    const scrapingResult = await scrapeWebsite(url);
    console.log(`✅ Scraped: ${scrapingResult.wordCount} words, ${scrapingResult.h1.length} H1, ${scrapingResult.h2.length} H2\n`);
    
    // Step 2: Extract domain
    const domain = new URL(url).hostname.replace('www.', '');
    console.log(`🌐 Domain: ${domain}\n`);
    
    // Step 3: Discover keywords
    console.log('🔍 Step 2: Discovering keywords...');
    console.log('   - Extracting brand keywords...');
    console.log('   - Using Gemini to extract content keywords...');
    console.log('   - Checking rankings with Google Custom Search API...\n');
    
    const result = await discoverKeywords(url, domain, scrapingResult, 'th');
    
    // Display results
    console.log('='.repeat(80));
    console.log('📊 KEYWORD DISCOVERY RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Keywords Found: ${result.totalKeywordsFound}`);
    console.log(`   Keywords in Top 10: ${result.keywordsInTop10}`);
    console.log(`   Keywords in Top 100: ${result.keywordsInTop100}`);
    console.log(`   Average Position: ${result.averagePosition || 'N/A'}`);
    console.log(`   Brand Position: ${result.brandPosition || 'Not in top 100'}`);
    
    console.log(`\n🎯 Intent Breakdown:`);
    console.log(`   Informational: ${result.intentBreakdown.informational} (${(result.intentBreakdown.informational / result.totalKeywordsFound * 100).toFixed(1)}%)`);
    console.log(`   Commercial: ${result.intentBreakdown.commercial} (${(result.intentBreakdown.commercial / result.totalKeywordsFound * 100).toFixed(1)}%)`);
    console.log(`   Transactional: ${result.intentBreakdown.transactional} (${(result.intentBreakdown.transactional / result.totalKeywordsFound * 100).toFixed(1)}%)`);
    console.log(`   Navigational: ${result.intentBreakdown.navigational} (${(result.intentBreakdown.navigational / result.totalKeywordsFound * 100).toFixed(1)}%)`);
    console.log(`   Dominant Intent: ${result.intentBreakdown.dominant} (${result.intentBreakdown.dominantPercent}%)`);
    
    console.log(`\n🏷️  Brand Keywords (${result.brandKeywords.length}):`);
    result.brandKeywords.slice(0, 10).forEach(kw => {
      const pos = kw.position ? `#${kw.position}` : 'Not in top 100';
      console.log(`   - "${kw.keyword}" (${kw.intent}): ${pos}`);
    });
    if (result.brandKeywords.length > 10) {
      console.log(`   ... and ${result.brandKeywords.length - 10} more`);
    }
    
    console.log(`\n📝 Content Keywords (${result.contentKeywords.length}):`);
    result.contentKeywords.slice(0, 15).forEach(kw => {
      const pos = kw.position ? `#${kw.position}` : 'Not in top 100';
      const top10 = kw.inTop10 ? '⭐' : '';
      console.log(`   - "${kw.keyword}" (${kw.intent}): ${pos} ${top10}`);
    });
    if (result.contentKeywords.length > 15) {
      console.log(`   ... and ${result.contentKeywords.length - 15} more`);
    }
    
    console.log(`\n⭐ Top 10 Rankings:`);
    const top10Keywords = result.allKeywords.filter(k => k.inTop10).sort((a, b) => (a.position || 999) - (b.position || 999));
    top10Keywords.forEach(kw => {
      console.log(`   #${kw.position}: "${kw.keyword}" (${kw.type}, ${kw.intent})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Keyword discovery completed!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testKeywordDiscovery();






