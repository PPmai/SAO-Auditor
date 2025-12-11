/**
 * DataForSEO API Test Endpoint
 * 
 * GET /api/dataforseo/test - Check if API is configured
 * GET /api/dataforseo/test?url=example.com - Test keyword data for domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getDomainKeywords, 
  getDomainKeywordList,
  isDataForSEOConfigured,
  testDataForSEOConnection,
  keywordMetricsToScores
} from '@/lib/modules/dataforseo';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  // Check if DataForSEO is configured
  if (!isDataForSEOConfigured()) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'DataForSEO is not configured',
      setup: {
        instructions: 'Add these environment variables to your .env file:',
        variables: [
          'DATAFORSEO_LOGIN=your_login_email',
          'DATAFORSEO_PASSWORD=your_api_password'
        ],
        documentation: 'https://docs.dataforseo.com/',
        pricing: 'https://dataforseo.com/pricing - Pay-per-use, ~$50/month for moderate usage'
      }
    }, { status: 200 });
  }

  // If no URL provided, just test the connection
  if (!url) {
    const testResult = await testDataForSEOConnection();
    return NextResponse.json({
      status: testResult.success ? 'configured' : 'error',
      message: testResult.message,
      usage: {
        example: '/api/dataforseo/test?url=theconductor.co',
        description: 'Provide a URL to fetch keyword data'
      }
    }, { status: testResult.success ? 200 : 500 });
  }

  // Fetch keyword data for the URL
  try {
    console.log(`🔍 Testing DataForSEO for: ${url}`);
    
    const [keywordMetrics, topKeywords] = await Promise.all([
      getDomainKeywords(url),
      getDomainKeywordList(url, 10)
    ]);

    // Calculate scores from metrics
    const scores = keywordMetricsToScores(keywordMetrics);

    return NextResponse.json({
      status: 'success',
      url,
      keywordMetrics: {
        totalKeywords: keywordMetrics.totalKeywords,
        keywordsTop10: keywordMetrics.keywordsTop10,
        keywordsTop100: keywordMetrics.keywordsTop100,
        estimatedTraffic: keywordMetrics.estimatedTraffic,
        averagePosition: keywordMetrics.averagePosition,
        trend: keywordMetrics.trend
      },
      topKeywords: topKeywords.slice(0, 10),
      scores: {
        keywordsScore: `${scores.keywordsScore}/6`,
        trafficScore: `${scores.trafficScore}/5`,
        positionsScore: `${scores.positionsScore}/5`,
        trendScore: `${scores.trendScore}/4`,
        totalKeywordVisibility: `${scores.keywordsScore + scores.trafficScore + scores.positionsScore + scores.trendScore}/20`
      },
      dataSource: 'dataforseo'
    }, { status: 200 });

  } catch (error: any) {
    console.error('DataForSEO test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch keyword data',
      error: error.message,
      url
    }, { status: 500 });
  }
}











