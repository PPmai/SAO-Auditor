#!/usr/bin/env node
/**
 * Quick URL Test Script for HAS Digital Scorecard
 * Usage: node scripts/test-url.js [url]
 * Default: https://theconductor.co/
 */

const http = require('http');

const url = process.argv[2] || 'https://theconductor.co/';

console.log('\n🧪 HAS Digital Scorecard - Quick Test');
console.log('═'.repeat(50));
console.log(`Testing: ${url}\n`);

const data = JSON.stringify({ url });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/scan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      
      if (result.error) {
        console.log('❌ Error:', result.error);
        process.exit(1);
      }
      
      console.log('📊 RESULTS');
      console.log('─'.repeat(50));
      console.log(`Total Score: ${result.score}/100 (${result.scoreLabel.label})`);
      console.log('');
      console.log('Pillar Breakdown:');
      console.log(`  📝 Content Structure:  ${result.scores.contentStructure}/30`);
      console.log(`  🏢 Brand Ranking:      ${result.scores.brandRanking}/30`);
      console.log(`  🔍 Keyword Visibility: ${result.scores.keywordVisibility}/20`);
      console.log(`  🤖 AI Trust:           ${result.scores.aiTrust}/20`);
      console.log('');
      console.log('Top Recommendations:');
      result.recommendations.slice(0, 3).forEach((r, i) => {
        const icon = r.priority === 'HIGH' ? '🔴' : r.priority === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`  ${i + 1}. ${icon} ${r.title.substring(0, 45)}`);
      });
      console.log('');
      console.log('Raw Data:');
      const s = result.rawData.scraping;
      console.log(`  Title: ${(s.title || 'N/A').substring(0, 40)}`);
      console.log(`  Schema: ${s.hasSchema ? s.schemaTypes.join(', ') : 'None'}`);
      console.log(`  SSL: ${s.hasSSL ? '✓' : '✗'} | Images: ${s.imageCount} | Words: ${s.wordCount}`);
      console.log('═'.repeat(50));
      console.log('✅ Test Complete!\n');
      
    } catch (e) {
      console.log('❌ Failed to parse response:', e.message);
      console.log('Raw response:', body.substring(0, 200));
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Connection error:', e.message);
  console.log('Make sure the server is running: npm run dev');
  process.exit(1);
});

req.setTimeout(120000, () => {
  console.log('❌ Request timeout (120s)');
  req.destroy();
  process.exit(1);
});

req.write(data);
req.end();

