/**
 * Show Gemini Sentiment Analysis Results and Insights
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/show-gemini-insights.ts [url]
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

import { analyzeBrandSentiment } from '../lib/modules/gemini';
import { scrapeWebsite } from '../lib/modules/scraper';
import { calculateTotalScore } from '../lib/modules/scoring';

async function showGeminiInsights() {
  const url = process.argv[2] || 'https://www.msig-thai.com/th';
  
  console.log('🔍 Gemini Sentiment Analysis - Results & Insights');
  console.log('='.repeat(70));
  console.log(`URL: ${url}\n`);
  
  try {
    // Step 1: Get raw Gemini results
    console.log('📡 Step 1: Calling Gemini API...');
    const scraping = await scrapeWebsite(url);
    let domainName = '';
    let domain = '';
    try {
      const urlObj = new URL(scraping.url);
      domainName = urlObj.hostname.replace('www.', '').split('.')[0];
      domain = urlObj.hostname.replace('www.', '');
    } catch {}
    
    const geminiResult = await analyzeBrandSentiment(domainName || domain, domain);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAW GEMINI API RESULTS');
    console.log('='.repeat(70));
    console.log('\n   Sentiment:', geminiResult.sentiment);
    console.log('   Score:', geminiResult.score, '/ 5 points');
    console.log('   Confidence:', (geminiResult.confidence * 100).toFixed(0) + '%');
    console.log('\n   Sources:');
    console.log('      Community Mentions:', geminiResult.sources.community);
    console.log('         - Positive:', geminiResult.breakdown.positive);
    console.log('         - Neutral:', geminiResult.breakdown.neutral);
    console.log('         - Negative:', geminiResult.breakdown.negative);
    console.log('      PR Mentions:', geminiResult.sources.pr);
    console.log('      Review Mentions:', geminiResult.sources.reviews);
    
    console.log('\n   📡 Source Details:');
    console.log('      Total Sources Checked:', geminiResult.sourceDetails.totalSourcesChecked);
    if (geminiResult.sourceDetails.urlsAnalyzed > 0 || geminiResult.sourceDetails.pagesCrawled > 0) {
      const urlCount = geminiResult.sourceDetails.urlsAnalyzed || geminiResult.sourceDetails.pagesCrawled;
      console.log(`      URLs/Pages Researched: ${urlCount} (from Gemini training data)`);
    } else {
      console.log('      URLs/Pages Researched: 0 (no specific URLs found in training data)');
    }
    if (geminiResult.sourceDetails.communities.length > 0) {
      console.log('      Communities:', geminiResult.sourceDetails.communities.join(', '));
    }
    if (geminiResult.sourceDetails.reviewSites.length > 0) {
      console.log('      Review Sites:', geminiResult.sourceDetails.reviewSites.join(', '));
    }
    if (geminiResult.sourceDetails.newsSources.length > 0) {
      console.log('      News Sources:', geminiResult.sourceDetails.newsSources.join(', '));
    }
    
    if (geminiResult.error) {
      console.log('\n   ⚠️  Error:', geminiResult.error);
    }
    
    // Step 2: Show how it's used in scoring
    console.log('\n' + '='.repeat(70));
    console.log('📈 HOW IT AFFECTS SCORING');
    console.log('='.repeat(70));
    
    console.log('\n   Scoring Logic:');
    console.log('      • 2+ community positive = 5 pts');
    console.log('      • 1 community pos + PR = 4 pts');
    console.log('      • Neutral/Mixed = 2.5 pts');
    console.log('      • PR only = 2 pts');
    console.log('      • 1 community negative = 1 pt');
    console.log('      • 2+ community negative = 0 pts (OVERRIDE)');
    
    console.log(`\n   Your Result: ${geminiResult.score}/5 points`);
    console.log(`   Reason: Based on sentiment "${geminiResult.sentiment}" with:`);
    console.log(`      - ${geminiResult.breakdown.positive} positive mentions`);
    console.log(`      - ${geminiResult.breakdown.negative} negative mentions`);
    console.log(`      - ${geminiResult.sources.pr} PR mentions`);
    
    // Step 3: Show insights generated
    console.log('\n' + '='.repeat(70));
    console.log('💡 GENERATED INSIGHTS & RECOMMENDATIONS');
    console.log('='.repeat(70));
    
    const scores = await calculateTotalScore(scraping, { 
      url: scraping.url,
      lcp: 0,
      fid: 0,
      cls: 0,
      mobileScore: 0,
      lcpCategory: 'POOR' as const,
      fidCategory: 'POOR' as const,
      clsCategory: 'POOR' as const,
      performanceScore: 0,
      accessibilityScore: 0,
      seoScore: 0,
      bestPracticesScore: 0
    });
    
    const sentimentBreakdown = scores.breakdown.brandRanking.brandSentiment;
    
    console.log('\n   📊 Sentiment Value:');
    console.log(`      "${sentimentBreakdown.value}"`);
    
    // Show URL count if available in insight
    const urlMatch = sentimentBreakdown.insight?.match(/Researched (\d+) URL/);
    if (urlMatch) {
      console.log(`\n   🔍 URLs/Pages Researched: ${urlMatch[1]}`);
    }
    
    console.log('\n   💡 Insight:');
    const insightLines = (sentimentBreakdown.insight || '').split('. ').filter(l => l.trim());
    insightLines.forEach((line: string, i: number) => {
      if (i === 0) {
        console.log(`      ${line}.`);
      } else {
        console.log(`      ${line}${line.endsWith('.') ? '' : '.'}`);
      }
    });
    
    console.log('\n   📋 Recommendation:');
    const recLines = (sentimentBreakdown.recommendation || '').split(/[0-9]\)/).filter(l => l.trim());
    recLines.forEach((line: string) => {
      if (line.trim()) {
        console.log(`      ${line.trim()}`);
      }
    });
    
    // Step 4: Show impact on total score
    console.log('\n' + '='.repeat(70));
    console.log('🎯 IMPACT ON TOTAL SCORE');
    console.log('='.repeat(70));
    
    console.log(`\n   Brand Ranking Score: ${scores.brandRanking}/10`);
    console.log(`      - Brand Search: ${scores.breakdown.brandRanking.brandSearch.score}/5`);
    console.log(`      - Brand Sentiment: ${sentimentBreakdown.score}/5 (from Gemini)`);
    
    console.log(`\n   Total Score: ${scores.total}/100`);
    console.log(`   Contribution: Brand Sentiment adds ${sentimentBreakdown.score} points to Brand Ranking`);
    console.log(`                Brand Ranking contributes ${scores.brandRanking} points to Total Score`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Analysis Complete!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

showGeminiInsights().catch(console.error);

