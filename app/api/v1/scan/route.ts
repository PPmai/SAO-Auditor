import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/modules/scraper';
import { analyzePageSpeed } from '@/lib/modules/pagespeed';
import { analyzeDomainWithSemrush } from '@/lib/modules/semrush';
import { calculateTotalScore, getScoreLabel } from '@/lib/modules/scoring';
import { prisma } from '@/lib/db';

// Rate limiting storage (in production, use Redis)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const TIER_LIMITS = {
  FREE: { daily: 3, perMinute: 1 },
  PRO: { daily: 1000, perMinute: 10 },
  AGENCY: { daily: 10000, perMinute: 60 },
};

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Set x-api-key header.' },
        { status: 401 }
      );
    }

    // Find user by API key
    const user = await prisma.user.findUnique({
      where: { apiKey },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check tier (Agency only for API)
    if (user.tier !== 'AGENCY') {
      return NextResponse.json(
        { error: 'API access requires Agency tier. Upgrade at /pricing' },
        { status: 403 }
      );
    }

    // Rate limiting
    const now = Date.now();
    const limit = TIER_LIMITS[user.tier] || TIER_LIMITS.FREE;
    const rateKey = `${user.id}:${Math.floor(now / 60000)}`;

    const currentRate = rateLimits.get(rateKey) || { count: 0, resetAt: now + 60000 };
    if (currentRate.count >= limit.perMinute) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((currentRate.resetAt - now) / 1000)
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((currentRate.resetAt - now) / 1000)) }
        }
      );
    }

    // Parse request
    const body = await request.json();
    const { url, competitors = [] } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Analyze main URL
    const startTime = Date.now();

    const [scrapingData, pagespeedData, semrushData] = await Promise.all([
      scrapeWebsite(normalizedUrl),
      analyzePageSpeed(normalizedUrl),
      analyzeDomainWithSemrush(normalizedUrl),
    ]);

    const scores = await calculateTotalScore(scrapingData, pagespeedData, undefined);
    const scoreLabel = getScoreLabel(scores.total);

    // Analyze competitors if provided
    const competitorResults = await Promise.all(
      competitors.slice(0, 4).map(async (compUrl: string) => {
        const normalized = compUrl.startsWith('http') ? compUrl : `https://${compUrl}`;
        const [scraping, pagespeed, semrush] = await Promise.all([
          scrapeWebsite(normalized),
          analyzePageSpeed(normalized),
          analyzeDomainWithSemrush(normalized),
        ]);
        const compScores = await calculateTotalScore(scraping, pagespeed, undefined);
        return {
          url: normalized,
          scores: {
            total: compScores.total,
            contentStructure: compScores.contentStructure,
            brandRanking: compScores.brandRanking,
            keywordVisibility: compScores.keywordVisibility,
            aiTrust: compScores.aiTrust,
          },
        };
      })
    );

    // Save scan
    const scan = await prisma.scan.create({
      data: {
        url: normalizedUrl,
        status: 'COMPLETED',
        userId: user.id,
        totalScore: scores.total,
        contentStructureScore: scores.contentStructure,
        brandRankingScore: scores.brandRanking,
        keywordVisibilityScore: scores.keywordVisibility,
        aiTrustScore: scores.aiTrust,
        scrapingData: scrapingData as any,
        pagespeedData: pagespeedData as any,
        scoreBreakdown: scores.breakdown as any,
      },
    });

    // Log API usage
    await prisma.apiUsage.create({
      data: {
        apiKey,
        endpoint: '/api/v1/scan',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
      },
    });

    // Update rate limit
    rateLimits.set(rateKey, { count: currentRate.count + 1, resetAt: currentRate.resetAt });

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      url: normalizedUrl,
      scores: {
        total: scores.total,
        label: scoreLabel.label,
        contentStructure: scores.contentStructure,
        brandRanking: scores.brandRanking,
        keywordVisibility: scores.keywordVisibility,
        aiTrust: scores.aiTrust,
      },
      breakdown: scores.breakdown,
      competitors: competitorResults,
      meta: {
        analyzedAt: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
    });

  } catch (error: any) {
    console.error('API v1 scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving scan by ID
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { apiKey },
  });

  if (!user || user.tier !== 'AGENCY') {
    return NextResponse.json(
      { error: 'Invalid API key or insufficient permissions' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get('id');

  if (scanId) {
    const scan = await prisma.scan.findFirst({
      where: { id: scanId, userId: user.id },
      include: { competitors: true, recommendations: true },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    return NextResponse.json(scan);
  }

  // List recent scans
  const scans = await prisma.scan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      url: true,
      totalScore: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ scans });
}

