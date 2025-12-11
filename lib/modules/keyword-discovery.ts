/**
 * Keyword Discovery Module
 * 
 * ใช้ Gemini วิเคราะห์ content แล้วเดา keywords ที่น่าจะติดอันดับ
 * จากนั้นใช้ Google Custom Search API เช็ค ranking จริง
 */

import { ScrapingResult } from './scraper';
import { extractKeywordsWithGemini } from './gemini';
import { batchCheckKeywordRankings, KeywordRankingResult } from './google-custom-search';
import { validateKeywordsWithCommonCrawl, findRelatedKeywordsFromCommonCrawl } from './commoncrawl';

// Types
export interface DiscoveredKeyword {
  keyword: string;
  type: 'branded' | 'non-branded';
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  position: number | null;  // null = not in top 100
  inTop10: boolean;
  inTop100: boolean;
}

export interface KeywordDiscoveryResult {
  // Summary
  totalKeywordsFound: number;
  keywordsInTop10: number;
  keywordsInTop100: number;
  averagePosition: number | null;
  
  // Brand keywords
  brandKeywords: DiscoveredKeyword[];
  brandPosition: number | null;  // Position for main brand keyword
  
  // Non-brand keywords  
  contentKeywords: DiscoveredKeyword[];
  
  // Intent breakdown
  intentBreakdown: {
    informational: number;
    commercial: number;
    transactional: number;
    navigational: number;
    dominant: string;
    dominantPercent: number;
  };
  
  // Raw data
  allKeywords: DiscoveredKeyword[];
}

/**
 * Main function: Discover keywords for a URL
 * 
 * @param url - Target URL to analyze
 * @param domain - Domain name (e.g., "msig.co.th")
 * @param scrapingResult - Content scraped from URL
 * @param country - Country code for search (default: "th")
 */
export async function discoverKeywords(
  url: string,
  domain: string,
  scrapingResult: ScrapingResult,
  country: string = 'th'
): Promise<KeywordDiscoveryResult> {
  // Step 1: Extract brand name from domain
  const brandName = extractBrandName(domain);
  
  // Step 2: Generate brand keywords variations
  const brandKeywords = generateBrandKeywords(brandName, domain);
  
  // Step 3: Use Gemini to extract content keywords
  const contentKeywords = await extractKeywordsWithGemini(scrapingResult, brandName);
  
  // Step 3.5: Validate and enrich keywords with Common Crawl
  const allContentKeywords = contentKeywords.map(k => k.keyword);
  const validatedKeywords = await validateKeywordsWithCommonCrawl(
    allContentKeywords,
    domain,
    20 // Max 20 keywords to validate
  );
  
  // Step 3.6: Find related keywords from Common Crawl
  const relatedKeywords = await findRelatedKeywordsFromCommonCrawl(domain, 10);
  
  // Merge validated keywords with related keywords
  // Filter out low-confidence keywords (< 0.3 confidence)
  const enrichedContentKeywords = contentKeywords
    .map(kw => {
      const validation = validatedKeywords.find(v => v.keyword === kw.keyword);
      return {
        ...kw,
        confidence: validation?.confidence || 0.5,
        foundInCommonCrawl: validation?.foundInCommonCrawl || false
      };
    })
    .filter(kw => kw.confidence >= 0.3); // Only keep keywords with decent confidence
  
  // Add related keywords from Common Crawl (as informational intent)
  const commonCrawlKeywords = relatedKeywords
    .filter(kw => !allContentKeywords.includes(kw) && !brandKeywords.includes(kw))
    .slice(0, 5) // Limit to 5 related keywords
    .map(kw => ({
      keyword: kw,
      intent: 'informational' as const,
      confidence: 0.4, // Medium confidence for related keywords
      foundInCommonCrawl: true
    }));
  
  // Step 4: Check ranking for all keywords via Custom Search API
  const allKeywordsToCheck = [
    ...brandKeywords, 
    ...enrichedContentKeywords.map(k => k.keyword),
    ...commonCrawlKeywords.map(k => k.keyword)
  ];
  const rankingResults = await batchCheckKeywordRankings(
    allKeywordsToCheck,
    domain,
    country,
    {
      maxKeywords: 30,  // Limit to avoid API quota
      checkTop100: true,
      delayBetweenKeywords: 200
    }
  );
  
  // Step 5: Map ranking results to discovered keywords
  const allKeywordsWithRanking = mapRankingToKeywords(
    brandKeywords,
    [...enrichedContentKeywords, ...commonCrawlKeywords],
    rankingResults
  );
  
  // Step 6: Calculate metrics
  return calculateKeywordMetrics(allKeywordsWithRanking, brandName);
}

/**
 * Extract brand name from domain
 * Example: "msig.co.th" → "msig", "praram9hospital.com" → "praram9hospital"
 */
function extractBrandName(domain: string): string {
  // Remove www. and protocol
  let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Split by dots
  const parts = cleanDomain.split('.');
  
  // Handle cases like: msig.co.th, chubb.com, praram9hospital.com
  // For .co.th, .com.th, etc., take the first part
  if (parts.length >= 3 && (parts[1] === 'co' || parts[1] === 'com')) {
    return parts[0];
  }
  
  // For simple domains like example.com, take first part
  return parts[0];
}

/**
 * Generate brand keyword variations
 * Example: "msig" → ["msig", "msig insurance", "msig ประกัน", "เอ็มเอสไอจี"]
 */
function generateBrandKeywords(brandName: string, domain: string): string[] {
  const keywords: string[] = [];
  
  // Brand name alone
  keywords.push(brandName);
  
  // Brand + common product/service terms (Thai context)
  const productTerms = [
    'ประกัน',
    'ประกันภัย',
    'insurance',
    'ราคา',
    'price',
    'รีวิว',
    'review',
    'ที่ไหนดี',
    'ดีไหม'
  ];
  
  productTerms.forEach(term => {
    keywords.push(`${brandName} ${term}`);
  });
  
  // Domain name variations
  const domainWithoutTld = domain.replace(/\.(com|co\.th|net|org).*$/, '');
  if (domainWithoutTld !== brandName) {
    keywords.push(domainWithoutTld);
  }
  
  // Remove duplicates
  return [...new Set(keywords)];
}

/**
 * Map ranking results to discovered keywords
 */
function mapRankingToKeywords(
  brandKeywords: string[],
  contentKeywords: Array<{ keyword: string; intent: string; confidence?: number; foundInCommonCrawl?: boolean }>,
  rankingResults: KeywordRankingResult[]
): DiscoveredKeyword[] {
  const result: DiscoveredKeyword[] = [];
  
  // Create a map of keyword to ranking result
  const rankingMap = new Map<string, KeywordRankingResult>();
  rankingResults.forEach(r => {
    rankingMap.set(r.keyword.toLowerCase(), r);
  });
  
  // Map brand keywords
  brandKeywords.forEach(keyword => {
    const ranking = rankingMap.get(keyword.toLowerCase());
    const position = ranking?.position ?? null;
    
    result.push({
      keyword,
      type: 'branded',
      intent: 'navigational', // Brand keywords are usually navigational
      position,
      inTop10: position !== null && position <= 10,
      inTop100: position !== null && position <= 100
    });
  });
  
  // Map content keywords (with confidence and Common Crawl validation)
  contentKeywords.forEach((kw) => {
    const ranking = rankingMap.get(kw.keyword.toLowerCase());
    const position = ranking?.position ?? null;
    
    result.push({
      keyword: kw.keyword,
      type: 'non-branded',
      intent: kw.intent as DiscoveredKeyword['intent'],
      position,
      inTop10: position !== null && position <= 10,
      inTop100: position !== null && position <= 100
    });
  });
  
  return result;
}

/**
 * Calculate keyword metrics from discovered keywords
 */
function calculateKeywordMetrics(
  allKeywords: DiscoveredKeyword[],
  brandName: string
): KeywordDiscoveryResult {
  // Separate brand and content keywords
  const brandKeywords = allKeywords.filter(k => k.type === 'branded');
  const contentKeywords = allKeywords.filter(k => k.type === 'non-branded');
  
  // Find main brand keyword position (brand name alone)
  const mainBrandKeyword = brandKeywords.find(k => 
    k.keyword.toLowerCase() === brandName.toLowerCase()
  );
  const brandPosition = mainBrandKeyword?.position ?? null;
  
  // Calculate summary metrics
  const keywordsInTop10 = allKeywords.filter(k => k.inTop10).length;
  const keywordsInTop100 = allKeywords.filter(k => k.inTop100).length;
  
  // Calculate average position (only for keywords that rank)
  const rankedKeywords = allKeywords.filter(k => k.position !== null);
  const averagePosition = rankedKeywords.length > 0
    ? rankedKeywords.reduce((sum, k) => sum + (k.position ?? 0), 0) / rankedKeywords.length
    : null;
  
  // Intent breakdown
  const intentCounts = {
    informational: 0,
    commercial: 0,
    transactional: 0,
    navigational: 0
  };
  
  allKeywords.forEach(k => {
    intentCounts[k.intent]++;
  });
  
  // Find dominant intent
  const total = allKeywords.length;
  const intentPercentages = {
    informational: (intentCounts.informational / total) * 100,
    commercial: (intentCounts.commercial / total) * 100,
    transactional: (intentCounts.transactional / total) * 100,
    navigational: (intentCounts.navigational / total) * 100
  };
  
  const dominantIntent = Object.entries(intentPercentages).reduce((a, b) => 
    intentPercentages[a[0] as keyof typeof intentPercentages] > intentPercentages[b[0] as keyof typeof intentPercentages] ? a : b
  )[0];
  
  return {
    totalKeywordsFound: allKeywords.length,
    keywordsInTop10,
    keywordsInTop100,
    averagePosition: averagePosition ? Math.round(averagePosition * 10) / 10 : null,
    brandKeywords,
    brandPosition,
    contentKeywords,
    intentBreakdown: {
      informational: intentCounts.informational,
      commercial: intentCounts.commercial,
      transactional: intentCounts.transactional,
      navigational: intentCounts.navigational,
      dominant: dominantIntent,
      dominantPercent: Math.round(intentPercentages[dominantIntent as keyof typeof intentPercentages] * 10) / 10
    },
    allKeywords
  };
}

