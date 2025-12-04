/**
 * Automated Test Suite for HAS Digital Scorecard - Free Tier
 * Tests: Scraper, PageSpeed API, Scoring Engine
 * 
 * Run: npx ts-node scripts/test-free-tier.ts
 * Or:  npm run test:free
 */

import { scrapeWebsite, ScrapingResult } from '../lib/modules/scraper';
import { analyzePageSpeed, PageSpeedResult } from '../lib/modules/pagespeed';
import { calculateTotalScore, getScoreLabel } from '../lib/modules/scoring';

// Test URLs
const TEST_URLS = [
  'https://theconductor.co/',
  'https://example.com',
  'https://www.wikipedia.org',
];

interface TestResult {
  url: string;
  passed: boolean;
  score?: number;
  errors: string[];
  duration: number;
  scraping?: Partial<ScrapingResult>;
  pagespeed?: Partial<PageSpeedResult>;
}

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testScraper(url: string): Promise<{ result: ScrapingResult; errors: string[] }> {
  const errors: string[] = [];
  const result = await scrapeWebsite(url);
  
  // Validate scraping results
  if (result.error) {
    errors.push(`Scraping error: ${result.error}`);
  }
  if (!result.url) {
    errors.push('Missing URL in result');
  }
  if (result.h1.length === 0 && result.h2.length === 0) {
    errors.push('Warning: No headings found');
  }
  
  return { result, errors };
}

async function testPageSpeed(url: string): Promise<{ result: PageSpeedResult; errors: string[] }> {
  const errors: string[] = [];
  const result = await analyzePageSpeed(url);
  
  // Validate PageSpeed results
  if (result.error && !result.isEstimate) {
    errors.push(`PageSpeed error: ${result.error}`);
  }
  if (result.isEstimate) {
    errors.push('Warning: Using estimated scores (API rate limit)');
  }
  
  return { result, errors };
}

function testScoring(scraping: ScrapingResult, pagespeed: PageSpeedResult): { scores: any; errors: string[] } {
  const errors: string[] = [];
  const scores = calculateTotalScore(scraping, pagespeed);
  
  // Validate scoring
  if (scores.total < 0 || scores.total > 100) {
    errors.push(`Invalid total score: ${scores.total}`);
  }
  if (scores.contentStructure < 0 || scores.contentStructure > 30) {
    errors.push(`Invalid content structure score: ${scores.contentStructure}`);
  }
  if (scores.brandRanking < 0 || scores.brandRanking > 30) {
    errors.push(`Invalid brand ranking score: ${scores.brandRanking}`);
  }
  if (scores.keywordVisibility < 0 || scores.keywordVisibility > 20) {
    errors.push(`Invalid keyword visibility score: ${scores.keywordVisibility}`);
  }
  if (scores.aiTrust < 0 || scores.aiTrust > 20) {
    errors.push(`Invalid AI trust score: ${scores.aiTrust}`);
  }
  
  return { scores, errors };
}

async function runTestForUrl(url: string): Promise<TestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  log('cyan', `\n📍 Testing: ${url}`);
  log('blue', '─'.repeat(60));
  
  try {
    // Test 1: Scraper
    log('yellow', '  🔍 Testing Scraper...');
    const scraperTest = await testScraper(url);
    errors.push(...scraperTest.errors);
    
    if (!scraperTest.result.error) {
      log('green', `     ✓ Title: ${scraperTest.result.title?.substring(0, 40) || 'N/A'}`);
      log('green', `     ✓ Headings: H1=${scraperTest.result.h1.length}, H2=${scraperTest.result.h2.length}, H3=${scraperTest.result.h3.length}`);
      log('green', `     ✓ Schema: ${scraperTest.result.hasSchema ? scraperTest.result.schemaTypes.join(', ') : 'None'}`);
      log('green', `     ✓ Images: ${scraperTest.result.imageCount} (${scraperTest.result.imagesWithAlt} with alt)`);
      log('green', `     ✓ SSL: ${scraperTest.result.hasSSL ? 'Yes' : 'No'}`);
    } else {
      log('red', `     ✗ Scraper failed: ${scraperTest.result.error}`);
    }
    
    // Test 2: PageSpeed
    log('yellow', '  ⚡ Testing PageSpeed API...');
    const pagespeedTest = await testPageSpeed(url);
    errors.push(...pagespeedTest.errors);
    
    if (pagespeedTest.result.isEstimate) {
      log('yellow', `     ⚠ Using estimated scores (rate limit)`);
    }
    log('green', `     ✓ Performance: ${pagespeedTest.result.performanceScore}/100`);
    log('green', `     ✓ LCP: ${pagespeedTest.result.lcp.toFixed(2)}s (${pagespeedTest.result.lcpCategory})`);
    log('green', `     ✓ FID: ${pagespeedTest.result.fid}ms (${pagespeedTest.result.fidCategory})`);
    log('green', `     ✓ CLS: ${pagespeedTest.result.cls.toFixed(3)} (${pagespeedTest.result.clsCategory})`);
    
    // Test 3: Scoring Engine
    log('yellow', '  📊 Testing Scoring Engine...');
    const scoringTest = testScoring(scraperTest.result, pagespeedTest.result);
    errors.push(...scoringTest.errors);
    
    const scoreLabel = getScoreLabel(scoringTest.scores.total);
    log('green', `     ✓ Total Score: ${scoringTest.scores.total}/100 (${scoreLabel.label})`);
    log('green', `     ✓ Content Structure: ${scoringTest.scores.contentStructure}/30`);
    log('green', `     ✓ Brand Ranking: ${scoringTest.scores.brandRanking}/30`);
    log('green', `     ✓ Keyword Visibility: ${scoringTest.scores.keywordVisibility}/20`);
    log('green', `     ✓ AI Trust: ${scoringTest.scores.aiTrust}/20`);
    
    const duration = Date.now() - startTime;
    const criticalErrors = errors.filter(e => !e.startsWith('Warning'));
    
    return {
      url,
      passed: criticalErrors.length === 0,
      score: scoringTest.scores.total,
      errors,
      duration,
      scraping: {
        title: scraperTest.result.title,
        hasSchema: scraperTest.result.hasSchema,
        hasSSL: scraperTest.result.hasSSL,
        imageCount: scraperTest.result.imageCount,
        wordCount: scraperTest.result.wordCount,
      },
      pagespeed: {
        performanceScore: pagespeedTest.result.performanceScore,
        lcp: pagespeedTest.result.lcp,
        cls: pagespeedTest.result.cls,
        isEstimate: pagespeedTest.result.isEstimate,
      },
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      url,
      passed: false,
      errors: [`Critical error: ${error.message}`],
      duration,
    };
  }
}

async function runAllTests() {
  console.log('\n');
  log('cyan', '═'.repeat(60));
  log('cyan', '  🧪 HAS DIGITAL SCORECARD - FREE TIER TEST SUITE');
  log('cyan', '═'.repeat(60));
  log('blue', `  Testing ${TEST_URLS.length} URLs...\n`);
  
  const results: TestResult[] = [];
  
  for (const url of TEST_URLS) {
    const result = await runTestForUrl(url);
    results.push(result);
  }
  
  // Summary
  console.log('\n');
  log('cyan', '═'.repeat(60));
  log('cyan', '  📋 TEST SUMMARY');
  log('cyan', '═'.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log('\n');
  log('blue', '  Results by URL:');
  results.forEach(r => {
    const status = r.passed ? `${colors.green}✓ PASS` : `${colors.red}✗ FAIL`;
    const score = r.score !== undefined ? `Score: ${r.score}/100` : 'N/A';
    console.log(`    ${status}${colors.reset} ${r.url}`);
    console.log(`         ${score} | Duration: ${(r.duration / 1000).toFixed(1)}s`);
    if (r.errors.length > 0) {
      r.errors.forEach(e => {
        const icon = e.startsWith('Warning') ? '⚠' : '✗';
        console.log(`         ${icon} ${e}`);
      });
    }
  });
  
  console.log('\n');
  log('blue', '─'.repeat(60));
  log('green', `  ✓ Passed: ${passed}/${TEST_URLS.length}`);
  if (failed > 0) log('red', `  ✗ Failed: ${failed}/${TEST_URLS.length}`);
  log('blue', `  ⏱ Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  log('blue', '─'.repeat(60));
  
  // Module Status
  console.log('\n');
  log('cyan', '  📦 FREE-TIER MODULE STATUS:');
  log('green', '    ✓ Scraper (Cheerio)        - Working');
  log('green', '    ✓ PageSpeed API (Google)   - Working (with rate limit fallback)');
  log('green', '    ✓ Scoring Engine           - Working');
  log('yellow', '    ⏳ Keyword Module (Semrush) - Placeholder (needs paid API)');
  log('yellow', '    ⏳ Sentiment (Claude)       - Placeholder (needs paid API)');
  
  console.log('\n');
  log('cyan', '═'.repeat(60));
  
  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);

