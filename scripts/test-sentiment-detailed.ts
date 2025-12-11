/**
 * Test Sentiment Analysis with Full Scoring
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-sentiment-detailed.ts [url]
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

import { scrapeWebsite } from '../lib/modules/scraper';
import { analyzePageSpeed } from '../lib/modules/pagespeed';
import { calculateTotalScore } from '../lib/modules/scoring';

async function testSentimentDetailed() {
  const url = process.argv[2] || 'https://www.msig-thai.com/th';
  
  console.log('🔍 Testing Sentiment Analysis');
  console.log('='.repeat(70));
  console.log(`URL: ${url}\n`);
  
  try {
    console.log('📡 Step 1: Scraping website...');
    const scraping = await scrapeWebsite(url);
    console.log(`   ✅ Title: ${scraping.title?.substring(0, 50) || 'N/A'}`);
    
    console.log('\n📡 Step 2: Analyzing PageSpeed...');
    const pagespeed = await analyzePageSpeed(url);
    console.log(`   ✅ Performance: ${pagespeed.performanceScore}/100`);
    
    console.log('\n📡 Step 3: Calculating scores (includes Gemini sentiment analysis)...');
    console.log('   🔍 Gemini API will be called for sentiment analysis...\n');
    const scores = await calculateTotalScore(scraping, pagespeed);
    
    console.log('='.repeat(70));
    console.log('📊 BRAND RANKING BREAKDOWN');
    console.log('='.repeat(70));
    console.log(`\n   Total Brand Ranking Score: ${scores.brandRanking}/10`);
    console.log(`\n   1. Brand Search: ${scores.breakdown.brandRanking.brandSearch.score}/5 pts`);
    console.log(`      Value: ${scores.breakdown.brandRanking.brandSearch.value}`);
    console.log(`      Status: ${scores.breakdown.brandRanking.brandSearch.score > 0 ? '✅' : '⚠️  (Requires Ahrefs API)'}`);
    
    console.log(`\n   2. Brand Sentiment: ${scores.breakdown.brandRanking.brandSentiment.score}/5 pts`);
    console.log(`      Value: ${scores.breakdown.brandRanking.brandSentiment.value}`);
    console.log(`      Status: ${scores.breakdown.brandRanking.brandSentiment.score > 0 ? '✅ (Gemini API Working!)' : '⚠️  (Gemini API not configured)'}`);
    
    console.log(`\n   💡 Sentiment Insight:`);
    const insight = scores.breakdown.brandRanking.brandSentiment.insight || 'No insight available';
    const insightLines = insight.match(/.{1,70}/g) || [insight];
    insightLines.forEach((line: string | undefined) => {
      if (line) console.log(`      ${line}`);
    });
    
    console.log(`\n   📋 Recommendation:`);
    const rec = scores.breakdown.brandRanking.brandSentiment.recommendation || 'No recommendation available';
    const recLines = rec.match(/.{1,70}/g) || [rec];
    recLines.forEach((line: string | undefined) => {
      if (line) console.log(`      ${line}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('📈 OVERALL SCORE');
    console.log('='.repeat(70));
    console.log(`   Total: ${scores.total}/100`);
    console.log(`   Content Structure: ${scores.contentStructure}/30`);
    console.log(`   Brand Ranking: ${scores.brandRanking}/10 (includes sentiment: ${scores.breakdown.brandRanking.brandSentiment.score}/5)`);
    console.log(`   Website Technical: ${scores.websiteTechnical}/18`);
    console.log(`   Keyword Visibility: ${scores.keywordVisibility}/25`);
    console.log(`   AI Trust: ${scores.aiTrust}/25`);
    
    console.log('\n' + '='.repeat(70));
    console.log('📡 DATA SOURCES');
    console.log('='.repeat(70));
    console.log(`   Gemini: ${scores.dataSource.gemini ? '✅ Configured & Working' : '❌ Not configured'}`);
    console.log(`   Moz: ${scores.dataSource.moz ? '✅' : '❌'}`);
    console.log(`   PageSpeed: ${scores.dataSource.pagespeed ? '✅' : '❌'}`);
    console.log(`   Scraping: ${scores.dataSource.scraping ? '✅' : '❌'}`);
    
    console.log('\n✅ Test Complete!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSentimentDetailed().catch(console.error);

