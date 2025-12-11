/**
 * Test Ahrefs API with theconductor.co
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-ahrefs.ts
 */

// Load environment variables from .env file
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

import { 
  getUrlKeywords, 
  getBacklinkMetrics,
  getSerpCompetitors,
  getKeywordBenchmark,
  isAhrefsConfigured,
  testAhrefsConnection
} from '../lib/modules/ahrefs';

async function testAhrefs() {
  console.log('🧪 Testing Ahrefs API Integration\n');
  console.log('=' .repeat(60));

  // Check configuration
  if (!isAhrefsConfigured()) {
    console.log('❌ Ahrefs API not configured');
    console.log('   Please add AHREFS_API_KEY to your .env file');
    console.log('   Get your API key from: https://ahrefs.com/settings/api');
    process.exit(1);
  }

  console.log('✅ Ahrefs API configured\n');

  // Test connection
  console.log('1️⃣ Testing API Connection...');
  const connectionTest = await testAhrefsConnection();
  console.log(`   ${connectionTest.success ? '✅' : '⚠️'} ${connectionTest.message}\n`);

  if (!connectionTest.success) {
    console.log('⚠️  Connection test failed, but continuing with theconductor.co test...');
    console.log('   Note: API v3 requires Enterprise plan. Some endpoints may not work.\n');
  }

  const testUrl = 'https://theconductor.co';
  const testDomain = 'theconductor.co';

  // Test 1: Get Keywords for URL
  console.log('2️⃣ Fetching Organic Keywords...');
  console.log(`   URL: ${testUrl}\n`);
  try {
    const keywordMetrics = await getUrlKeywords(testUrl);
    
    if (keywordMetrics.error) {
      console.log(`   ❌ Error: ${keywordMetrics.error}\n`);
    } else {
      console.log(`   ✅ Found ${keywordMetrics.totalKeywords} keywords`);
      console.log(`   📊 Average Position: #${keywordMetrics.averagePosition}`);
      console.log(`   📈 Estimated Traffic: ${keywordMetrics.estimatedTraffic.toLocaleString()}`);
      console.log(`   🎯 Dominant Intent: ${keywordMetrics.intentBreakdown.dominant} (${keywordMetrics.intentBreakdown.matchPercent}% match)`);
      console.log(`\n   Intent Breakdown:`);
      console.log(`   - Informational: ${keywordMetrics.intentBreakdown.informational.count} (${keywordMetrics.intentBreakdown.informational.percent}%)`);
      console.log(`   - Commercial: ${keywordMetrics.intentBreakdown.commercial.count} (${keywordMetrics.intentBreakdown.commercial.percent}%)`);
      console.log(`   - Transactional: ${keywordMetrics.intentBreakdown.transactional.count} (${keywordMetrics.intentBreakdown.transactional.percent}%)`);
      console.log(`   - Navigational: ${keywordMetrics.intentBreakdown.navigational.count} (${keywordMetrics.intentBreakdown.navigational.percent}%)`);
      
      if (keywordMetrics.keywords.length > 0) {
        console.log(`\n   Top 5 Keywords:`);
        keywordMetrics.keywords.slice(0, 5).forEach((k, i) => {
          console.log(`   ${i + 1}. "${k.keyword}" - Position #${k.position}, Traffic: ${k.traffic}`);
        });
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Get Backlink Metrics
  console.log('3️⃣ Fetching Backlink Metrics...');
  console.log(`   Domain: ${testDomain}\n`);
  try {
    const backlinkMetrics = await getBacklinkMetrics(testDomain);
    
    if (backlinkMetrics.error) {
      console.log(`   ❌ Error: ${backlinkMetrics.error}\n`);
    } else {
      console.log(`   ✅ Backlink Profile:`);
      console.log(`   🔗 Total Backlinks: ${backlinkMetrics.backlinks.toLocaleString()}`);
      console.log(`   🌐 Referring Domains: ${backlinkMetrics.referringDomains.toLocaleString()}`);
      console.log(`   ⭐ Domain Rating (DR): ${backlinkMetrics.domainRating}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Get Keyword Benchmark (if keywords found)
  console.log('4️⃣ Calculating Keyword Benchmark...\n');
  try {
    const keywordMetrics = await getUrlKeywords(testUrl);
    if (keywordMetrics.totalKeywords > 0 && keywordMetrics.keywords.length > 0) {
      const primaryKeyword = keywordMetrics.keywords[0].keyword;
      console.log(`   Primary Keyword: "${primaryKeyword}"\n`);
      
      const benchmark = await getKeywordBenchmark(testUrl);
      console.log(`   ✅ Benchmark: ${benchmark.benchmark} keywords (average of competitors)`);
      
      if (benchmark.competitors.length > 0) {
        console.log(`\n   Top Competitors:`);
        benchmark.competitors.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.url} - ${c.keywordCount} keywords`);
        });
      }
    } else {
      console.log('   ⚠️  No keywords found, cannot calculate benchmark');
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Ahrefs API Test Complete!\n');
}

testAhrefs().catch(console.error);

