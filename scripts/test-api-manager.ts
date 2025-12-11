/**
 * Test API Manager with Common Crawl fallback
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-api-manager.ts
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

async function testAPIManager() {
  console.log('🔍 Testing API Manager with Common Crawl Integration\n');
  console.log('='.repeat(60));

  const url = 'https://www.msig-thai.com/en';
  const domain = 'msig-thai.com';

  console.log(`📅 Testing with URL: ${url}`);
  console.log(`🌐 Domain: ${domain}\n`);

  // Check API status
  console.log('1️⃣ Checking API Status...');
  const status = getAPIStatus();
  // Ahrefs removed - using Google Custom Search instead
  console.log(`   📡 API Status:`);
  // Ahrefs removed - using Google Custom Search instead
  console.log(`      DataForSEO: ${status.dataforseo ? '✅' : '❌'}`);
  console.log(`      Moz: ${status.moz ? '✅' : '❌'}`);
  console.log(`      Common Crawl: ${status.commoncrawl ? '✅' : '❌'}\n`);

  // Test unified metrics
  console.log('2️⃣ Fetching Unified SEO Metrics (with fallback chain)...');
  console.log('   Expected flow: Common Crawl → Moz → Estimates\n');
  
  try {
    const metrics = await getUnifiedSEOMetrics(url);
    
    console.log(`\n   ✅ Results:`);
    console.log(`   📊 Keywords:`);
    console.log(`      Total: ${metrics.keywords.total}`);
    console.log(`      Top 10: ${metrics.keywords.top10}`);
    console.log(`      Avg Position: ${metrics.keywords.avgPosition}`);
    console.log(`      Source: ${metrics.source.keywords}`);
    
    console.log(`\n   🔗 Backlinks:`);
    console.log(`      Total: ${metrics.backlinks.total.toLocaleString()}`);
    console.log(`      Referring Domains: ${metrics.backlinks.referringDomains.toLocaleString()}`);
    console.log(`      Domain Rating: ${metrics.backlinks.domainRating}`);
    console.log(`      Domain Authority: ${metrics.backlinks.domainAuthority}`);
    console.log(`      Source: ${metrics.source.backlinks}`);
    
    if (metrics.errors.length > 0) {
      console.log(`\n   ⚠️  Errors:`);
      metrics.errors.forEach(err => console.log(`      - ${err}`));
    }
    
    console.log(`\n   📈 Summary:`);
    console.log(`      Keywords from: ${metrics.source.keywords}`);
    console.log(`      Backlinks from: ${metrics.source.backlinks}`);
    
    if (metrics.source.backlinks === 'commoncrawl') {
      console.log(`\n   ✅ Common Crawl provided backlink data!`);
    } else if (metrics.source.backlinks === 'moz') {
      console.log(`\n   ✅ Moz API provided backlink data (Common Crawl fallback worked)`);
    } else {
      console.log(`\n   ⚠️  Using estimates (no API data available)`);
    }
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    console.error(error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test Complete!\n');
}

testAPIManager().catch(console.error);

