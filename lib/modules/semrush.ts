import axios from 'axios';

const SEMRUSH_API_BASE = 'https://api.semrush.com';

export interface SemrushDomainOverview {
  domain: string;
  authorityScore: number;
  organicKeywords: number;
  organicTraffic: number;
  organicCost: number;
  paidKeywords: number;
  paidTraffic: number;
  paidCost: number;
  backlinks: number;
  referringDomains: number;
  error?: string;
}

export interface SemrushKeyword {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  cpc: number;
  url: string;
  traffic: number;
  trafficPercent: number;
}

export interface SemrushBacklinksOverview {
  totalBacklinks: number;
  referringDomains: number;
  referringIps: number;
  followLinks: number;
  nofollowLinks: number;
  textLinks: number;
  imageLinks: number;
  error?: string;
}

export interface SemrushData {
  domainOverview: SemrushDomainOverview;
  topKeywords: SemrushKeyword[];
  backlinksOverview: SemrushBacklinksOverview;
  error?: string;
}

/**
 * Get domain overview from Semrush
 */
export async function getDomainOverview(domain: string): Promise<SemrushDomainOverview> {
  const apiKey = process.env.SEMRUSH_API_KEY;
  
  if (!apiKey) {
    return {
      domain,
      authorityScore: 0,
      organicKeywords: 0,
      organicTraffic: 0,
      organicCost: 0,
      paidKeywords: 0,
      paidTraffic: 0,
      paidCost: 0,
      backlinks: 0,
      referringDomains: 0,
      error: 'SEMRUSH_API_KEY not configured'
    };
  }

  try {
    const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
      params: {
        type: 'domain_ranks',
        key: apiKey,
        export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
        domain: domain,
        database: 'us'
      },
      timeout: 30000
    });

    // Semrush returns CSV format
    const lines = response.data.trim().split('\n');
    if (lines.length < 2) {
      return {
        domain,
        authorityScore: 0,
        organicKeywords: 0,
        organicTraffic: 0,
        organicCost: 0,
        paidKeywords: 0,
        paidTraffic: 0,
        paidCost: 0,
        backlinks: 0,
        referringDomains: 0,
        error: 'No data found for domain'
      };
    }

    const values = lines[1].split(';');
    
    return {
      domain: values[0] || domain,
      authorityScore: parseInt(values[1]) || 0,
      organicKeywords: parseInt(values[2]) || 0,
      organicTraffic: parseInt(values[3]) || 0,
      organicCost: parseFloat(values[4]) || 0,
      paidKeywords: parseInt(values[5]) || 0,
      paidTraffic: parseInt(values[6]) || 0,
      paidCost: parseFloat(values[7]) || 0,
      backlinks: 0,
      referringDomains: 0
    };
  } catch (error: any) {
    console.error('Semrush Domain Overview Error:', error.message);
    return {
      domain,
      authorityScore: 0,
      organicKeywords: 0,
      organicTraffic: 0,
      organicCost: 0,
      paidKeywords: 0,
      paidTraffic: 0,
      paidCost: 0,
      backlinks: 0,
      referringDomains: 0,
      error: error.message
    };
  }
}

/**
 * Get top organic keywords from Semrush
 */
export async function getTopKeywords(domain: string, limit: number = 10): Promise<SemrushKeyword[]> {
  const apiKey = process.env.SEMRUSH_API_KEY;
  
  if (!apiKey) {
    return [];
  }

  try {
    const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
      params: {
        type: 'domain_organic',
        key: apiKey,
        export_columns: 'Ph,Po,Pp,Nq,Cp,Ur,Tr,Tc',
        domain: domain,
        database: 'us',
        display_limit: limit,
        display_sort: 'tr_desc'
      },
      timeout: 30000
    });

    const lines = response.data.trim().split('\n');
    if (lines.length < 2) return [];

    const keywords: SemrushKeyword[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      keywords.push({
        keyword: values[0] || '',
        position: parseInt(values[1]) || 0,
        previousPosition: parseInt(values[2]) || 0,
        searchVolume: parseInt(values[3]) || 0,
        cpc: parseFloat(values[4]) || 0,
        url: values[5] || '',
        traffic: parseInt(values[6]) || 0,
        trafficPercent: parseFloat(values[7]) || 0
      });
    }

    return keywords;
  } catch (error: any) {
    console.error('Semrush Keywords Error:', error.message);
    return [];
  }
}

/**
 * Get backlinks overview from Semrush
 */
export async function getBacklinksOverview(domain: string): Promise<SemrushBacklinksOverview> {
  const apiKey = process.env.SEMRUSH_API_KEY;
  
  if (!apiKey) {
    return {
      totalBacklinks: 0,
      referringDomains: 0,
      referringIps: 0,
      followLinks: 0,
      nofollowLinks: 0,
      textLinks: 0,
      imageLinks: 0,
      error: 'SEMRUSH_API_KEY not configured'
    };
  }

  try {
    const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
      params: {
        type: 'backlinks_overview',
        key: apiKey,
        target: domain,
        target_type: 'root_domain',
        export_columns: 'total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num'
      },
      timeout: 30000
    });

    const lines = response.data.trim().split('\n');
    if (lines.length < 2) {
      return {
        totalBacklinks: 0,
        referringDomains: 0,
        referringIps: 0,
        followLinks: 0,
        nofollowLinks: 0,
        textLinks: 0,
        imageLinks: 0,
        error: 'No backlinks data found'
      };
    }

    const values = lines[1].split(';');
    
    return {
      totalBacklinks: parseInt(values[0]) || 0,
      referringDomains: parseInt(values[1]) || 0,
      referringIps: parseInt(values[3]) || 0,
      followLinks: parseInt(values[4]) || 0,
      nofollowLinks: parseInt(values[5]) || 0,
      textLinks: parseInt(values[6]) || 0,
      imageLinks: parseInt(values[7]) || 0
    };
  } catch (error: any) {
    console.error('Semrush Backlinks Error:', error.message);
    return {
      totalBacklinks: 0,
      referringDomains: 0,
      referringIps: 0,
      followLinks: 0,
      nofollowLinks: 0,
      textLinks: 0,
      imageLinks: 0,
      error: error.message
    };
  }
}

/**
 * Get all Semrush data for a domain
 */
export async function analyzeDomainWithSemrush(url: string): Promise<SemrushData> {
  // Extract domain from URL
  let domain: string;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    domain = urlObj.hostname.replace('www.', '');
  } catch {
    domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }

  const apiKey = process.env.SEMRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ Semrush API key not configured. Using placeholder data.');
    return {
      domainOverview: {
        domain,
        authorityScore: 0,
        organicKeywords: 0,
        organicTraffic: 0,
        organicCost: 0,
        paidKeywords: 0,
        paidTraffic: 0,
        paidCost: 0,
        backlinks: 0,
        referringDomains: 0,
        error: 'API key not configured'
      },
      topKeywords: [],
      backlinksOverview: {
        totalBacklinks: 0,
        referringDomains: 0,
        referringIps: 0,
        followLinks: 0,
        nofollowLinks: 0,
        textLinks: 0,
        imageLinks: 0,
        error: 'API key not configured'
      },
      error: 'SEMRUSH_API_KEY not configured'
    };
  }

  console.log(`📊 Fetching Semrush data for: ${domain}`);

  // Run all API calls in parallel
  const [domainOverview, topKeywords, backlinksOverview] = await Promise.all([
    getDomainOverview(domain),
    getTopKeywords(domain, 10),
    getBacklinksOverview(domain)
  ]);

  // Add backlinks data to domain overview
  domainOverview.backlinks = backlinksOverview.totalBacklinks;
  domainOverview.referringDomains = backlinksOverview.referringDomains;

  return {
    domainOverview,
    topKeywords,
    backlinksOverview
  };
}

/**
 * Calculate keyword visibility score from Semrush data
 */
export function calculateKeywordVisibilityFromSemrush(data: SemrushData): {
  score: number;
  breakdown: {
    keywords: number;
    traffic: number;
    positions: number;
    trend: number;
  };
} {
  const { domainOverview, topKeywords } = data;
  
  // If no API key or no data, return placeholder
  if (data.error || domainOverview.error) {
    return {
      score: 9,
      breakdown: {
        keywords: 3,
        traffic: 2,
        positions: 2,
        trend: 2
      }
    };
  }

  let keywordsScore = 0;
  let trafficScore = 0;
  let positionsScore = 0;
  let trendScore = 2; // Default stable

  // Organic Keywords Score (6 points)
  const keywordCount = domainOverview.organicKeywords;
  if (keywordCount >= 1000) keywordsScore = 6;
  else if (keywordCount >= 500) keywordsScore = 5;
  else if (keywordCount >= 100) keywordsScore = 4;
  else if (keywordCount >= 50) keywordsScore = 3;
  else if (keywordCount >= 20) keywordsScore = 2;
  else if (keywordCount >= 5) keywordsScore = 1;

  // Traffic Score (5 points)
  const traffic = domainOverview.organicTraffic;
  if (traffic >= 100000) trafficScore = 5;
  else if (traffic >= 50000) trafficScore = 4;
  else if (traffic >= 10000) trafficScore = 3;
  else if (traffic >= 1000) trafficScore = 2;
  else if (traffic >= 100) trafficScore = 1;

  // Average Position Score (5 points)
  if (topKeywords.length > 0) {
    const avgPosition = topKeywords.reduce((sum, k) => sum + k.position, 0) / topKeywords.length;
    if (avgPosition <= 3) positionsScore = 5;
    else if (avgPosition <= 5) positionsScore = 4;
    else if (avgPosition <= 10) positionsScore = 3;
    else if (avgPosition <= 20) positionsScore = 2;
    else if (avgPosition <= 50) positionsScore = 1;
  }

  // Trend Score (4 points) - Based on position changes
  if (topKeywords.length > 0) {
    const improving = topKeywords.filter(k => k.position < k.previousPosition).length;
    const declining = topKeywords.filter(k => k.position > k.previousPosition).length;
    
    if (improving > declining * 2) trendScore = 4;
    else if (improving > declining) trendScore = 3;
    else if (improving === declining) trendScore = 2;
    else trendScore = 1;
  }

  const total = Math.min(20, keywordsScore + trafficScore + positionsScore + trendScore);

  return {
    score: total,
    breakdown: {
      keywords: keywordsScore,
      traffic: trafficScore,
      positions: positionsScore,
      trend: trendScore
    }
  };
}

/**
 * Calculate AI Trust score from Semrush backlinks data
 */
export function calculateBacklinkScoreFromSemrush(data: SemrushData): {
  backlinksScore: number;
  referringDomainsScore: number;
} {
  const { backlinksOverview } = data;
  
  if (data.error || backlinksOverview.error) {
    return {
      backlinksScore: 2,
      referringDomainsScore: 2
    };
  }

  let backlinksScore = 0;
  let referringDomainsScore = 0;

  // Backlinks Quality Score (6 points)
  // Based on follow/nofollow ratio and total count
  const totalBacklinks = backlinksOverview.totalBacklinks;
  const followRatio = backlinksOverview.followLinks / Math.max(totalBacklinks, 1);
  
  if (totalBacklinks >= 10000 && followRatio >= 0.7) backlinksScore = 6;
  else if (totalBacklinks >= 5000 && followRatio >= 0.6) backlinksScore = 5;
  else if (totalBacklinks >= 1000 && followRatio >= 0.5) backlinksScore = 4;
  else if (totalBacklinks >= 500) backlinksScore = 3;
  else if (totalBacklinks >= 100) backlinksScore = 2;
  else if (totalBacklinks >= 10) backlinksScore = 1;

  // Referring Domains Score (4 points)
  const refDomains = backlinksOverview.referringDomains;
  if (refDomains >= 500) referringDomainsScore = 4;
  else if (refDomains >= 200) referringDomainsScore = 3;
  else if (refDomains >= 50) referringDomainsScore = 2;
  else if (refDomains >= 10) referringDomainsScore = 1;

  return {
    backlinksScore,
    referringDomainsScore
  };
}

