/**
 * Query theconductor.co using Ahrefs API
 * Tries both direct API and shows results
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/query-theconductor.ts
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
  getUrlKeywords, 
  getBacklinkMetrics,
  isAhrefsConfigured
} from '../lib/modules/ahrefs';

async function queryTheConductor() {
  console.log('🔍 Querying Ahrefs for theconductor.co\n');
  console.log('='.repeat(60));

  if (!isAhrefsConfigured()) {
    console.log('❌ Ahrefs API key not found in .env');
    console.log('   Please add: AHREFS_API_KEY=your_key_here');
    process.exit(1);
  }

  const domain = 'theconductor.co';
  const url = 'https://theconductor.co';
  const date = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  console.log(`📅 Using date: ${date}\n`);

  // 1. Domain Rating
  console.log('1️⃣ Fetching Domain Rating...');
  try {
    // Try to get domain rating from backlinks endpoint
    const backlinks = await getBacklinkMetrics(domain);
    if (backlinks.error) {
      console.log(`   ⚠️  ${backlinks.error}`);
    } else {
      console.log(`   ✅ Domain Rating (DR): ${backlinks.domainRating}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // 2. Top 10 Organic Keywords
  console.log('2️⃣ Fetching Top 10 Organic Keywords...');
  try {
    const keywords = await getUrlKeywords(url, 'us');
    if (keywords.error) {
      console.log(`   ⚠️  ${keywords.error}`);
    } else if (keywords.totalKeywords === 0) {
      console.log('   ⚠️  No keywords found');
    } else {
      console.log(`   ✅ Found ${keywords.totalKeywords} total keywords`);
      console.log(`   📊 Average Position: #${keywords.averagePosition}`);
      console.log(`   📈 Estimated Traffic: ${keywords.estimatedTraffic.toLocaleString()}/month\n`);
      
      console.log('   Top 10 Keywords:');
      keywords.keywords.slice(0, 10).forEach((k, i) => {
        const intent = [];
        if (k.is_informational) intent.push('Info');
        if (k.is_commercial) intent.push('Comm');
        if (k.is_transactional) intent.push('Trans');
        if (k.is_navigational) intent.push('Nav');
        
        console.log(`   ${(i + 1).toString().padStart(2)}. "${k.keyword}"`);
        console.log(`      Position: #${k.position} | Traffic: ${k.traffic.toLocaleString()} | Intent: ${intent.join(', ') || 'Unknown'}`);
      });
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // 3. Backlinks and Referring Domains
  console.log('3️⃣ Fetching Backlink Statistics...');
  try {
    const backlinks = await getBacklinkMetrics(domain);
    if (backlinks.error) {
      console.log(`   ⚠️  ${backlinks.error}`);
    } else {
      console.log(`   ✅ Backlink Profile:`);
      console.log(`   🔗 Total Backlinks: ${backlinks.backlinks.toLocaleString()}`);
      console.log(`   🌐 Referring Domains: ${backlinks.referringDomains.toLocaleString()}`);
      console.log(`   ⭐ Domain Rating: ${backlinks.domainRating}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Query Complete!\n');

  console.log('💡 Note:');
  console.log('   - If you see "Insufficient plan" errors, you need Enterprise plan for custom domains');
  console.log('   - Test domains (ahrefs.com, wordcount.com) work with any plan');
  console.log('   - For production, consider using DataForSEO or Moz APIs (already integrated)');
}

queryTheConductor().catch(console.error);




