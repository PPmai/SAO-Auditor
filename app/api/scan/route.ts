import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/modules/scraper';
import { analyzePageSpeed } from '@/lib/modules/pagespeed';
import { getMozMetrics, MozMetrics } from '@/lib/modules/moz';
import { DomainKeywordMetrics } from '@/lib/modules/dataforseo';
import { getUnifiedSEOMetrics, getAPIStatus, toKeywordMetrics, toMozMetrics } from '@/lib/modules/api-manager';
import { calculateTotalScore, getScoreLabel, compareScores, DetailedScores, calculateAverageScores } from '@/lib/modules/scoring';

export const maxDuration = 120; // Allow up to 2 minutes for analysis

interface ScanRequest {
  url: string;
  urls?: string[]; // Multiple URLs for batch analysis
  competitors?: string[]; // Competitor URLs (each can be a single URL or array)
  competitorDomains?: { // Structured competitor input for internal use
    name: string;
    urls: string[];
  }[];
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json();
    const { url, urls = [], competitors = [], competitorDomains = [], userId } = body;

    // Support both single URL and batch URLs
    let urlsToAnalyze: string[] = [];

    if (urls.length > 0) {
      // Batch mode - limit to 30 URLs
      urlsToAnalyze = urls.slice(0, 30);
    } else if (url) {
      // Single URL mode
      urlsToAnalyze = [url];
    }

    if (urlsToAnalyze.length === 0) {
      return NextResponse.json(
        { error: 'At least one URL is required' },
        { status: 400 }
      );
    }

    // Validate and normalize URLs
    const validUrls: string[] = [];
    for (const u of urlsToAnalyze) {
      try {
        const normalized = u.startsWith('http') ? u : `https://${u}`;
        new URL(normalized);
        validUrls.push(normalized);
      } catch (e) {
        console.warn(`Skipping invalid URL: ${u}`);
      }
    }

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs provided' },
        { status: 400 }
      );
    }

    // Process competitor domains (for internal use)
    let competitorData: { name: string; urls: string[] }[] = [];

    if (competitorDomains.length > 0) {
      // Structured competitor input - limit to 4 competitors, 10 URLs each
      competitorData = competitorDomains.slice(0, 4).map(comp => ({
        name: comp.name,
        urls: comp.urls.slice(0, 10).filter(u => {
          try {
            new URL(u.startsWith('http') ? u : `https://${u}`);
            return true;
          } catch {
            return false;
          }
        }).map(u => u.startsWith('http') ? u : `https://${u}`)
      }));
    } else if (competitors.length > 0) {
      // Simple competitor URLs - limit to 4
      competitorData = competitors.slice(0, 4).map((c, i) => ({
        name: `Competitor ${i + 1}`,
        urls: [c.startsWith('http') ? c : `https://${c}`]
      })).filter(comp => {
        try {
          new URL(comp.urls[0]);
          return true;
        } catch {
          return false;
        }
      });
    }

    console.log(`🔍 Starting analysis for ${validUrls.length} URL(s)`);
    const status = getAPIStatus();
    console.log(`📡 API Status: Ahrefs=${status.ahrefs}, DataForSEO=${status.dataforseo}, Moz=${status.moz}`);
    if (competitorData.length > 0) {
      console.log(`📊 With ${competitorData.length} competitor domain(s)`);
    }

    // Analyze all main URLs
    const mainUrlResults = await Promise.all(
      validUrls.map(async (u) => {
        try {
          return {
            url: u,
            analysis: await analyzeUrl(u)
          };
        } catch (error: any) {
          console.error(`Failed to analyze ${u}:`, error.message);
          return null;
        }
      })
    ).then(results => results.filter(Boolean) as { url: string; analysis: any }[]);

    if (mainUrlResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to analyze any URLs' },
        { status: 500 }
      );
    }

    // Calculate domain average for main URLs
    const mainScores = mainUrlResults.map(r => r.analysis.scores);
    const mainDomainAverage = calculateAverageScores(mainScores);

    // Analyze competitor domains
    const competitorResults = await Promise.all(
      competitorData.map(async (comp) => {
        const compUrlResults = await Promise.all(
          comp.urls.map(async (compUrl) => {
            try {
              return {
                url: compUrl,
                analysis: await analyzeUrl(compUrl)
              };
            } catch (error) {
              console.error(`Failed to analyze competitor ${compUrl}:`, error);
              return null;
            }
          })
        ).then(results => results.filter(Boolean) as { url: string; analysis: any }[]);

        if (compUrlResults.length === 0) return null;

        const compScores = compUrlResults.map(r => r.analysis.scores);
        const compAverage = calculateAverageScores(compScores);

        // Generate warnings for competitor domain
        const compWarnings: string[] = [];
        const compFirstAnalysis = compUrlResults[0].analysis;
        
        // Map API errors to affected metrics for competitors
        if (compFirstAnalysis.apiErrors && compFirstAnalysis.apiErrors.length > 0) {
          for (const err of compFirstAnalysis.apiErrors) {
            const apiName = err.split(':')[0].trim();
            const affectedMetrics = apiErrorToMetrics[apiName] || ['Some metrics'];
            compWarnings.push(`Some SEO APIs failed: ${err}. Affected metrics: ${affectedMetrics.join(', ')}`);
          }
        }

        const compDs = compAverage.dataSource || {} as DetailedScores['dataSource'];
        if (!compDs.moz) {
          compWarnings.push('Moz backlink metrics were unavailable. Affected metrics: AI Trust (Backlink Quality, Referring Domains). Scores may be estimated.');
        }
        if (!compDs.dataforseo && !compDs.gsc) {
          compWarnings.push('Real keyword ranking data was unavailable. Affected metrics: Keyword Visibility (Organic Keywords, Average Position). Scores are based only on on-page signals.');
        }
        if (!compDs.pagespeed) {
          compWarnings.push('Google PageSpeed data was unavailable. Affected metrics: Website Technical (LCP, INP, CLS, Mobile Performance). Scores may be incomplete.');
        }

        return {
          name: comp.name,
          urls: comp.urls,
          urlCount: compUrlResults.length,
          averageScore: compAverage,
          urlResults: compUrlResults.map(r => ({
            url: r.url,
            score: r.analysis.scores.total,
            scores: r.analysis.scores
          })),
          recommendations: generateRecommendations(
            compAverage,
            compUrlResults[0].analysis.scraping,
            compUrlResults[0].analysis.pagespeed
          ),
          warnings: compWarnings
        };
      })
    ).then(results => results.filter(Boolean) as any[]);

    // Generate recommendations based on first URL (or aggregate)
    const recommendations = generateRecommendations(
      mainDomainAverage,
      mainUrlResults[0].analysis.scraping,
      mainUrlResults[0].analysis.pagespeed
    );

    // Calculate comparison if competitors exist
    let comparison = null;
    if (competitorResults.length > 0) {
      comparison = compareScores(
        mainDomainAverage,
        competitorResults.map(c => c.averageScore)
      );
    }

    const scoreLabel = getScoreLabel(mainDomainAverage.total);
    console.log(`✨ Scan complete! Average Score: ${mainDomainAverage.total}/100`);

    // Build warnings for missing data / API issues
    const warnings: string[] = [];
    const firstAnalysis = mainUrlResults[0].analysis;

    // Map API errors to affected metrics
    const apiErrorToMetrics: Record<string, string[]> = {
      'Ahrefs keywords': ['Keyword Visibility (Organic Keywords, Average Position)', 'Brand Ranking (Branded Search Rank)'],
      'Ahrefs backlinks': ['AI Trust (Backlink Quality, Referring Domains)', 'Brand Ranking (Brand Sentiment)'],
      'DataForSEO keywords': ['Keyword Visibility (Organic Keywords, Average Position)'],
      'Moz backlinks': ['AI Trust (Backlink Quality, Referring Domains)'],
      'Google Search Console': ['Keyword Visibility (Organic Keywords, Average Position)'],
    };

    // API-level errors from unified SEO manager
    if (firstAnalysis.apiErrors && firstAnalysis.apiErrors.length > 0) {
      for (const err of firstAnalysis.apiErrors) {
        // Extract API name from error (e.g., "Ahrefs keywords: Insufficient plan" -> "Ahrefs keywords")
        const apiName = err.split(':')[0].trim();
        const affectedMetrics = apiErrorToMetrics[apiName] || ['Some metrics'];
        warnings.push(`Some SEO APIs failed: ${err}. Affected metrics: ${affectedMetrics.join(', ')}`);
      }
    }

    // Data source coverage warnings based on averaged scores
    const ds = mainDomainAverage.dataSource || {} as DetailedScores['dataSource'];
    if (!ds.moz) {
      warnings.push('Moz backlink metrics were unavailable. Affected metrics: AI Trust (Backlink Quality, Referring Domains). Scores may be estimated.');
    }
    if (!ds.dataforseo && !ds.gsc) {
      warnings.push('Real keyword ranking data was unavailable. Affected metrics: Keyword Visibility (Organic Keywords, Average Position). Scores are based only on on-page signals.');
    }
    if (!ds.pagespeed) {
      warnings.push('Google PageSpeed data was unavailable. Affected metrics: Website Technical (LCP, INP, CLS, Mobile Performance). Scores may be incomplete.');
    }

    // Generate a simple ID for the result
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      scanId,
      // For single URL mode
      url: validUrls[0],
      score: mainDomainAverage.total,
      scoreLabel,
      scores: mainDomainAverage,
      // For batch mode
      urlCount: mainUrlResults.length,
      urlResults: mainUrlResults.map(r => ({
        url: r.url,
        score: r.analysis.scores.total,
        scores: r.analysis.scores
      })),
      // Data sources used
      dataSources: {
        moz: mainDomainAverage.dataSource?.moz || false,
        dataforseo: mainDomainAverage.dataSource?.dataforseo || false,
        gsc: mainDomainAverage.dataSource?.gsc || false,
        pagespeed: true,
        scraping: true
      },
      // Non-blocking warnings for missing data / API issues
      warnings,
      // Recommendations and comparison
      recommendations,
      comparison,
      // Competitor data
      competitors: competitorResults,
      // Raw data from first URL (for detailed view)
      rawData: {
        scraping: mainUrlResults[0].analysis.scraping,
        pagespeed: mainUrlResults[0].analysis.pagespeed,
        moz: mainUrlResults[0].analysis.moz,
        keywords: mainUrlResults[0].analysis.keywords,
        apiErrors: firstAnalysis.apiErrors || []
      }
    });

  } catch (error: any) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

async function analyzeUrl(url: string) {
  const apiStatus = getAPIStatus();
  console.log(`📊 Analyzing: ${url}`);
  console.log(`📡 API Status: Ahrefs=${apiStatus.ahrefs}, DataForSEO=${apiStatus.dataforseo}, Moz=${apiStatus.moz}`);

  // Run scraping, PageSpeed, and unified SEO data collection in parallel
  const [scrapingData, pagespeedData, baseMozData, unifiedSEO] = await Promise.all([
    scrapeWebsite(url),
    analyzePageSpeed(url),
    getMozMetrics(url),
    getUnifiedSEOMetrics(url) // Cascading: Ahrefs → DataForSEO → Moz → Estimates
  ]);

  console.log(`📈 Data Sources: Keywords from ${unifiedSEO.source.keywords}, Backlinks from ${unifiedSEO.source.backlinks}`);

  if (unifiedSEO.errors.length > 0) {
    console.log(`⚠️ API Errors: ${unifiedSEO.errors.join(', ')}`);
  }

  // Convert unified metrics to scoring format
  const keywordData = toKeywordMetrics(unifiedSEO);
  const enhancedMozData = toMozMetrics(unifiedSEO, baseMozData);

  // Calculate scores
  const scores = calculateTotalScore(scrapingData, pagespeedData, enhancedMozData, keywordData);

  return {
    scraping: scrapingData,
    pagespeed: pagespeedData,
    moz: enhancedMozData,
    keywords: keywordData,
    seoMetrics: {
      ...unifiedSEO,
      apiStatus
    },
    // Surface unified SEO API errors so frontend can show warnings
    apiErrors: unifiedSEO.errors,
    scores
  };
}

function generateRecommendations(scores: DetailedScores, scraping: any, pagespeed: any) {
  const recommendations: any[] = [];

  // Helper function to get metric score and points lost
  const getMetricInfo = (pillar: string, metricKey: string, maxScore: number) => {
    const breakdown = scores.breakdown[pillar as keyof typeof scores.breakdown];
    if (!breakdown) return null;
    const metric = breakdown[metricKey as keyof typeof breakdown];
    if (!metric) return null;
    const currentScore = typeof metric === 'object' && 'score' in metric ? metric.score : (typeof metric === 'number' ? metric : 0);
    const pointsLost = Math.max(0, maxScore - currentScore);
    return { currentScore, maxScore, pointsLost };
  };

  // Content Structure recommendations
  if (!scraping.hasSchema) {
    const metricInfo = getMetricInfo('contentStructure', 'schema', 8);
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'HIGH',
      title: 'Add Schema.org structured data',
      description: 'Implement JSON-LD schema markup (FAQ, HowTo, or Article) to help AI understand your content better.',
      impact: 'High - Improves AI readability by 30%',
      metricName: 'Schema Markup',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 8,
      pointsLost: metricInfo?.pointsLost ?? 8
    });
  }

  if (scraping.tableCount < 2) {
    const metricInfo = getMetricInfo('contentStructure', 'tableLists', 2);
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'MEDIUM',
      title: 'Add structured data tables',
      description: 'Include comparison tables or data tables to present information in an AI-friendly format.',
      impact: 'Medium - Better featured snippet opportunities',
      metricName: 'Tables & Lists',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 2,
      pointsLost: metricInfo?.pointsLost ?? 2
    });
  }

  if (scraping.h1.length === 0) {
    const metricInfo = getMetricInfo('contentStructure', 'headings', 6);
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'HIGH',
      title: 'Add a single H1 heading',
      description: 'Every page should have exactly one H1 tag that describes the main topic.',
      impact: 'High - Critical for SEO and accessibility',
      metricName: 'Heading Structure',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 6,
      pointsLost: metricInfo?.pointsLost ?? 6
    });
  }

  if (scraping.videoCount === 0) {
    const metricInfo = getMetricInfo('contentStructure', 'multimodal', 5);
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'LOW',
      title: 'Add video content',
      description: 'Include relevant video content with transcripts to improve multimodal signals.',
      impact: 'Low - Enhances user engagement',
      metricName: 'Multimodal Content',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 5,
      pointsLost: metricInfo?.pointsLost ?? 5
    });
  }

  // Brand Ranking recommendations
  const brandRankingBreakdown = scores.breakdown.brandRanking;
  
  // Brand Search Rank recommendation
  if (brandRankingBreakdown.brandSearch && brandRankingBreakdown.brandSearch.score < 5) {
    const metricInfo = getMetricInfo('brandRanking', 'brandSearch', 5);
    recommendations.push({
      pillar: 'brandRanking',
      priority: 'MEDIUM',
      title: 'Improve Branded Search Ranking',
      description: brandRankingBreakdown.brandSearch.recommendation || 'Ensure your brand name ranks #1 for branded searches. Build brand awareness through PR, social media, and content marketing.',
      impact: 'Medium - Brand visibility and trust',
      metricName: 'Branded Search Rank',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 5,
      pointsLost: metricInfo?.pointsLost ?? 5
    });
  }

  // Brand Sentiment recommendation
  if (brandRankingBreakdown.brandSentiment && brandRankingBreakdown.brandSentiment.score < 5) {
    const metricInfo = getMetricInfo('brandRanking', 'brandSentiment', 5);
    recommendations.push({
      pillar: 'brandRanking',
      priority: 'MEDIUM',
      title: 'Monitor and Improve Brand Sentiment',
      description: brandRankingBreakdown.brandSentiment.recommendation || 'Monitor brand mentions on social media, review sites, and forums. Address negative sentiment proactively.',
      impact: 'Medium - Brand reputation and trust',
      metricName: 'Brand Sentiment',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 5,
      pointsLost: metricInfo?.pointsLost ?? 5
    });
  }

  // Website Technical recommendations (moved from brandRanking)
  if (pagespeed.lcpCategory !== 'GOOD') {
    const metricInfo = getMetricInfo('websiteTechnical', 'lcp', 3);
    recommendations.push({
      pillar: 'websiteTechnical',
      priority: 'HIGH',
      title: `Optimize Largest Contentful Paint (LCP: ${pagespeed.lcp?.toFixed(2) || 'N/A'}s)`,
      description: 'Improve LCP by optimizing images, using CDN, and reducing server response time. Target: < 2.5s',
      impact: 'High - Critical Core Web Vital',
      metricName: 'LCP (Load Speed)',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 3,
      pointsLost: metricInfo?.pointsLost ?? 3
    });
  }

  if (pagespeed.clsCategory !== 'GOOD') {
    const metricInfo = getMetricInfo('websiteTechnical', 'cls', 2);
    recommendations.push({
      pillar: 'websiteTechnical',
      priority: 'HIGH',
      title: `Fix Cumulative Layout Shift (CLS: ${pagespeed.cls?.toFixed(3) || 'N/A'})`,
      description: 'Reserve space for images, ads, and dynamic content to prevent layout shifts. Target: < 0.1',
      impact: 'High - Critical Core Web Vital',
      metricName: 'CLS (Visual Stability)',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 2,
      pointsLost: metricInfo?.pointsLost ?? 2
    });
  }

  if (!scraping.hasSSL) {
    const metricInfo = getMetricInfo('websiteTechnical', 'ssl', 3);
    recommendations.push({
      pillar: 'websiteTechnical',
      priority: 'HIGH',
      title: 'Enable HTTPS/SSL',
      description: 'Install SSL certificate to secure your website and improve trust signals.',
      impact: 'High - Security and ranking factor',
      metricName: 'SSL/HTTPS Security',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 3,
      pointsLost: metricInfo?.pointsLost ?? 3
    });
  }

  if (pagespeed.mobileScore < 70) {
    const metricInfo = getMetricInfo('websiteTechnical', 'mobile', 3);
    recommendations.push({
      pillar: 'websiteTechnical',
      priority: 'MEDIUM',
      title: 'Improve mobile performance',
      description: 'Optimize for mobile devices with responsive design and fast loading times.',
      impact: 'Medium - Mobile-first indexing',
      metricName: 'Mobile Performance',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 3,
      pointsLost: metricInfo?.pointsLost ?? 3
    });
  }

  // AI Trust recommendations
  if (scraping.externalLinks < 3) {
    const metricInfo = getMetricInfo('aiTrust', 'eeat', 4);
    recommendations.push({
      pillar: 'aiTrust',
      priority: 'MEDIUM',
      title: 'Add authoritative external citations',
      description: 'Link to reputable sources to demonstrate expertise and build trust.',
      impact: 'Medium - Improves E-E-A-T signals',
      metricName: 'E-E-A-T Signals',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 4,
      pointsLost: metricInfo?.pointsLost ?? 4
    });
  }

  const hasAuthor = scraping.schemaTypes?.some((t: string) =>
    t.includes('Person') || t.includes('Author')
  );

  if (!hasAuthor) {
    const metricInfo = getMetricInfo('aiTrust', 'eeat', 4);
    recommendations.push({
      pillar: 'aiTrust',
      priority: 'MEDIUM',
      title: 'Add author information',
      description: 'Include author bio and credentials using schema markup to demonstrate expertise.',
      impact: 'Medium - Enhances E-E-A-T',
      metricName: 'E-E-A-T Signals',
      currentScore: metricInfo?.currentScore ?? 0,
      maxScore: metricInfo?.maxScore ?? 4,
      pointsLost: metricInfo?.pointsLost ?? 4
    });
  }

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

  return recommendations;
}

// GET endpoint - simple for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get('id');

  if (scanId) {
    return NextResponse.json({
      message: 'Scan results are not persisted in this version.',
      scanId
    });
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Scan API is running. POST URL(s) to analyze.',
    mozConfigured: getAPIStatus().moz,
    apiStatus: getAPIStatus(),
    dataSources: {
      scraping: 'Active - HTML content analysis',
      pagespeed: 'Active - Google PageSpeed Insights',
      moz: getAPIStatus().moz ? 'Active - Domain Authority, Backlinks' : 'Not configured - Set MOZ_API_TOKEN',
      ahrefs: getAPIStatus().ahrefs ? 'Active - Keywords, Backlinks' : 'Not configured (fallbacks used)',
      dataforseo: getAPIStatus().dataforseo ? 'Active - Keyword rankings' : 'Not configured'
    },
    example: {
      url: 'https://example.com',
      competitors: []
    }
  });
}
