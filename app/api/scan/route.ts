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

        return {
          name: comp.name,
          urls: comp.urls,
          urlCount: compUrlResults.length,
          averageScore: compAverage,
          urlResults: compUrlResults.map(r => ({
            url: r.url,
            score: r.analysis.scores.total,
            scores: r.analysis.scores
          }))
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
        keywords: mainUrlResults[0].analysis.keywords
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
    scores
  };
}

function generateRecommendations(scores: DetailedScores, scraping: any, pagespeed: any) {
  const recommendations: any[] = [];

  // Content Structure recommendations
  if (!scraping.hasSchema) {
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'HIGH',
      title: 'Add Schema.org structured data',
      description: 'Implement JSON-LD schema markup (FAQ, HowTo, or Article) to help AI understand your content better.',
      impact: 'High - Improves AI readability by 30%'
    });
  }

  if (scraping.tableCount < 2) {
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'MEDIUM',
      title: 'Add structured data tables',
      description: 'Include comparison tables or data tables to present information in an AI-friendly format.',
      impact: 'Medium - Better featured snippet opportunities'
    });
  }

  if (scraping.h1.length === 0) {
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'HIGH',
      title: 'Add a single H1 heading',
      description: 'Every page should have exactly one H1 tag that describes the main topic.',
      impact: 'High - Critical for SEO and accessibility'
    });
  }

  if (scraping.videoCount === 0) {
    recommendations.push({
      pillar: 'contentStructure',
      priority: 'LOW',
      title: 'Add video content',
      description: 'Include relevant video content with transcripts to improve multimodal signals.',
      impact: 'Low - Enhances user engagement'
    });
  }

  // Brand Ranking recommendations
  if (pagespeed.lcpCategory !== 'GOOD') {
    recommendations.push({
      pillar: 'brandRanking',
      priority: 'HIGH',
      title: `Optimize Largest Contentful Paint (LCP: ${pagespeed.lcp?.toFixed(2) || 'N/A'}s)`,
      description: 'Improve LCP by optimizing images, using CDN, and reducing server response time. Target: < 2.5s',
      impact: 'High - Critical Core Web Vital'
    });
  }

  if (pagespeed.clsCategory !== 'GOOD') {
    recommendations.push({
      pillar: 'brandRanking',
      priority: 'HIGH',
      title: `Fix Cumulative Layout Shift (CLS: ${pagespeed.cls?.toFixed(3) || 'N/A'})`,
      description: 'Reserve space for images, ads, and dynamic content to prevent layout shifts. Target: < 0.1',
      impact: 'High - Critical Core Web Vital'
    });
  }

  if (!scraping.hasSSL) {
    recommendations.push({
      pillar: 'brandRanking',
      priority: 'HIGH',
      title: 'Enable HTTPS/SSL',
      description: 'Install SSL certificate to secure your website and improve trust signals.',
      impact: 'High - Security and ranking factor'
    });
  }

  if (pagespeed.mobileScore < 70) {
    recommendations.push({
      pillar: 'brandRanking',
      priority: 'MEDIUM',
      title: 'Improve mobile performance',
      description: 'Optimize for mobile devices with responsive design and fast loading times.',
      impact: 'Medium - Mobile-first indexing'
    });
  }

  // AI Trust recommendations
  if (scraping.externalLinks < 3) {
    recommendations.push({
      pillar: 'aiTrust',
      priority: 'MEDIUM',
      title: 'Add authoritative external citations',
      description: 'Link to reputable sources to demonstrate expertise and build trust.',
      impact: 'Medium - Improves E-E-A-T signals'
    });
  }

  const hasAuthor = scraping.schemaTypes?.some((t: string) =>
    t.includes('Person') || t.includes('Author')
  );

  if (!hasAuthor) {
    recommendations.push({
      pillar: 'aiTrust',
      priority: 'MEDIUM',
      title: 'Add author information',
      description: 'Include author bio and credentials using schema markup to demonstrate expertise.',
      impact: 'Medium - Enhances E-E-A-T'
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
