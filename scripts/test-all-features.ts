/**
 * Comprehensive Test Script for All Features
 * Tests: Common Crawl, Moz API, API Manager, Scoring System
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-all-features.ts
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

import { getUnifiedSEOMetrics, getAPIStatus } from '../lib/modules/api-manager';
import { getBacklinkMetrics as getCommonCrawlBacklinks } from '../lib/modules/commoncrawl';
import { getMozMetrics } from '../lib/modules/moz';
import { scrapeWebsite } from '../lib/modules/scraper';
import { analyzePageSpeed } from '../lib/modules/pagespeed';
import { calculateTotalScore } from '../lib/modules/scoring';
import { toMozMetrics, toKeywordMetrics } from '../lib/modules/api-manager';

async function testAllFeatures() {
  console.log('🧪 Comprehensive Feature Test\n');
  console.log('='.repeat(70));
  console.log('Testing URL: https://www.msig-thai.com/en\n');
  console.log('='.repeat(70) + '\n');

  const url = process.argv[2] || 'https://www.msig-thai.com/en';
  const domain = new URL(url).hostname.replace('www.', '');

  // ===== TEST 1: API Status Check =====
  console.log('📡 TEST 1: API Status Check');
  console.log('-'.repeat(70));
  const apiStatus = getAPIStatus();
  // Ahrefs removed - using Google Custom Search instead
  console.log(`   DataForSEO:    ${apiStatus.dataforseo ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Moz:           ${apiStatus.moz ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Common Crawl:  ${apiStatus.commoncrawl ? '✅ Available' : '❌ Not available'}`);
  console.log('');

  // ===== TEST 2: Common Crawl Integration =====
  console.log('🔍 TEST 2: Common Crawl Integration');
  console.log('-'.repeat(70));
  try {
    const commonCrawlData = await getCommonCrawlBacklinks(domain);
    console.log(`   Status: ${commonCrawlData.error ? '⚠️  ' + commonCrawlData.error : '✅ Success'}`);
    console.log(`   Backlinks: ${commonCrawlData.backlinks.toLocaleString()}`);
    console.log(`   Referring Domains: ${commonCrawlData.referringDomains.toLocaleString()}`);
    console.log(`   Domain Rating: ${commonCrawlData.domainRating} (not available)`);
    console.log(`   Anchor Text Samples: ${commonCrawlData.anchorText.length}`);
    if (commonCrawlData.error) {
      console.log(`   ⚠️  Note: ${commonCrawlData.error}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== TEST 3: Moz API Integration =====
  console.log('🔗 TEST 3: Moz API Integration');
  console.log('-'.repeat(70));
  try {
    const mozData = await getMozMetrics(url);
    if (mozData.error) {
      console.log(`   ⚠️  ${mozData.error}`);
    } else {
      console.log(`   ✅ Domain Authority (DA): ${mozData.domainAuthority}`);
      console.log(`   ✅ Page Authority (PA): ${mozData.pageAuthority}`);
      console.log(`   ✅ Linking Domains: ${mozData.linkingDomains.toLocaleString()}`);
      console.log(`   ✅ Inbound Links: ${mozData.inboundLinks.toLocaleString()}`);
      console.log(`   ✅ Spam Score: ${mozData.spamScore}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== TEST 4: API Manager (Unified Metrics with Fallback) =====
  console.log('🔄 TEST 4: API Manager - Unified Metrics with Fallback Chain');
  console.log('-'.repeat(70));
  try {
    const unified = await getUnifiedSEOMetrics(url);
    console.log(`   Keywords Source: ${unified.source.keywords}`);
    console.log(`   Backlinks Source: ${unified.source.backlinks}`);
    console.log(`   Keywords: ${unified.keywords.total} (Top 10: ${unified.keywords.top10}, Avg Pos: ${unified.keywords.avgPosition})`);
    console.log(`   Backlinks: ${unified.backlinks.total.toLocaleString()} (Ref Domains: ${unified.backlinks.referringDomains.toLocaleString()})`);
    if (unified.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${unified.errors.join('; ')}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== TEST 5: Content Scraping =====
  console.log('📄 TEST 5: Content Scraping');
  console.log('-'.repeat(70));
  try {
    const scraping = await scrapeWebsite(url);
    console.log(`   ✅ Word Count: ${scraping.wordCount.toLocaleString()}`);
    console.log(`   ✅ H1 Tags: ${scraping.h1.length}`);
    console.log(`   ✅ H2 Tags: ${scraping.h2.length}`);
    console.log(`   ✅ H3 Tags: ${scraping.h3.length}`);
    console.log(`   ✅ Schema: ${scraping.hasSchema ? 'Yes' : 'No'} (${scraping.schemaTypes.length} types)`);
    console.log(`   ✅ Images: ${scraping.imageCount} (${scraping.imagesWithAlt} with alt)`);
    console.log(`   ✅ Tables: ${scraping.tableCount}, Lists: ${scraping.listCount}`);
    console.log(`   ✅ SSL: ${scraping.hasSSL ? 'Yes' : 'No'}`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== TEST 6: PageSpeed Analysis =====
  console.log('⚡ TEST 6: PageSpeed Analysis');
  console.log('-'.repeat(70));
  try {
    const pagespeed = await analyzePageSpeed(url);
    console.log(`   ✅ LCP: ${pagespeed.lcp?.toFixed(2)}s`);
    console.log(`   ✅ INP: ${pagespeed.fid?.toFixed(0)}ms`);
    console.log(`   ✅ CLS: ${pagespeed.cls?.toFixed(3)}`);
    console.log(`   ✅ Mobile Score: ${pagespeed.mobileScore}/100`);
    console.log(`   ✅ Performance Score: ${pagespeed.performanceScore}/100`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== TEST 7: Full Scoring System =====
  console.log('📊 TEST 7: Full Scoring System (5 Pillars)');
  console.log('-'.repeat(70));
  try {
    const [scraping, pagespeed, mozData, unified] = await Promise.all([
      scrapeWebsite(url),
      analyzePageSpeed(url),
      getMozMetrics(url),
      getUnifiedSEOMetrics(url)
    ]);

    const keywordData = toKeywordMetrics(unified);
    const enhancedMoz = toMozMetrics(unified, mozData);

    const scores = await calculateTotalScore(scraping, pagespeed, enhancedMoz, keywordData);

    console.log(`   📈 Total Score: ${scores.total}/100`);
    console.log(`   📊 Pillar Breakdown:`);
    console.log(`      Content Structure: ${scores.contentStructure}/30`);
    console.log(`      Brand Ranking: ${scores.brandRanking}/10`);
    console.log(`      Website Technical: ${scores.websiteTechnical}/18`);
    console.log(`      Keyword Visibility: ${scores.keywordVisibility}/25`);
    console.log(`      AI Trust: ${scores.aiTrust}/25`);
    console.log(`   📡 Data Sources:`);
    console.log(`      Moz: ${scores.dataSource.moz ? '✅' : '❌'}`);
    console.log(`      DataForSEO: ${scores.dataSource.dataforseo ? '✅' : '❌'}`);
    console.log(`      GSC: ${scores.dataSource.gsc ? '✅' : '❌'}`);
    console.log(`      PageSpeed: ${scores.dataSource.pagespeed ? '✅' : '❌'}`);
    console.log(`      Scraping: ${scores.dataSource.scraping ? '✅' : '❌'}`);

    // Show key recommendations
    if (scores.total < 70) {
      console.log(`\n   💡 Key Recommendations:`);
      const breakdown = scores.breakdown;
      
      if (breakdown.contentStructure.schema.score < 4) {
        console.log(`      - Add Schema markup (${breakdown.contentStructure.schema.score}/9)`);
      }
      if (breakdown.websiteTechnical.lcp.score < 3) {
        console.log(`      - Optimize LCP (${breakdown.websiteTechnical.lcp.value})`);
      }
      if (breakdown.aiTrust.backlinks.score < 3) {
        console.log(`      - Build more backlinks (${breakdown.aiTrust.backlinks.value})`);
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    console.error(error);
  }
  console.log('');

  // ===== TEST 8: Fallback Chain Verification =====
  console.log('🔄 TEST 8: Fallback Chain Verification');
  console.log('-'.repeat(70));
  const unified = await getUnifiedSEOMetrics(url);
  console.log(`   Expected Flow: Common Crawl → Moz → Estimates`);
  console.log(`   Actual Flow:`);
  console.log(`      Keywords: ${unified.source.keywords}`);
  console.log(`      Backlinks: ${unified.source.backlinks}`);
  
  if (unified.source.backlinks === 'commoncrawl') {
    console.log(`   ✅ Common Crawl provided backlink data`);
  } else if (unified.source.backlinks === 'moz') {
    console.log(`   ✅ Moz API provided backlink data (Common Crawl fallback worked)`);
  } else {
    console.log(`   ⚠️  Using estimates (no API data available)`);
    console.log(`   💡 Recommendation: Configure Moz API for backlink data`);
  }
  console.log('');

  // ===== SUMMARY =====
  console.log('='.repeat(70));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`   URL: ${url}`);
  console.log(`   Domain: ${domain}`);
  console.log(`   APIs Configured: ${Object.values(apiStatus).filter(Boolean).length}/4`);
  console.log(`   Backlink Source: ${unified.source.backlinks}`);
  console.log(`   Keyword Source: ${unified.source.keywords}`);
  console.log('');
  console.log('✅ All tests completed!\n');
}

testAllFeatures().catch(console.error);

