/**
 * Multi-URL Test Script
 * Tests multiple URLs from the same domain to verify system consistency
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-multiple-urls.ts
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
import { scrapeWebsite } from '../lib/modules/scraper';
import { analyzePageSpeed } from '../lib/modules/pagespeed';
import { calculateTotalScore } from '../lib/modules/scoring';
import { toMozMetrics, toKeywordMetrics } from '../lib/modules/api-manager';
import { getMozMetrics } from '../lib/modules/moz';

interface TestResult {
  url: string;
  domain: string;
  content: {
    wordCount: number;
    h1Count: number;
    h2Count: number;
    schema: boolean;
    schemaTypes: number;
    images: number;
    imagesWithAlt: number;
  };
  pagespeed: {
    mobileScore: number;
    performanceScore: number;
    lcp: number;
    cls: number;
  };
  seo: {
    keywordsTotal: number;
    keywordsSource: string;
    backlinksTotal: number;
    referringDomains: number;
    backlinksSource: string;
  };
  scores: {
    total: number;
    contentStructure: number;
    websiteTechnical: number;
    keywordVisibility: number;
    aiTrust: number;
  };
  errors: string[];
}

async function testUrl(url: string): Promise<TestResult> {
  const domain = new URL(url).hostname.replace('www.', '');
  
  try {
    console.log(`\n🔍 Testing: ${url}`);
    console.log(`   Domain: ${domain}`);
    
    // Run all analyses in parallel
    const [scraping, pagespeed, mozData, unified] = await Promise.all([
      scrapeWebsite(url),
      analyzePageSpeed(url),
      getMozMetrics(url),
      getUnifiedSEOMetrics(url)
    ]);

    const keywordData = toKeywordMetrics(unified);
    const enhancedMoz = toMozMetrics(unified, mozData);
    const scores = await calculateTotalScore(scraping, pagespeed, enhancedMoz, keywordData);

    return {
      url,
      domain,
      content: {
        wordCount: scraping.wordCount,
        h1Count: scraping.h1.length,
        h2Count: scraping.h2.length,
        schema: scraping.hasSchema,
        schemaTypes: scraping.schemaTypes.length,
        images: scraping.imageCount,
        imagesWithAlt: scraping.imagesWithAlt,
      },
      pagespeed: {
        mobileScore: pagespeed.mobileScore || 0,
        performanceScore: pagespeed.performanceScore || 0,
        lcp: pagespeed.lcp || 0,
        cls: pagespeed.cls || 0,
      },
      seo: {
        keywordsTotal: unified.keywords.total,
        keywordsSource: unified.source.keywords,
        backlinksTotal: unified.backlinks.total,
        referringDomains: unified.backlinks.referringDomains,
        backlinksSource: unified.source.backlinks,
      },
      scores: {
        total: scores.total,
        contentStructure: scores.contentStructure,
        websiteTechnical: scores.websiteTechnical,
        keywordVisibility: scores.keywordVisibility,
        aiTrust: scores.aiTrust,
      },
      errors: unified.errors,
    };
  } catch (error: any) {
    console.error(`❌ Error testing ${url}:`, error.message);
    return {
      url,
      domain,
      content: { wordCount: 0, h1Count: 0, h2Count: 0, schema: false, schemaTypes: 0, images: 0, imagesWithAlt: 0 },
      pagespeed: { mobileScore: 0, performanceScore: 0, lcp: 0, cls: 0 },
      seo: { keywordsTotal: 0, keywordsSource: 'error', backlinksTotal: 0, referringDomains: 0, backlinksSource: 'error' },
      scores: { total: 0, contentStructure: 0, websiteTechnical: 0, keywordVisibility: 0, aiTrust: 0 },
      errors: [error.message],
    };
  }
}

async function testMultipleUrls() {
  console.log('🧪 Multi-URL Feature Test');
  console.log('='.repeat(80));
  
  const urls = [
    'https://www.msig-thai.com/th',
    'https://www.msig-thai.com/th/insurance/personal-insurance#travel'
  ];

  // Check API status first
  console.log('\n📡 API Status Check');
  console.log('-'.repeat(80));
  const apiStatus = getAPIStatus();
  // Ahrefs removed - using Google Custom Search instead
  console.log(`   DataForSEO:    ${apiStatus.dataforseo ? '✅' : '❌'}`);
  console.log(`   Moz:           ${apiStatus.moz ? '✅' : '❌'}`);
  console.log(`   Common Crawl:  ${apiStatus.commoncrawl ? '✅' : '❌'}`);

  // Test each URL
  console.log(`\n📊 Testing ${urls.length} URLs...`);
  const results: TestResult[] = [];
  
  for (const url of urls) {
    const result = await testUrl(url);
    results.push(result);
  }

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.url}`);
    console.log('-'.repeat(80));
    
    console.log(`   📄 Content:`);
    console.log(`      Words: ${result.content.wordCount.toLocaleString()}`);
    console.log(`      H1: ${result.content.h1Count}, H2: ${result.content.h2Count}`);
    console.log(`      Schema: ${result.content.schema ? '✅' : '❌'} (${result.content.schemaTypes} types)`);
    console.log(`      Images: ${result.content.images} (${result.content.imagesWithAlt} with alt)`);
    
    console.log(`\n   ⚡ PageSpeed:`);
    console.log(`      Mobile: ${result.pagespeed.mobileScore}/100`);
    console.log(`      Performance: ${result.pagespeed.performanceScore}/100`);
    console.log(`      LCP: ${result.pagespeed.lcp.toFixed(2)}s`);
    console.log(`      CLS: ${result.pagespeed.cls.toFixed(3)}`);
    
    console.log(`\n   🔍 SEO Metrics:`);
    console.log(`      Keywords: ${result.seo.keywordsTotal} (source: ${result.seo.keywordsSource})`);
    console.log(`      Backlinks: ${result.seo.backlinksTotal.toLocaleString()} (${result.seo.referringDomains} domains, source: ${result.seo.backlinksSource})`);
    
    console.log(`\n   📊 Scores:`);
    console.log(`      Total: ${result.scores.total}/100`);
    console.log(`      Content Structure: ${result.scores.contentStructure}/25`);
    console.log(`      Website Technical: ${result.scores.websiteTechnical}/17`);
    console.log(`      Keyword Visibility: ${result.scores.keywordVisibility}/23`);
    console.log(`      AI Trust: ${result.scores.aiTrust}/22`);
    
    if (result.errors.length > 0) {
      console.log(`\n   ⚠️  Errors:`);
      result.errors.forEach(err => console.log(`      - ${err}`));
    }
  });

  // Comparison table
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPARISON TABLE');
  console.log('='.repeat(80));
  
  console.log('\nContent Comparison:');
  console.log('URL'.padEnd(60) + 'Words'.padEnd(10) + 'H1'.padEnd(5) + 'H2'.padEnd(5) + 'Schema'.padEnd(8) + 'Images');
  console.log('-'.repeat(100));
  results.forEach(r => {
    const shortUrl = r.url.length > 55 ? r.url.substring(0, 52) + '...' : r.url;
    console.log(
      shortUrl.padEnd(60) +
      r.content.wordCount.toString().padEnd(10) +
      r.content.h1Count.toString().padEnd(5) +
      r.content.h2Count.toString().padEnd(5) +
      (r.content.schema ? '✅' : '❌').padEnd(8) +
      r.content.images.toString()
    );
  });

  console.log('\nPageSpeed Comparison:');
  console.log('URL'.padEnd(60) + 'Mobile'.padEnd(10) + 'Perf'.padEnd(10) + 'LCP'.padEnd(10) + 'CLS');
  console.log('-'.repeat(100));
  results.forEach(r => {
    const shortUrl = r.url.length > 55 ? r.url.substring(0, 52) + '...' : r.url;
    console.log(
      shortUrl.padEnd(60) +
      `${r.pagespeed.mobileScore}/100`.padEnd(10) +
      `${r.pagespeed.performanceScore}/100`.padEnd(10) +
      `${r.pagespeed.lcp.toFixed(2)}s`.padEnd(10) +
      r.pagespeed.cls.toFixed(3)
    );
  });

  console.log('\nScore Comparison:');
  console.log('URL'.padEnd(60) + 'Total'.padEnd(10) + 'Content'.padEnd(10) + 'Technical'.padEnd(12) + 'Keywords'.padEnd(12) + 'AI Trust');
  console.log('-'.repeat(110));
  results.forEach(r => {
    const shortUrl = r.url.length > 55 ? r.url.substring(0, 52) + '...' : r.url;
    console.log(
      shortUrl.padEnd(60) +
      `${r.scores.total}/100`.padEnd(10) +
      `${r.scores.contentStructure}/25`.padEnd(10) +
      `${r.scores.websiteTechnical}/17`.padEnd(12) +
      `${r.scores.keywordVisibility}/23`.padEnd(12) +
      `${r.scores.aiTrust}/22`
    );
  });

  // Statistics
  console.log('\n' + '='.repeat(80));
  console.log('📈 STATISTICS');
  console.log('='.repeat(80));
  
  const avgWordCount = results.reduce((sum, r) => sum + r.content.wordCount, 0) / results.length;
  const avgScore = results.reduce((sum, r) => sum + r.scores.total, 0) / results.length;
  const avgPageSpeed = results.reduce((sum, r) => sum + r.pagespeed.mobileScore, 0) / results.length;
  
  console.log(`   Average Word Count: ${Math.round(avgWordCount).toLocaleString()}`);
  console.log(`   Average Total Score: ${Math.round(avgScore)}/100`);
  console.log(`   Average PageSpeed: ${Math.round(avgPageSpeed)}/100`);
  console.log(`   Pages with Schema: ${results.filter(r => r.content.schema).length}/${results.length}`);
  console.log(`   Pages with Errors: ${results.filter(r => r.errors.length > 0).length}/${results.length}`);

  // Domain consistency check
  const domains = new Set(results.map(r => r.domain));
  if (domains.size === 1) {
    console.log(`\n   ✅ All URLs from same domain: ${Array.from(domains)[0]}`);
  } else {
    console.log(`\n   ⚠️  Multiple domains detected: ${Array.from(domains).join(', ')}`);
  }

  // SEO source consistency
  const keywordSources = new Set(results.map(r => r.seo.keywordsSource));
  const backlinkSources = new Set(results.map(r => r.seo.backlinksSource));
  console.log(`   Keyword Sources: ${Array.from(keywordSources).join(', ')}`);
  console.log(`   Backlink Sources: ${Array.from(backlinkSources).join(', ')}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Multi-URL test completed!\n');
}

testMultipleUrls().catch(console.error);


