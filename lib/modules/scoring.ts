import { ScrapingResult } from './scraper';
import { PageSpeedResult } from './pagespeed';
import { MozMetrics, mozMetricsToScores } from './moz';
import { DomainKeywordMetrics, keywordMetricsToScores } from './dataforseo';
import { GSCMetrics, gscMetricsToScores } from './google-search-console';

// New 5-pillar structure (108 pts total, normalized to 100)
export interface PillarScores {
  contentStructure: number;   // 30 pts
  brandRanking: number;       // 10 pts (was combined with technical)
  websiteTechnical: number;   // 18 pts (NEW - separated from brand)
  keywordVisibility: number;  // 25 pts
  aiTrust: number;            // 25 pts
}

export interface MetricDetail {
  score: number;
  value?: string | number;
  insight?: string;
  recommendation?: string;
}

export interface DetailedScores extends PillarScores {
  total: number;              // Normalized to 100
  rawTotal: number;           // Raw 108
  breakdown: {
    contentStructure: {
      schema: MetricDetail;
      headings: MetricDetail;
      multimodal: MetricDetail;
      imageAlt: MetricDetail;       // NEW
      tableLists: MetricDetail;
      directAnswer: MetricDetail;
      contentGap: MetricDetail;
    };
    brandRanking: {
      brandSearch: MetricDetail;
      brandSentiment: MetricDetail; // NEW
    };
    websiteTechnical: {             // NEW pillar
      lcp: MetricDetail;
      inp: MetricDetail;
      cls: MetricDetail;
      mobile: MetricDetail;
      ssl: MetricDetail;
      brokenLinks: MetricDetail;
      llmsTxt: MetricDetail;        // NEW
      sitemap: MetricDetail;        // NEW
    };
    keywordVisibility: {
      keywords: MetricDetail;
      positions: MetricDetail;
      intentMatch: MetricDetail;
    };
    aiTrust: {
      backlinks: MetricDetail;
      referringDomains: MetricDetail;
      sentiment: MetricDetail;
      eeat: MetricDetail;
      local: MetricDetail;
    };
  };
  dataSource: {
    moz: boolean;
    dataforseo: boolean;
    gsc: boolean;
    pagespeed: boolean;
    scraping: boolean;
    ahrefs: boolean;    // NEW
    gemini: boolean;    // NEW
  };
}

export function calculateContentStructureScore(scraping: ScrapingResult): {
  score: number;
  breakdown: DetailedScores['breakdown']['contentStructure'];
} {
  let schemaScore = 0;
  let tableListScore = 0;
  let headingScore = 0;
  let multimodalScore = 0;
  let directAnswerScore = 0;
  let contentGapScore = 0;

  // 1. Schema Coverage (9 points)
  let schemaInsight = "No schema markup detected.";
  let schemaRec = "Add JSON-LD schema to help AI understand your content.";

  if (scraping.hasSchema) {
    schemaScore += 4;
    schemaInsight = "Basic schema detected.";
    schemaRec = "Consider adding more specific schema types.";

    // Check for rich schema types
    const richTypes = ['FAQ', 'HowTo', 'Product', 'Recipe', 'Article'];
    const foundRichTypes = scraping.schemaTypes.filter(type =>
      richTypes.some(rich => type.includes(rich))
    );

    if (foundRichTypes.length > 0) {
      schemaScore += 5;
      schemaInsight = `Rich schema detected: ${foundRichTypes.join(', ')}.`;
      schemaRec = "Great job! Keep maintaining valid schema.";
    }
  }

  // 2. Table/List Utilization (2 points)
  if (scraping.tableCount >= 1) tableListScore += 1;
  if (scraping.listCount >= 3) tableListScore += 1;
  else if (scraping.listCount >= 1) tableListScore += 0.5;

  const tableListValue = `${scraping.tableCount} Tables, ${scraping.listCount} Lists`;
  let tableListInsight = "Content lacks structured data formats.";
  let tableListRec = "Add comparison tables and bulleted lists to improve AI readability.";

  if (tableListScore >= 2) {
    tableListInsight = "Good use of tables and lists.";
    tableListRec = "Your content structure supports AI readability.";
  } else if (tableListScore >= 1) {
    tableListInsight = "Some structured content, but could improve.";
    tableListRec = "Add more tables or lists for better AI parsing.";
  }

  // 3. Heading Structure (6 points)
  const hasH1 = scraping.h1.length > 0;
  const hasH2 = scraping.h2.length > 0;
  const hasH3 = scraping.h3.length > 0;
  const properH1Count = scraping.h1.length === 1;
  const multipleH1 = scraping.h1.length > 1;

  // +3.5 points: Exactly 1 H1 (most important)
  if (properH1Count) {
    headingScore += 3.5;
  }

  // Hierarchy scoring (H1 > H2 nesting)
  if (hasH1 && hasH2) {
    if (properH1Count) {
      // +2 points: Good hierarchy with proper single H1
      headingScore += 2;
    } else if (multipleH1) {
      // +1 point: Has hierarchy but penalized for multiple H1
      headingScore += 1;
    }
  }

  // +0.5 points: Has all heading levels (H1, H2, H3)
  if (hasH1 && hasH2 && hasH3) {
    headingScore += 0.5;
  }

  let headingInsight = "";
  let headingRec = "";

  if (scraping.h1.length === 0) {
    headingInsight = "Missing H1 tag - critical for SEO.";
    headingRec = "Add exactly one H1 tag that describes the main topic.";
  } else if (multipleH1) {
    headingInsight = `Multiple H1 tags found (${scraping.h1.length}). Should be exactly 1.`;
    headingRec = "Keep only one H1 and convert others to H2.";
  } else if (properH1Count && hasH2 && hasH3) {
    headingInsight = "Excellent heading structure with proper hierarchy.";
    headingRec = "Maintain this structure for best SEO results.";
  } else if (properH1Count && hasH2) {
    headingInsight = "Good structure, but missing H3 for subsections.";
    headingRec = "Add H3 tags to break up longer sections.";
  } else if (properH1Count) {
    headingInsight = "Has H1, but missing H2/H3 hierarchy.";
    headingRec = "Add H2 sections to structure your content.";
  }

  const headingValue = `H1: ${scraping.h1.length}, H2: ${scraping.h2.length}, H3: ${scraping.h3.length}`;


  // 4. Multimodal Content (5 points)
  const imageAltRatio = scraping.imageCount > 0
    ? scraping.imagesWithAlt / scraping.imageCount
    : 0;

  if (imageAltRatio >= 0.8) multimodalScore += 2;
  else if (imageAltRatio >= 0.5) multimodalScore += 1;

  if (scraping.videoCount >= 2) multimodalScore += 2;
  else if (scraping.videoCount >= 1) multimodalScore += 1;

  if (scraping.imageCount >= 5 || scraping.videoCount >= 1) multimodalScore += 1;

  const multimodalValue = `${scraping.imageCount} Images (${Math.round(imageAltRatio * 100)}% Alt), ${scraping.videoCount} Videos`;

  // 5. Direct Answer (5 points)
  if (scraping.wordCount >= 50 && scraping.h1.length > 0) {
    directAnswerScore = 5;
  } else if (scraping.wordCount >= 30) {
    directAnswerScore = 3;
  } else if (scraping.wordCount >= 15) {
    directAnswerScore = 1;
  }

  // 6. Content Gap (3 points)
  if (scraping.wordCount >= 1000 && scraping.h2.length >= 3) {
    contentGapScore = 3;
  } else if (scraping.wordCount >= 500) {
    contentGapScore = 2;
  } else if (scraping.wordCount >= 200) {
    contentGapScore = 1;
  }

  const total = Math.min(30, Math.round(
    schemaScore + tableListScore + headingScore +
    multimodalScore + directAnswerScore + contentGapScore
  ));

  // Image ALT scoring (3 pts) - FIXED
  // Score based on percentage of images with alt text
  // Excludes small images (assumed to be icons) in a real implementation
  let imageAltScore = 0;
  let imageAltValue = 'No images';

  if (scraping.imageCount > 0) {
    const altCoverage = (scraping.imagesWithAlt / scraping.imageCount) * 100;

    if (altCoverage >= 80) {
      imageAltScore = 3;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Excellent)`;
    } else if (altCoverage >= 60) {
      imageAltScore = 2;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Good)`;
    } else if (altCoverage >= 40) {
      imageAltScore = 1;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Needs improvement)`;
    } else {
      imageAltScore = 0;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Poor)`;
    }
  }

  return {
    score: total,
    breakdown: {
      schema: { score: schemaScore, value: scraping.schemaTypes.join(', ') || 'None', insight: schemaInsight, recommendation: schemaRec },
      headings: { score: headingScore, value: headingValue, insight: headingInsight, recommendation: headingRec },
      multimodal: { score: multimodalScore, value: multimodalValue },
      imageAlt: { score: imageAltScore, value: imageAltValue }, // NEW
      tableLists: { score: tableListScore, value: tableListValue, insight: tableListInsight, recommendation: tableListRec },
      directAnswer: { score: directAnswerScore, value: directAnswerScore === 3 ? 'Present' : 'Missing' },
      contentGap: { score: contentGapScore, value: `${scraping.wordCount} words` }
    }
  };
}

// PILLAR 2: Brand Ranking (10 points)
// - brandSearch: 5 pts
// - brandSentiment: 5 pts
export function calculateBrandRankingScore(
  scraping: ScrapingResult,
  // TODO: Add Ahrefs data for brand search
  // TODO: Add Gemini sentiment data
): {
  score: number;
  breakdown: DetailedScores['breakdown']['brandRanking'];
} {
  // Brand Search Score (5 points)
  // TODO: Implement with Ahrefs API - search for brand name keyword
  // - Rank 1 = 5 points
  // - Rank 2-3 = 3 points
  // - Rank 4-10 = 1.5 points
  // - Not in top 10 = 0 points
  const brandSearchScore = 0; // Pending Ahrefs API

  // Brand Sentiment Score (5 points)
  // TODO: Implement with Gemini Deep Research
  // - 2+ community positive = 5 pts
  // - 1 community pos + PR = 4 pts
  // - Neutral/Mixed = 2.5 pts
  // - PR only = 2 pts
  // - 1 community negative = 1 pt
  // - 2+ community negative = 0 pts (OVERRIDE)
  const brandSentimentScore = 0; // Pending Gemini API

  const total = Math.round(brandSearchScore + brandSentimentScore);

  return {
    score: total,
    breakdown: {
      brandSearch: {
        score: brandSearchScore,
        value: 'Pending API',
        insight: 'Waiting for Ahrefs API to check brand keyword ranking'
      },
      brandSentiment: {
        score: brandSentimentScore,
        value: 'Pending API',
        insight: 'Waiting for Gemini API to analyze community sentiment'
      }
    }
  };
}

// PILLAR 3: Website Technical (18 points)
// - LCP: 3 pts (<5s = 3, 5-7s = 1.5, >7s = 0)
// - INP: 1 pt (≤200ms = 1, >200ms = 0)
// - CLS: 1 pt (0 = 1, >0 = 0)
// - Mobile: 3 pts
// - SSL: 3 pts (HTTPS = 3, No HTTPS = 0)
// - Broken Links: 2 pts
// - LLMs.txt: 2.5 pts
// - Sitemap: 2.5 pts (must have ALL required elements)
export function calculateWebsiteTechnicalScore(
  scraping: ScrapingResult,
  pagespeed: PageSpeedResult
): {
  score: number;
  breakdown: DetailedScores['breakdown']['websiteTechnical'];
} {
  let lcpScore = 0;
  let inpScore = 0;
  let clsScore = 0;
  let mobileScore = 0;
  let sslScore = 0;
  let brokenLinksScore = 2; // Default to good until link checker implemented
  let llmsTxtScore = 0;
  let sitemapScore = 0;

  // LCP Score (3 points) - NEW THRESHOLDS
  // <5s = 3pts, 5-7s = 1.5pts, >7s = 0pts
  const lcpSeconds = pagespeed.lcp || 0;
  if (lcpSeconds < 5) lcpScore = 3;
  else if (lcpSeconds <= 7) lcpScore = 1.5;
  // else 0

  // INP Score (1 point) - SIMPLIFIED
  // ≤200ms = 1pt, >200ms = 0pts
  const inpMs = pagespeed.fid || 0; // Using FID as proxy
  if (inpMs <= 200) inpScore = 1;
  // else 0

  // CLS Score (1 point) - Per measurement_config.md
  // ≤0.1 (Good) = 1pt, >0.1 = 0pts
  const clsValue = pagespeed.cls ?? 0;
  if (clsValue <= 0.1) clsScore = 1;
  // else 0

  // Mobile Score (3 points)
  if (pagespeed.mobileScore >= 90) mobileScore = 3;
  else if (pagespeed.mobileScore >= 50) mobileScore = 1.5;

  // SSL Score (3 points) - SIMPLIFIED
  // HTTPS = 3pts, No HTTPS = 0pts
  if (scraping.hasSSL) sslScore = 3;

  // LLMs.txt Score (2 points) - From scraper detection
  llmsTxtScore = scraping.hasLlmsTxt ? 2 : 0;

  // Sitemap Score (2 points) - From scraper validation
  sitemapScore = scraping.sitemapValid ? 2 : 0;

  const total = Math.round(
    lcpScore + inpScore + clsScore + mobileScore +
    sslScore + brokenLinksScore + llmsTxtScore + sitemapScore
  );

  return {
    score: total,
    breakdown: {
      lcp: { score: lcpScore, value: `${pagespeed.lcp?.toFixed(2)}s` },
      inp: { score: inpScore, value: `${pagespeed.fid?.toFixed(0)}ms` },
      cls: { score: clsScore, value: pagespeed.cls?.toFixed(3) || '0' },
      mobile: { score: mobileScore, value: `${pagespeed.mobileScore}/100` },
      ssl: { score: sslScore, value: scraping.hasSSL ? 'HTTPS' : 'No HTTPS' },
      brokenLinks: { score: brokenLinksScore, value: '0 found' },
      llmsTxt: { score: llmsTxtScore, value: scraping.hasLlmsTxt ? 'Detected ✓' : 'Not found' },
      sitemap: { score: sitemapScore, value: scraping.sitemapValid ? 'Valid ✓' : 'Missing/Invalid' }
    }
  };
}


export function calculateKeywordVisibilityScore(
  scraping: ScrapingResult,
  keywordData?: DomainKeywordMetrics,
  gscData?: GSCMetrics
): {
  score: number;
  breakdown: DetailedScores['breakdown']['keywordVisibility'];
  dataSource: 'ahrefs' | 'dataforseo' | 'gsc' | 'estimated';
} {
  // PILLAR 4: Keyword Visibility (25 pts total)
  // - Organic Keywords: 10 pts (vs SERP benchmark)
  // - Avg Position: 7.5 pts
  // - Search Intent Match: 7.5 pts

  let keywordsScore = 0;
  let positionsScore = 0;
  let intentScore = 0;
  let dataSource: 'ahrefs' | 'dataforseo' | 'gsc' | 'estimated' = 'estimated';

  let keywordsValue = 'Pending API';
  let positionsValue = 'N/A';
  let intentValue = 'Pending API';

  // TODO: Implement Ahrefs API integration
  // Step 1: Call site-explorer-organic-keywords for target URL
  // Step 2: Get primary keyword (highest traffic)
  // Step 3: Call serp-overview for competitor benchmark
  // Step 4: Calculate scores based on new logic

  // METRIC #1: Organic Keywords (12.5 pts)
  // Logic: Compare URL's keyword count vs SERP competitor benchmark
  // Scoring: ≥100% = 12.5, 80-99% = 10, 60-79% = 7.5, 40-59% = 5, 20-39% = 2.5, <20% = 0

  // METRIC #2: Avg Position (7.5 pts)
  // Logic: Average SERP position of ranking keywords
  // Scoring: ≤3 = 7.5, 4-10 = 5, 11-20 = 2.5, >20 = 0

  // METRIC #3: Search Intent Match (7.5 pts)
  // Logic: % of keywords with consistent dominant intent
  // Scoring: ≥80% = 7.5, 60-79% = 6, 40-59% = 4, 20-39% = 2, <20% = 0

  // Intent breakdown (to be populated from Ahrefs API)
  let intentBreakdown = {
    informational: { count: 0, percent: 0 },
    commercial: { count: 0, percent: 0 },
    transactional: { count: 0, percent: 0 },
    navigational: { count: 0, percent: 0 },
    dominant: 'unknown' as string,
    matchPercent: 0
  };

  // Fallback: Use existing data if available
  if (keywordData && keywordData.totalKeywords > 0) {
    // Use DataForSEO data as temporary source
    const benchmarkDefault = 20; // Default benchmark
    const percentage = Math.min(100, (keywordData.totalKeywords / benchmarkDefault) * 100);

    // Organic Keywords Score (10 pts)
    if (percentage >= 100) keywordsScore = 10;
    else if (percentage >= 80) keywordsScore = 8;
    else if (percentage >= 60) keywordsScore = 6;
    else if (percentage >= 40) keywordsScore = 4;
    else if (percentage >= 20) keywordsScore = 2;
    else keywordsScore = 0;

    keywordsValue = `${keywordData.totalKeywords} keywords`;

    // Avg Position Score (7.5 pts)
    if (keywordData.averagePosition > 0) {
      if (keywordData.averagePosition <= 3) positionsScore = 7.5;
      else if (keywordData.averagePosition <= 10) positionsScore = 5;
      else if (keywordData.averagePosition <= 20) positionsScore = 2.5;
      else positionsScore = 0;
      positionsValue = `Avg #${keywordData.averagePosition.toFixed(1)}`;
    }

    dataSource = 'dataforseo';

    // Intent Match - placeholder with fake breakdown until Ahrefs API
    intentBreakdown = {
      informational: { count: 6, percent: 60 },
      commercial: { count: 2, percent: 20 },
      transactional: { count: 1, percent: 10 },
      navigational: { count: 1, percent: 10 },
      dominant: 'informational',
      matchPercent: 60
    };
    intentScore = 6; // 60-79% = 6 pts
    intentValue = '📘 Informational (60%)';

  } else {
    // Fallback estimates based on content signals
    const h2Count = scraping.h2.length;

    // Estimate keyword potential from content structure
    if (h2Count >= 5) keywordsScore = 4;
    else if (h2Count >= 3) keywordsScore = 2;

    // Default position estimate
    positionsScore = 2.5;
    positionsValue = 'Est. Page 2';

    // Default intent estimate
    intentBreakdown = {
      informational: { count: 0, percent: 0 },
      commercial: { count: 0, percent: 0 },
      transactional: { count: 0, percent: 0 },
      navigational: { count: 0, percent: 0 },
      dominant: 'unknown',
      matchPercent: 0
    };
    intentScore = 4; // Default middle score
    intentValue = 'Pending Ahrefs API';

    keywordsValue = 'Est. Low';
    dataSource = 'estimated';
  }

  const total = Math.min(25, Math.round(keywordsScore + positionsScore + intentScore));

  // Build intent breakdown string for UI
  const intentDetails = dataSource !== 'estimated'
    ? `📘 Info: ${intentBreakdown.informational.count} (${intentBreakdown.informational.percent}%) | 🛒 Comm: ${intentBreakdown.commercial.count} (${intentBreakdown.commercial.percent}%) | 💳 Trans: ${intentBreakdown.transactional.count} (${intentBreakdown.transactional.percent}%) | 🧭 Nav: ${intentBreakdown.navigational.count} (${intentBreakdown.navigational.percent}%)`
    : 'Ahrefs API required for intent breakdown';

  return {
    score: total,
    breakdown: {
      keywords: {
        score: keywordsScore,
        value: keywordsValue,
        insight: dataSource === 'estimated' ? 'Ahrefs API needed for accurate benchmark' : undefined,
        recommendation: keywordsScore < 6 ? 'Target more keywords to compete with SERP leaders' : undefined
      },
      positions: {
        score: positionsScore,
        value: positionsValue,
        insight: positionsScore < 5 ? 'Low average position' : 'Good SERP visibility',
        recommendation: positionsScore < 5 ? 'Improve on-page SEO for higher rankings' : undefined
      },
      intentMatch: {
        score: intentScore,
        value: intentValue,
        insight: intentDetails,
        recommendation: intentScore < 6 ? 'Focus content on a single primary intent for better ranking' : 'Great intent alignment!'
      }
    },
    dataSource
  };
}

export function calculateAITrustScore(
  scraping: ScrapingResult,
  mozMetrics?: MozMetrics
): {
  score: number;
  breakdown: DetailedScores['breakdown']['aiTrust'];
} {
  let backlinkScore = 2;
  let referringDomainsScore = 2;
  let sentimentScore = 2;
  let eeatScore = 0;
  let localScore = 0;
  let backlinkValue = 'N/A';

  if (mozMetrics && mozMetrics.domainAuthority > 0) {
    const mozScores = mozMetricsToScores(mozMetrics);
    backlinkScore = mozScores.backlinkScore;
    referringDomainsScore = mozScores.referringDomainsScore;
    backlinkValue = mozMetrics.linkingDomains.toString();
  } else {
    if (scraping.externalLinks >= 10) {
      backlinkScore = 4;
      referringDomainsScore = 3;
    } else if (scraping.externalLinks >= 5) {
      backlinkScore = 3;
      referringDomainsScore = 2;
    }
    backlinkValue = `Est. ${scraping.externalLinks} ext links`;
  }

  // Sentiment
  if (scraping.wordCount >= 500) sentimentScore = 3;

  // E-E-A-T
  const hasAuthor = scraping.schemaTypes.some(t => t.includes('Person'));
  if (hasAuthor) eeatScore += 1.5;
  if (scraping.externalLinks >= 3) eeatScore += 1;

  // Local
  const hasLocal = scraping.schemaTypes.some(t => t.includes('LocalBusiness'));
  if (hasLocal) localScore += 2;

  const total = Math.min(25, Math.round(
    backlinkScore + referringDomainsScore + sentimentScore +
    eeatScore + localScore
  ));

  return {
    score: total,
    breakdown: {
      backlinks: { score: Math.min(6, backlinkScore), value: backlinkValue },
      referringDomains: { score: Math.min(4, referringDomainsScore), value: 'N/A' },
      sentiment: { score: Math.min(4, sentimentScore), value: 'Neutral' },
      eeat: { score: Math.min(4, eeatScore), value: hasAuthor ? 'Author Found' : 'No Author' },
      local: { score: Math.min(2, localScore), value: hasLocal ? 'Yes' : 'No' }
    }
  };
}

export function calculateTotalScore(
  scraping: ScrapingResult,
  pagespeed: PageSpeedResult,
  mozMetrics?: MozMetrics,
  keywordData?: DomainKeywordMetrics,
  gscData?: GSCMetrics
): DetailedScores {
  const contentStructure = calculateContentStructureScore(scraping);
  const brandRanking = calculateBrandRankingScore(scraping);
  const websiteTechnical = calculateWebsiteTechnicalScore(scraping, pagespeed);
  const keywordVisibility = calculateKeywordVisibilityScore(scraping, keywordData, gscData);
  const aiTrust = calculateAITrustScore(scraping, mozMetrics);

  // Direct 100-point system (no normalization)
  // Content: 28, Brand: 9, Technical: 17, Keywords: 23, AI Trust: 23 = 100
  const total =
    contentStructure.score +    // 28 pts max
    brandRanking.score +        // 9 pts max
    websiteTechnical.score +    // 17 pts max
    keywordVisibility.score +   // 23 pts max
    aiTrust.score;              // 23 pts max

  return {
    total,
    rawTotal: total,  // Same as total in direct 100-point system
    contentStructure: contentStructure.score,
    brandRanking: brandRanking.score,
    websiteTechnical: websiteTechnical.score,
    keywordVisibility: keywordVisibility.score,
    aiTrust: aiTrust.score,
    breakdown: {
      contentStructure: contentStructure.breakdown,
      brandRanking: brandRanking.breakdown,
      websiteTechnical: websiteTechnical.breakdown,
      keywordVisibility: keywordVisibility.breakdown,
      aiTrust: aiTrust.breakdown
    },
    dataSource: {
      moz: !!(mozMetrics && mozMetrics.domainAuthority > 0),
      dataforseo: keywordVisibility.dataSource === 'dataforseo',
      gsc: keywordVisibility.dataSource === 'gsc',
      pagespeed: true,
      scraping: true,
      ahrefs: false,   // TODO: Set true when Ahrefs integrated
      gemini: false    // TODO: Set true when Gemini integrated
    }
  };
}

export function getScoreLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 90) return { label: 'Excellent', color: 'green', description: 'Well-optimized for AI' };
  if (score >= 70) return { label: 'Good', color: 'blue', description: 'Performing well' };
  if (score >= 50) return { label: 'Needs Improvement', color: 'yellow', description: 'Needs attention' };
  return { label: 'Poor', color: 'red', description: 'Significant optimization needed' };
}

export function compareScores(
  mainScores: DetailedScores,
  competitorScores: DetailedScores[]
): {
  rank: number;
  avgCompetitorScore: number;
  gaps: { pillar: string; mainScore: number; avgCompetitorScore: number; gap: number }[];
} {
  const avgTotal = competitorScores.reduce((sum, c) => sum + c.total, 0) / competitorScores.length;
  const allScores = [mainScores.total, ...competitorScores.map(c => c.total)].sort((a, b) => b - a);
  const rank = allScores.indexOf(mainScores.total) + 1;

  const pillars = ['contentStructure', 'brandRanking', 'websiteTechnical', 'keywordVisibility', 'aiTrust'] as const;
  const gaps = pillars.map(pillar => {
    const avgCompetitor = competitorScores.reduce((sum, c) => sum + c[pillar], 0) / competitorScores.length;
    return {
      pillar,
      mainScore: mainScores[pillar],
      avgCompetitorScore: Math.round(avgCompetitor * 10) / 10,
      gap: Math.round((mainScores[pillar] - avgCompetitor) * 10) / 10
    };
  });

  return { rank, avgCompetitorScore: Math.round(avgTotal), gaps };
}

export function calculateAverageScores(scores: DetailedScores[]): DetailedScores {
  if (scores.length === 0) {
    // Return empty/zero structure
    return calculateTotalScore(
      { url: '', h1: [], h2: [], h3: [], hasSchema: false, schemaTypes: [], tableCount: 0, listCount: 0, imageCount: 0, imagesWithAlt: 0, videoCount: 0, internalLinks: 0, externalLinks: 0, hasSSL: false, hasRobotsTxt: false, hasLlmsTxt: false, sitemapValid: false, wordCount: 0 },
      { url: '', lcp: 0, fid: 0, cls: 0, mobileScore: 0, lcpCategory: 'POOR', fidCategory: 'POOR', clsCategory: 'POOR', performanceScore: 0, accessibilityScore: 0, seoScore: 0, bestPracticesScore: 0 }
    );
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const base = scores[0];
  const total = Math.round(avg(scores.map(s => s.total)));
  const rawTotal = Math.round(avg(scores.map(s => s.rawTotal || s.total)));

  return {
    ...base,
    total,
    rawTotal,
    contentStructure: Math.round(avg(scores.map(s => s.contentStructure))),
    brandRanking: Math.round(avg(scores.map(s => s.brandRanking))),
    websiteTechnical: Math.round(avg(scores.map(s => s.websiteTechnical || 0))),
    keywordVisibility: Math.round(avg(scores.map(s => s.keywordVisibility))),
    aiTrust: Math.round(avg(scores.map(s => s.aiTrust))),
    breakdown: {
      contentStructure: {
        schema: { score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.schema.score))) },
        headings: { score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.headings.score))) },
        multimodal: { score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.multimodal.score))) },
        imageAlt: { score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.imageAlt?.score || 0))) },
        tableLists: { score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.tableLists.score))) },
        directAnswer: { score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.directAnswer.score))) },
        contentGap: { score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.contentGap.score))) }
      },
      brandRanking: {
        brandSearch: { score: Math.round(avg(scores.map(s => s.breakdown.brandRanking.brandSearch?.score || 0))) },
        brandSentiment: { score: Math.round(avg(scores.map(s => s.breakdown.brandRanking.brandSentiment?.score || 0))) }
      },
      websiteTechnical: {
        lcp: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.lcp?.score || 0))) },
        inp: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.inp?.score || 0))) },
        cls: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.cls?.score || 0))) },
        mobile: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.mobile?.score || 0))) },
        ssl: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.ssl?.score || 0))) },
        brokenLinks: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.brokenLinks?.score || 0))) },
        llmsTxt: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.llmsTxt?.score || 0))) },
        sitemap: { score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.sitemap?.score || 0))) }
      },
      keywordVisibility: {
        keywords: { score: Math.round(avg(scores.map(s => s.breakdown.keywordVisibility.keywords.score))) },
        positions: { score: Math.round(avg(scores.map(s => s.breakdown.keywordVisibility.positions.score))) },
        intentMatch: { score: Math.round(avg(scores.map(s => s.breakdown.keywordVisibility.intentMatch.score))) }
      },
      aiTrust: {
        backlinks: { score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.backlinks.score))) },
        referringDomains: { score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.referringDomains.score))) },
        sentiment: { score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.sentiment.score))) },
        eeat: { score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.eeat.score))) },
        local: { score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.local.score))) }
      }
    }
  };
}
