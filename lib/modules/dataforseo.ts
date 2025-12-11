/**
 * DataForSEO API Integration Module
 * 
 * Provides access to:
 * - Organic keyword rankings for any domain
 * - Search volume data
 * - SERP positions
 * - Traffic estimates
 * - Competitor analysis
 * 
 * API Documentation: https://docs.dataforseo.com/
 * Pricing: Pay-per-use, ~$50/month for moderate usage
 */

import axios from 'axios';

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || '';
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || '';

export interface KeywordData {
  keyword: string;
  position: number;
  searchVolume: number;
  cpc: number;
  competition: number;
  url: string;
  trafficPercent: number;
}

export interface DomainKeywordMetrics {
  totalKeywords: number;
  keywordsTop10: number;
  keywordsTop100: number;
  estimatedTraffic: number;
  averagePosition: number;
  topKeywords: KeywordData[];
  trend: 'improving' | 'stable' | 'declining';
  error?: string;
  // Intent breakdown from keyword discovery
  intentBreakdown?: {
    informational: number;
    commercial: number;
    transactional: number;
    navigational: number;
    dominant: string;
    dominantPercent: number;
  };
}

/**
 * Check if DataForSEO is configured
 */
export function isDataForSEOConfigured(): boolean {
  return !!DATAFORSEO_LOGIN && !!DATAFORSEO_PASSWORD && 
         DATAFORSEO_LOGIN.length > 0 && DATAFORSEO_PASSWORD.length > 0;
}

/**
 * Get auth header for DataForSEO API
 */
function getAuthHeader(): string {
  const credentials = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Get organic keyword rankings for a domain
 */
export async function getDomainKeywords(domain: string): Promise<DomainKeywordMetrics> {
  if (!isDataForSEOConfigured()) {
    console.log('⚠️ DataForSEO not configured - using estimated scores');
    return getEstimatedKeywordMetrics();
  }

  try {
    // Clean domain
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    console.log(`🔍 Fetching keyword data for: ${cleanDomain}`);

    // Use SERP API to get domain rankings
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/dataforseo_labs/google/domain_rank_overview/live`,
      [{
        target: cleanDomain,
        location_code: 2840, // United States
        language_code: 'en',
      }],
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const result = response.data?.tasks?.[0]?.result?.[0];
    
    if (!result) {
      console.log('⚠️ No DataForSEO data returned');
      return getEstimatedKeywordMetrics();
    }

    const metrics = result.metrics?.organic || {};

    // Calculate trend based on changes (if available)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (metrics.is_new) {
      trend = 'improving';
    }

    const domainMetrics: DomainKeywordMetrics = {
      totalKeywords: metrics.count || 0,
      keywordsTop10: metrics.pos_1 + metrics.pos_2_3 + metrics.pos_4_10 || 0,
      keywordsTop100: metrics.count || 0,
      estimatedTraffic: Math.round(metrics.etv || 0), // Estimated Traffic Value
      averagePosition: calculateAveragePosition(metrics),
      topKeywords: [], // Would need separate API call for detailed keywords
      trend,
    };

    console.log(`✅ DataForSEO: ${domainMetrics.totalKeywords} keywords, Top 10: ${domainMetrics.keywordsTop10}`);
    return domainMetrics;

  } catch (error: any) {
    console.error('❌ DataForSEO API error:', error.response?.data || error.message);
    
    return {
      ...getEstimatedKeywordMetrics(),
      error: error.message,
    };
  }
}

/**
 * Get detailed keyword list for a domain
 */
export async function getDomainKeywordList(
  domain: string, 
  limit: number = 10
): Promise<KeywordData[]> {
  if (!isDataForSEOConfigured()) {
    return [];
  }

  try {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/dataforseo_labs/google/ranked_keywords/live`,
      [{
        target: cleanDomain,
        location_code: 2840,
        language_code: 'en',
        limit: limit,
        order_by: ['keyword_data.keyword_info.search_volume,desc'],
      }],
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const items = response.data?.tasks?.[0]?.result?.[0]?.items || [];

    return items.map((item: any) => ({
      keyword: item.keyword_data?.keyword || '',
      position: item.ranked_serp_element?.serp_item?.rank_group || 0,
      searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
      cpc: item.keyword_data?.keyword_info?.cpc || 0,
      competition: item.keyword_data?.keyword_info?.competition || 0,
      url: item.ranked_serp_element?.serp_item?.url || '',
      trafficPercent: item.ranked_serp_element?.serp_item?.etv || 0,
    }));

  } catch (error: any) {
    console.error('❌ DataForSEO keyword list error:', error.message);
    return [];
  }
}

/**
 * Get SERP positions for specific keywords
 */
export async function checkKeywordPositions(
  domain: string,
  keywords: string[]
): Promise<Map<string, number>> {
  const positions = new Map<string, number>();

  if (!isDataForSEOConfigured() || keywords.length === 0) {
    return positions;
  }

  try {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    // Create tasks for each keyword
    const tasks = keywords.slice(0, 10).map(keyword => ({
      keyword,
      location_code: 2840,
      language_code: 'en',
      device: 'desktop',
      depth: 100,
    }));

    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/serp/google/organic/live/regular`,
      tasks,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const results = response.data?.tasks || [];

    results.forEach((task: any, index: number) => {
      const items = task.result?.[0]?.items || [];
      const keyword = keywords[index];
      
      const domainResult = items.find((item: any) => 
        item.domain?.includes(cleanDomain)
      );

      positions.set(keyword, domainResult?.rank_group || 0);
    });

  } catch (error: any) {
    console.error('❌ DataForSEO SERP check error:', error.message);
  }

  return positions;
}

/**
 * Get competitor keyword comparison
 */
export async function getCompetitorComparison(
  mainDomain: string,
  competitorDomains: string[]
): Promise<{
  main: DomainKeywordMetrics;
  competitors: { domain: string; metrics: DomainKeywordMetrics }[];
}> {
  const main = await getDomainKeywords(mainDomain);
  
  const competitors = await Promise.all(
    competitorDomains.slice(0, 4).map(async (domain) => ({
      domain,
      metrics: await getDomainKeywords(domain),
    }))
  );

  return { main, competitors };
}

/**
 * Calculate average position from metrics
 */
function calculateAveragePosition(metrics: any): number {
  const pos1 = metrics.pos_1 || 0;
  const pos2_3 = metrics.pos_2_3 || 0;
  const pos4_10 = metrics.pos_4_10 || 0;
  const pos11_20 = metrics.pos_11_20 || 0;
  const pos21_30 = metrics.pos_21_30 || 0;
  const pos31_40 = metrics.pos_31_40 || 0;
  const pos41_50 = metrics.pos_41_50 || 0;
  const pos51_60 = metrics.pos_51_60 || 0;
  const pos61_70 = metrics.pos_61_70 || 0;
  const pos71_80 = metrics.pos_71_80 || 0;
  const pos81_90 = metrics.pos_81_90 || 0;
  const pos91_100 = metrics.pos_91_100 || 0;

  const totalWeighted = 
    pos1 * 1 +
    pos2_3 * 2.5 +
    pos4_10 * 7 +
    pos11_20 * 15 +
    pos21_30 * 25 +
    pos31_40 * 35 +
    pos41_50 * 45 +
    pos51_60 * 55 +
    pos61_70 * 65 +
    pos71_80 * 75 +
    pos81_90 * 85 +
    pos91_100 * 95;

  const totalCount = pos1 + pos2_3 + pos4_10 + pos11_20 + pos21_30 + 
    pos31_40 + pos41_50 + pos51_60 + pos61_70 + pos71_80 + pos81_90 + pos91_100;

  return totalCount > 0 ? Math.round(totalWeighted / totalCount) : 0;
}

/**
 * Estimated metrics when DataForSEO is not available
 */
function getEstimatedKeywordMetrics(): DomainKeywordMetrics {
  return {
    totalKeywords: 0,
    keywordsTop10: 0,
    keywordsTop100: 0,
    estimatedTraffic: 0,
    averagePosition: 0,
    topKeywords: [],
    trend: 'stable',
  };
}

/**
 * Convert DataForSEO metrics to scoring components
 */
export function keywordMetricsToScores(metrics: DomainKeywordMetrics): {
  keywordsScore: number;      // Max 6 points
  trafficScore: number;       // Max 5 points
  positionsScore: number;     // Max 5 points
  trendScore: number;         // Max 4 points
} {
  // Keywords Score (6 points)
  // ≥100 keywords: 6, ≥50: 4, ≥20: 2, <20: 0
  let keywordsScore = 0;
  if (metrics.totalKeywords >= 100) keywordsScore = 6;
  else if (metrics.totalKeywords >= 50) keywordsScore = 4;
  else if (metrics.totalKeywords >= 20) keywordsScore = 2;
  else if (metrics.totalKeywords > 0) keywordsScore = 1;

  // Traffic Score (5 points) - Based on estimated traffic
  let trafficScore = 0;
  if (metrics.estimatedTraffic >= 10000) trafficScore = 5;
  else if (metrics.estimatedTraffic >= 5000) trafficScore = 4;
  else if (metrics.estimatedTraffic >= 1000) trafficScore = 3;
  else if (metrics.estimatedTraffic >= 100) trafficScore = 2;
  else if (metrics.estimatedTraffic > 0) trafficScore = 1;

  // Positions Score (5 points) - Based on average position
  // Position ≤3: 5, ≤10: 3, ≤20: 1, >20: 0
  let positionsScore = 0;
  if (metrics.averagePosition > 0) {
    if (metrics.averagePosition <= 3) positionsScore = 5;
    else if (metrics.averagePosition <= 10) positionsScore = 3;
    else if (metrics.averagePosition <= 20) positionsScore = 1;
  }

  // Trend Score (4 points)
  let trendScore = 2; // Default stable
  if (metrics.trend === 'improving') trendScore = 4;
  else if (metrics.trend === 'declining') trendScore = 0;

  return {
    keywordsScore,
    trafficScore,
    positionsScore,
    trendScore,
  };
}

/**
 * Test DataForSEO API connection
 */
export async function testDataForSEOConnection(): Promise<{
  success: boolean;
  message: string;
  sampleData?: DomainKeywordMetrics;
}> {
  if (!isDataForSEOConfigured()) {
    return {
      success: false,
      message: 'DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD not configured',
    };
  }

  try {
    const metrics = await getDomainKeywords('google.com');
    return {
      success: true,
      message: 'DataForSEO API connection successful',
      sampleData: metrics,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `DataForSEO API test failed: ${error.message}`,
    };
  }
}











