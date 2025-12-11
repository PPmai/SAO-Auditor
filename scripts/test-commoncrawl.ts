/**
 * Test Common Crawl Integration
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-commoncrawl.ts
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

import { 
  getBacklinkMetrics,
  getReferringDomains,
  getAnchorText,
  isCommonCrawlAvailable
} from '../lib/modules/commoncrawl';

async function testCommonCrawl() {
  console.log('🔍 Testing Common Crawl Integration\n');
  console.log('='.repeat(60));

  const domain = 'msig-thai.com';
  const url = 'https://www.msig-thai.com/en';

  console.log(`📅 Testing with domain: ${domain}`);
  console.log(`🌐 URL: ${url}\n`);

  // Check availability
  console.log('1️⃣ Checking Common Crawl availability...');
  const available = isCommonCrawlAvailable();
  console.log(`   ${available ? '✅' : '❌'} Common Crawl: ${available ? 'Available' : 'Not Available'}\n`);

  if (!available) {
    console.log('❌ Common Crawl is not available. Exiting.');
    process.exit(1);
  }

  // Test backlink metrics
  console.log('2️⃣ Fetching Backlink Metrics...');
  try {
    const metrics = await getBacklinkMetrics(domain);
    if (metrics.error) {
      console.log(`   ⚠️  ${metrics.error}`);
    } else {
      console.log(`   ✅ Backlink Profile:`);
      console.log(`   🔗 Total Backlinks: ${metrics.backlinks.toLocaleString()}`);
      console.log(`   🌐 Referring Domains: ${metrics.referringDomains.toLocaleString()}`);
      console.log(`   ⭐ Domain Rating: ${metrics.domainRating} (not available from Common Crawl)`);
      console.log(`   📝 Anchor Text Samples: ${metrics.anchorText.length > 0 ? metrics.anchorText.slice(0, 5).map(a => `"${a.text}" (${a.count}x)`).join(', ') : 'None found'}`);
      console.log(`   🔗 Outbound Links: ${metrics.outboundLinks} (not yet implemented)`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Test referring domains
  console.log('3️⃣ Fetching Referring Domains Count...');
  try {
    const domains = await getReferringDomains(domain);
    console.log(`   ✅ Unique Referring Domains: ${domains.toLocaleString()}`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Test anchor text
  console.log('4️⃣ Fetching Anchor Text Distribution...');
  try {
    const anchors = await getAnchorText(domain);
    if (anchors.length === 0) {
      console.log('   ⚠️  No anchor text found (requires WARC file processing for full data)');
    } else {
      console.log(`   ✅ Found ${anchors.length} unique anchor texts`);
      console.log(`   📊 Top 10 Anchor Texts:`);
      anchors.slice(0, 10).forEach((anchor, i) => {
        console.log(`      ${(i + 1).toString().padStart(2)}. "${anchor.text}" (${anchor.count}x)`);
      });
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test Complete!\n');

  console.log('💡 Notes:');
  console.log('   - Common Crawl data is 1-3 months old');
  console.log('   - Domain Rating (DR) is not available (proprietary Ahrefs metric)');
  console.log('   - Full anchor text requires WARC file processing');
  console.log('   - Outbound links analysis not yet implemented');
}

testCommonCrawl().catch(console.error);

