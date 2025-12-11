/**
 * Ahrefs API Test Endpoint
 * 
 * GET /api/ahrefs/test - Check if API is configured
 * GET /api/ahrefs/test?url=example.com - Test keyword data for URL
 * GET /api/ahrefs/test?domain=example.com - Test backlink data for domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getUrlKeywords, 
  getBacklinkMetrics,
  getSerpCompetitors,
  isAhrefsConfigured,
  testAhrefsConnection,
  AhrefsKeywordMetrics,
  AhrefsBacklinkMetrics
} from '@/lib/modules/ahrefs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const domain = searchParams.get('domain');
  const keyword = searchParams.get('keyword'); // For SERP competitor testing

  // Check if Ahrefs is configured
  if (!isAhrefsConfigured()) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Ahrefs API is not configured',
      setup: {
        instructions: 'Add this environment variable to your .env file:',
        variables: [
          'AHREFS_API_KEY=your_api_key_here'
        ],
        documentation: 'https://docs.ahrefs.com/',
        pricing: 'https://ahrefs.com/pricing - Plans start at $99/month',
        howToGetKey: [
          '1. Sign up for an Ahrefs account',
          '2. Go to Settings → API',
          '3. Generate an API token',
          '4. Add AHREFS_API_KEY to your .env file'
        ]
      }
    }, { status: 200 });
  }

  // If no URL/domain provided, just test the connection
  if (!url && !domain && !keyword) {
    const testResult = await testAhrefsConnection();
    return NextResponse.json({
      status: testResult.success ? 'configured' : 'error',
      message: testResult.message,
      usage: {
        examples: [
          '/api/ahrefs/test?url=https://example.com - Get keyword data for a URL',
          '/api/ahrefs/test?domain=example.com - Get backlink data for a domain',
          '/api/ahrefs/test?keyword=seo tools - Get SERP competitors for a keyword'
        ],
        description: 'Provide a URL, domain, or keyword to test specific Ahrefs endpoints'
      }
    }, { status: testResult.success ? 200 : 500 });
  }

  try {
    const results: any = {
      status: 'success',
      configured: true
    };

    // Test keyword data for URL
    if (url) {
      console.log(`🔍 Testing Ahrefs keywords for: ${url}`);
      const keywordMetrics = await getUrlKeywords(url);
      
      results.url = url;
      results.keywordMetrics = {
        totalKeywords: keywordMetrics.totalKeywords,
        averagePosition: keywordMetrics.averagePosition,
        estimatedTraffic: keywordMetrics.estimatedTraffic,
        keywords: keywordMetrics.keywords.slice(0, 10), // Top 10 keywords
        intentBreakdown: keywordMetrics.intentBreakdown,
        error: keywordMetrics.error || null
      };

      // Calculate scores (similar to scoring module logic)
      if (!keywordMetrics.error && keywordMetrics.totalKeywords > 0) {
        const percentage = Math.min(100, (keywordMetrics.totalKeywords / 20) * 100);
        let keywordsScore = 0;
        if (percentage >= 100) keywordsScore = 10;
        else if (percentage >= 80) keywordsScore = 8;
        else if (percentage >= 60) keywordsScore = 6;
        else if (percentage >= 40) keywordsScore = 4;
        else if (percentage >= 20) keywordsScore = 2;

        let positionsScore = 0;
        if (keywordMetrics.averagePosition > 0) {
          if (keywordMetrics.averagePosition <= 3) positionsScore = 7.5;
          else if (keywordMetrics.averagePosition <= 10) positionsScore = 5;
          else if (keywordMetrics.averagePosition <= 20) positionsScore = 2.5;
        }

        let intentScore = 0;
        if (keywordMetrics.intentBreakdown.matchPercent >= 80) intentScore = 7.5;
        else if (keywordMetrics.intentBreakdown.matchPercent >= 60) intentScore = 6;
        else if (keywordMetrics.intentBreakdown.matchPercent >= 40) intentScore = 4;
        else if (keywordMetrics.intentBreakdown.matchPercent >= 20) intentScore = 2;

        results.scores = {
          keywordsScore: `${keywordsScore}/10`,
          positionsScore: `${positionsScore}/7.5`,
          intentScore: `${intentScore}/7.5`,
          totalKeywordVisibility: `${keywordsScore + positionsScore + intentScore}/25`
        };
      }
    }

    // Test backlink data for domain
    if (domain) {
      console.log(`🔗 Testing Ahrefs backlinks for: ${domain}`);
      const backlinkMetrics = await getBacklinkMetrics(domain);
      
      results.domain = domain;
      results.backlinkMetrics = {
        backlinks: backlinkMetrics.backlinks,
        referringDomains: backlinkMetrics.referringDomains,
        domainRating: backlinkMetrics.domainRating,
        error: backlinkMetrics.error || null
      };

      // Calculate scores
      if (!backlinkMetrics.error) {
        let backlinkScore = 0;
        if (backlinkMetrics.domainRating >= 60) backlinkScore = 6;
        else if (backlinkMetrics.domainRating >= 40) backlinkScore = 4;
        else if (backlinkMetrics.domainRating >= 20) backlinkScore = 2;
        else if (backlinkMetrics.domainRating > 0) backlinkScore = 1;

        let referringDomainsScore = 0;
        if (backlinkMetrics.referringDomains >= 100) referringDomainsScore = 4;
        else if (backlinkMetrics.referringDomains >= 50) referringDomainsScore = 3;
        else if (backlinkMetrics.referringDomains >= 20) referringDomainsScore = 2;
        else if (backlinkMetrics.referringDomains > 0) referringDomainsScore = 1;

        results.scores = {
          backlinkScore: `${backlinkScore}/6`,
          referringDomainsScore: `${referringDomainsScore}/4`,
          totalAITrust: `${backlinkScore + referringDomainsScore}/10`
        };
      }
    }

    // Test SERP competitors for keyword
    if (keyword) {
      console.log(`📊 Testing Ahrefs SERP competitors for keyword: ${keyword}`);
      const competitors = await getSerpCompetitors(keyword);
      
      results.keyword = keyword;
      results.serpCompetitors = competitors.slice(0, 10); // Top 10 competitors
      results.competitorCount = competitors.length;
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error('Ahrefs test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch Ahrefs data',
      error: error.message,
      url: url || domain || keyword || null
    }, { status: 500 });
  }
}





