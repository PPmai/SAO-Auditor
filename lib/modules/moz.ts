/**
 * Moz API Integration Module
 * 
 * Provides access to:
 * - Domain Authority (DA)
 * - Page Authority (PA)
 * - Spam Score
 * - Linking Domains (Referring Domains)
 * - Inbound Links (Backlinks)
 * 
 * API Documentation: https://moz.com/help/links-api
 * Pricing: Starter plan starts at $5/month
 */

import axios from 'axios';

const MOZ_API_BASE = 'https://lsapi.seomoz.com/v2';
const MOZ_API_TOKEN = process.env.MOZ_API_TOKEN || '';

export interface MozMetrics {
  domainAuthority: number;      // 0-100
  pageAuthority: number;        // 0-100
  spamScore: number;            // 0-100 (lower is better)
  linkingDomains: number;       // Referring domains count
  inboundLinks: number;         // Total backlinks count
  rootDomainsToPage: number;    // Unique domains linking to specific page
  error?: string;
}

export interface MozUrlMetricsResponse {
  domain_authority?: number;
  page_authority?: number;
  spam_score?: number;
  root_domains_to_root_domain?: number;
  external_pages_to_root_domain?: number;
  root_domains_to_page?: number;
  pages_to_page?: number;
}

/**
 * Check if Moz API is configured
 */
export function isMozConfigured(): boolean {
  return !!MOZ_API_TOKEN && MOZ_API_TOKEN.length > 10;
}

/**
 * Get URL metrics from Moz API
 * Uses the URL Metrics endpoint to fetch DA, PA, Spam Score, and link counts
 */
export async function getMozMetrics(url: string): Promise<MozMetrics> {
  if (!isMozConfigured()) {
    console.log('⚠️ Moz API not configured - using estimated scores');
    return getEstimatedMetrics();
  }

  try {
    // Normalize URL
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(targetUrl);
    const domain = urlObj.hostname;

    console.log(`🔍 Fetching Moz metrics for: ${domain}`);

    // Moz Links API v2 - URL Metrics endpoint
    const response = await axios.post<MozUrlMetricsResponse>(
      `${MOZ_API_BASE}/url_metrics`,
      {
        targets: [targetUrl]
      },
      {
        headers: {
          'x-moz-token': MOZ_API_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data = response.data;
    
    // Handle array response (Moz returns array for targets)
    const metrics = Array.isArray(data) ? data[0] : data;

    if (!metrics) {
      console.log('⚠️ No Moz data returned for URL');
      return getEstimatedMetrics();
    }

    const result: MozMetrics = {
      domainAuthority: metrics.domain_authority ?? 0,
      pageAuthority: metrics.page_authority ?? 0,
      spamScore: metrics.spam_score ?? 0,
      linkingDomains: metrics.root_domains_to_root_domain ?? 0,
      inboundLinks: metrics.external_pages_to_root_domain ?? 0,
      rootDomainsToPage: metrics.root_domains_to_page ?? 0,
    };

    console.log(`✅ Moz metrics retrieved: DA=${result.domainAuthority}, PA=${result.pageAuthority}`);
    return result;

  } catch (error: any) {
    console.error('❌ Moz API error:', error.response?.data || error.message);
    
    // Check for specific error types
    if (error.response?.status === 401) {
      return {
        ...getEstimatedMetrics(),
        error: 'Invalid Moz API token',
      };
    }
    
    if (error.response?.status === 429) {
      return {
        ...getEstimatedMetrics(),
        error: 'Moz API rate limit exceeded',
      };
    }

    return {
      ...getEstimatedMetrics(),
      error: error.message,
    };
  }
}

/**
 * Get bulk URL metrics (for competitor analysis)
 */
export async function getBulkMozMetrics(urls: string[]): Promise<Map<string, MozMetrics>> {
  const results = new Map<string, MozMetrics>();

  if (!isMozConfigured()) {
    // Return estimated metrics for all URLs
    urls.forEach(url => {
      results.set(url, getEstimatedMetrics());
    });
    return results;
  }

  try {
    // Moz API allows up to 50 targets per request
    const normalizedUrls = urls.slice(0, 50).map(url => 
      url.startsWith('http') ? url : `https://${url}`
    );

    const response = await axios.post(
      `${MOZ_API_BASE}/url_metrics`,
      {
        targets: normalizedUrls
      },
      {
        headers: {
          'x-moz-token': MOZ_API_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const dataArray = Array.isArray(response.data) ? response.data : [response.data];

    normalizedUrls.forEach((url, index) => {
      const metrics = dataArray[index];
      if (metrics) {
        results.set(url, {
          domainAuthority: metrics.domain_authority ?? 0,
          pageAuthority: metrics.page_authority ?? 0,
          spamScore: metrics.spam_score ?? 0,
          linkingDomains: metrics.root_domains_to_root_domain ?? 0,
          inboundLinks: metrics.external_pages_to_root_domain ?? 0,
          rootDomainsToPage: metrics.root_domains_to_page ?? 0,
        });
      } else {
        results.set(url, getEstimatedMetrics());
      }
    });

  } catch (error: any) {
    console.error('❌ Bulk Moz API error:', error.message);
    // Return estimated metrics on error
    urls.forEach(url => {
      results.set(url, getEstimatedMetrics());
    });
  }

  return results;
}

/**
 * Get anchor text distribution for a domain
 */
export async function getAnchorTextData(domain: string): Promise<{
  anchors: { text: string; count: number }[];
  error?: string;
}> {
  if (!isMozConfigured()) {
    return { anchors: [], error: 'Moz API not configured' };
  }

  try {
    const response = await axios.post(
      `${MOZ_API_BASE}/anchor_text`,
      {
        target: domain,
        scope: 'root_domain',
        limit: 50,
      },
      {
        headers: {
          'x-moz-token': MOZ_API_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const anchors = (response.data.results || []).map((item: any) => ({
      text: item.anchor_text || '',
      count: item.external_pages || 0,
    }));

    return { anchors };

  } catch (error: any) {
    return { anchors: [], error: error.message };
  }
}

/**
 * Get top linking domains
 */
export async function getTopLinkingDomains(domain: string, limit: number = 10): Promise<{
  domains: { domain: string; domainAuthority: number; links: number }[];
  error?: string;
}> {
  if (!isMozConfigured()) {
    return { domains: [], error: 'Moz API not configured' };
  }

  try {
    const response = await axios.post(
      `${MOZ_API_BASE}/linking_root_domains`,
      {
        target: domain,
        scope: 'root_domain',
        limit: limit,
        sort: 'domain_authority',
      },
      {
        headers: {
          'x-moz-token': MOZ_API_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const domains = (response.data.results || []).map((item: any) => ({
      domain: item.root_domain || '',
      domainAuthority: item.domain_authority || 0,
      links: item.external_pages_to_root_domain || 0,
    }));

    return { domains };

  } catch (error: any) {
    return { domains: [], error: error.message };
  }
}

/**
 * Estimated metrics when Moz API is not available
 * These are placeholder values - not real data
 */
function getEstimatedMetrics(): MozMetrics {
  return {
    domainAuthority: 0,
    pageAuthority: 0,
    spamScore: 0,
    linkingDomains: 0,
    inboundLinks: 0,
    rootDomainsToPage: 0,
  };
}

/**
 * Convert Moz metrics to scoring components
 * Maps Moz data to our 4-pillar scoring system
 */
export function mozMetricsToScores(metrics: MozMetrics): {
  backlinkScore: number;       // Max 6 points
  referringDomainsScore: number; // Max 4 points
  authorityBonus: number;       // Bonus for high DA
} {
  // Backlink Quality Score (6 points)
  // Based on Domain Authority and spam score
  let backlinkScore = 0;
  if (metrics.domainAuthority >= 60) {
    backlinkScore = 6;
  } else if (metrics.domainAuthority >= 40) {
    backlinkScore = 4;
  } else if (metrics.domainAuthority >= 20) {
    backlinkScore = 2;
  } else if (metrics.domainAuthority > 0) {
    backlinkScore = 1;
  }
  
  // Reduce score if high spam score
  if (metrics.spamScore > 30) {
    backlinkScore = Math.max(0, backlinkScore - 2);
  }

  // Referring Domains Score (4 points)
  // ≥100: 4, ≥50: 3, ≥20: 2, <20: 1
  let referringDomainsScore = 0;
  if (metrics.linkingDomains >= 100) {
    referringDomainsScore = 4;
  } else if (metrics.linkingDomains >= 50) {
    referringDomainsScore = 3;
  } else if (metrics.linkingDomains >= 20) {
    referringDomainsScore = 2;
  } else if (metrics.linkingDomains > 0) {
    referringDomainsScore = 1;
  }

  // Authority bonus (used for brand ranking pillar)
  const authorityBonus = Math.round(metrics.domainAuthority / 25); // 0-4 points

  return {
    backlinkScore,
    referringDomainsScore,
    authorityBonus,
  };
}

/**
 * Test Moz API connection
 */
export async function testMozConnection(): Promise<{
  success: boolean;
  message: string;
  sampleData?: MozMetrics;
}> {
  if (!isMozConfigured()) {
    return {
      success: false,
      message: 'MOZ_API_TOKEN not configured in environment variables',
    };
  }

  try {
    const metrics = await getMozMetrics('moz.com');
    return {
      success: true,
      message: 'Moz API connection successful',
      sampleData: metrics,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Moz API test failed: ${error.message}`,
    };
  }
}

