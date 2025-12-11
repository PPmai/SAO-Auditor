/**
 * Test Feature Status for a URL
 * Checks which features are working and which are unavailable
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-feature-status.ts [url]
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

import { getAPIStatus } from '../lib/modules/api-manager';
import axios from 'axios';

const testUrl = process.argv[2] || 'https://theconductor.co';
const API_URL = process.argv[3] || 'http://localhost:3000/api/scan';

async function testFeatureStatus() {
  console.log('\n🔍 Testing Feature Status');
  console.log('='.repeat(70));
  console.log(`URL: ${testUrl}\n`);

  // Check API Configuration
  console.log('📡 API Configuration Status:');
  console.log('-'.repeat(70));
  const apiStatus = getAPIStatus();
  
  const apiChecks = [
    { name: 'Google Custom Search', status: apiStatus.googleCustomSearch, usedFor: 'Brand Search, Keyword Discovery, Ranking' },
    { name: 'DataForSEO API', status: apiStatus.dataforseo, usedFor: 'Keywords, Positions' },
    { name: 'Moz API', status: apiStatus.moz, usedFor: 'Domain Authority, Backlinks' },
    { name: 'Common Crawl', status: apiStatus.commoncrawl, usedFor: 'Backlink Discovery (limited)' },
    { name: 'Google PageSpeed', status: !!process.env.GOOGLE_PAGESPEED_API_KEY, usedFor: 'Core Web Vitals' },
    { name: 'Gemini API', status: !!process.env.GEMINI_API_KEY, usedFor: 'Brand Sentiment, Keyword Extraction' },
  ];

  apiChecks.forEach(check => {
    const icon = check.status ? '✅' : '❌';
    console.log(`  ${icon} ${check.name.padEnd(25)} ${check.status ? 'Configured' : 'Not Configured'}`);
    if (!check.status) {
      console.log(`     └─ Used for: ${check.usedFor}`);
    }
  });

  // Run Analysis via API
  console.log('\n📊 Running Analysis via API...');
  console.log('-'.repeat(70));
  console.log(`API Endpoint: ${API_URL}\n`);
  
  try {
    const response = await axios.post(API_URL, { url: testUrl }, {
      timeout: 120000, // 2 minutes
    });
    
    const result = response.data;
    
    // Check Data Sources
    console.log('\n📈 Data Sources Used:');
    console.log('-'.repeat(70));
    const dataSource = result.scores?.dataSource || result.dataSources || {};
    console.log(`  ${dataSource.scraping !== false ? '✅' : '❌'} HTML Scraping`);
    console.log(`  ${dataSource.pagespeed !== false ? '✅' : '❌'} PageSpeed Insights`);
    console.log(`  ${dataSource.moz ? '✅' : '❌'} Moz API`);
    console.log(`  ${dataSource.dataforseo ? '✅' : '❌'} DataForSEO API`);
    console.log(`  ${dataSource.gsc ? '✅' : '❌'} Google Search Console`);
    console.log(`  ${dataSource.gemini ? '✅' : '❌'} Gemini API`);
    console.log(`  ${dataSource.googleCustomSearch ? '✅' : '❌'} Google Custom Search`);

    // Check Unavailable Metrics
    if (result.scores.unavailableMetrics && result.scores.unavailableMetrics.length > 0) {
      console.log('\n⚠️  Unavailable Metrics:');
      console.log('-'.repeat(70));
      result.scores.unavailableMetrics.forEach((metric: any) => {
        console.log(`  ❌ ${metric.pillar} - ${metric.metric}`);
        console.log(`     Max Points: ${metric.maxPoints}`);
        console.log(`     Reason: ${metric.reason}`);
        console.log(`     Message: ${metric.message}`);
        console.log('');
      });
    } else {
      console.log('\n✅ All metrics available!');
    }

    // Check Warnings
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      console.log('-'.repeat(70));
      result.warnings.forEach((warning: string) => {
        console.log(`  ⚠️  ${warning}`);
      });
    }

    // Score Summary
    console.log('\n📊 Score Summary:');
    console.log('-'.repeat(70));
    const totalScore = result.scores?.total || result.score || 0;
    const percentageScore = result.scores?.percentageScore || Math.round((totalScore / 100) * 100);
    console.log(`  Total Score: ${totalScore}/100 (${percentageScore}%)`);
    console.log(`  Content Structure: ${result.scores?.contentStructure || 0}/25 (${Math.round(((result.scores?.contentStructure || 0) / 25) * 100)}%)`);
    console.log(`  Brand Ranking: ${result.scores?.brandRanking || 0}/9 (${Math.round(((result.scores?.brandRanking || 0) / 9) * 100)}%)`);
    console.log(`  Website Technical: ${result.scores?.websiteTechnical || 0}/17 (${Math.round(((result.scores?.websiteTechnical || 0) / 17) * 100)}%)`);
    console.log(`  Keyword Visibility: ${result.scores?.keywordVisibility || 0}/23 (${Math.round(((result.scores?.keywordVisibility || 0) / 23) * 100)}%)`);
    console.log(`  AI Trust: ${result.scores?.aiTrust || 0}/22 (${Math.round(((result.scores?.aiTrust || 0) / 22) * 100)}%)`);

    // Feature Status Summary
    console.log('\n📋 Feature Status Summary:');
    console.log('-'.repeat(70));
    
    const workingFeatures: string[] = [];
    const unavailableFeatures: string[] = [];

    // Content Structure
    workingFeatures.push('Content Structure Analysis');
    
    // Brand Ranking
    if (dataSource.googleCustomSearch) {
      workingFeatures.push('Brand Search Position Check');
    } else {
      unavailableFeatures.push('Brand Search Position (needs Google Custom Search API)');
    }
    
    if (dataSource.gemini) {
      workingFeatures.push('Brand Sentiment Analysis');
    } else {
      unavailableFeatures.push('Brand Sentiment Analysis (needs Gemini API)');
    }

    // Website Technical
    if (dataSource.pagespeed) {
      workingFeatures.push('Core Web Vitals (PageSpeed)');
    } else {
      unavailableFeatures.push('Core Web Vitals (needs PageSpeed API or will use estimates)');
    }
    workingFeatures.push('SSL Check');
    workingFeatures.push('Sitemap Validation');
    workingFeatures.push('LLMs.txt Check');

    // Keyword Visibility
    if (dataSource.googleCustomSearch) {
      workingFeatures.push('Keyword Data (Google Custom Search - Keyword Discovery)');
    } else if (dataSource.dataforseo) {
      workingFeatures.push('Keyword Data (DataForSEO)');
    } else {
      unavailableFeatures.push('Keyword Data (needs Google Custom Search API or DataForSEO)');
    }

    // AI Trust
    if (dataSource.moz) {
      workingFeatures.push('Backlink Data (Moz)');
    } else if (dataSource.commoncrawl) {
      workingFeatures.push('Backlink Discovery (Common Crawl - limited)');
    } else {
      unavailableFeatures.push('Backlink Data (needs Moz API or Common Crawl)');
    }

    console.log('\n✅ Working Features:');
    workingFeatures.forEach(feature => {
      console.log(`  ✓ ${feature}`);
    });

    if (unavailableFeatures.length > 0) {
      console.log('\n❌ Unavailable Features:');
      unavailableFeatures.forEach(feature => {
        console.log(`  ✗ ${feature}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Test Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Analysis Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testFeatureStatus().catch(console.error);

