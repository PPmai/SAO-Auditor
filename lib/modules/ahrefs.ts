/**
 * Ahrefs API Integration Module
 * 
 * Used for:
 * - Organic Keywords (Pillar 3)
 * - SERP Competitor Benchmark (Pillar 3)
 * - Search Intent Match (Pillar 3)
 * - Backlink Quality (Pillar 4)
 * - Referring Domains (Pillar 4)
 * 
 * API Docs: https://docs.ahrefs.com/
 */

import axios from 'axios';

const AHREFS_API_BASE = 'https://api.ahrefs.com/v3';
const AHREFS_API_KEY = process.env.AHREFS_API_KEY || '';

export interface AhrefsKeyword {
    keyword: string;
    position: number;
    traffic: number;
    is_informational: boolean;
    is_commercial: boolean;
    is_transactional: boolean;
    is_navigational: boolean;
}

export interface AhrefsKeywordMetrics {
    totalKeywords: number;
    averagePosition: number;
    estimatedTraffic: number;
    keywords: AhrefsKeyword[];
    intentBreakdown: {
        informational: { count: number; percent: number };
        commercial: { count: number; percent: number };
        transactional: { count: number; percent: number };
        navigational: { count: number; percent: number };
        dominant: string;
        matchPercent: number;
    };
    error?: string;
}

export interface AhrefsBacklinkMetrics {
    backlinks: number;
    referringDomains: number;
    domainRating: number;
    error?: string;
}

export interface SerpCompetitor {
    url: string;
    keywordCount: number;
}

/**
 * Check if Ahrefs is configured
 */
export function isAhrefsConfigured(): boolean {
    return !!AHREFS_API_KEY && AHREFS_API_KEY.length > 0;
}

/**
 * Get organic keywords for a URL
 * Endpoint: site-explorer/organic-keywords
 */
export async function getUrlKeywords(url: string, country: string = 'th'): Promise<AhrefsKeywordMetrics> {
    if (!isAhrefsConfigured()) {
        console.log('⚠️ Ahrefs API not configured');
        return getEmptyKeywordMetrics('API key not configured');
    }

    try {
        const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash

        console.log(`🔍 Ahrefs: Fetching keywords for ${cleanUrl}`);

        const response = await axios.get(`${AHREFS_API_BASE}/site-explorer/organic-keywords`, {
            headers: {
                'Authorization': `Bearer ${AHREFS_API_KEY}`,
                'Accept': 'application/json',
            },
            params: {
                target: cleanUrl,
                mode: 'exact',
                country: country,
                select: 'keyword,best_position,sum_traffic,is_informational,is_commercial,is_transactional,is_navigational',
                order_by: 'sum_traffic:desc',
                limit: 100,
            },
            timeout: 30000,
        });

        const keywords = response.data?.keywords || [];

        if (keywords.length === 0) {
            return getEmptyKeywordMetrics('No keywords found for this URL');
        }

        // Calculate metrics
        const totalKeywords = keywords.length;
        const avgPosition = keywords.reduce((sum: number, k: any) => sum + (k.best_position || 100), 0) / totalKeywords;
        const totalTraffic = keywords.reduce((sum: number, k: any) => sum + (k.sum_traffic || 0), 0);

        // Calculate intent breakdown
        let infoCount = 0, commCount = 0, transCount = 0, navCount = 0;

        keywords.forEach((k: any) => {
            if (k.is_informational) infoCount++;
            if (k.is_commercial) commCount++;
            if (k.is_transactional) transCount++;
            if (k.is_navigational) navCount++;
        });

        // Find dominant intent
        const intentCounts = [
            { type: 'informational', count: infoCount },
            { type: 'commercial', count: commCount },
            { type: 'transactional', count: transCount },
            { type: 'navigational', count: navCount },
        ];
        intentCounts.sort((a, b) => b.count - a.count);
        const dominant = intentCounts[0];

        const result: AhrefsKeywordMetrics = {
            totalKeywords,
            averagePosition: Math.round(avgPosition * 10) / 10,
            estimatedTraffic: Math.round(totalTraffic),
            keywords: keywords.slice(0, 20).map((k: any) => ({
                keyword: k.keyword,
                position: k.best_position,
                traffic: k.sum_traffic,
                is_informational: k.is_informational || false,
                is_commercial: k.is_commercial || false,
                is_transactional: k.is_transactional || false,
                is_navigational: k.is_navigational || false,
            })),
            intentBreakdown: {
                informational: { count: infoCount, percent: Math.round((infoCount / totalKeywords) * 100) },
                commercial: { count: commCount, percent: Math.round((commCount / totalKeywords) * 100) },
                transactional: { count: transCount, percent: Math.round((transCount / totalKeywords) * 100) },
                navigational: { count: navCount, percent: Math.round((navCount / totalKeywords) * 100) },
                dominant: dominant.type,
                matchPercent: Math.round((dominant.count / totalKeywords) * 100),
            },
        };

        console.log(`✅ Ahrefs: ${totalKeywords} keywords, Avg #${avgPosition.toFixed(1)}, Dominant: ${dominant.type}`);
        return result;

    } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('❌ Ahrefs API error:', errorMsg);

        // Check for rate limit or credit issues
        if (error.response?.status === 429) {
            return getEmptyKeywordMetrics('Ahrefs API rate limit exceeded');
        }
        if (error.response?.status === 402) {
            return getEmptyKeywordMetrics('Ahrefs API credits exhausted - please add credits');
        }

        return getEmptyKeywordMetrics(errorMsg);
    }
}

/**
 * Get SERP competitors for benchmark
 * Endpoint: serp-overview
 */
export async function getSerpCompetitors(keyword: string, country: string = 'th'): Promise<SerpCompetitor[]> {
    if (!isAhrefsConfigured()) {
        return [];
    }

    try {
        const response = await axios.get(`${AHREFS_API_BASE}/serp-overview`, {
            headers: {
                'Authorization': `Bearer ${AHREFS_API_KEY}`,
                'Accept': 'application/json',
            },
            params: {
                keyword: keyword,
                country: country,
                select: 'url,keywords',
                limit: 10,
            },
            timeout: 30000,
        });

        const results = response.data?.serp || [];

        return results.map((r: any) => ({
            url: r.url,
            keywordCount: r.keywords || 0,
        }));

    } catch (error: any) {
        console.error('❌ Ahrefs SERP error:', error.message);
        return [];
    }
}

/**
 * Get backlink metrics for a domain
 * Endpoint: site-explorer/backlinks-stats
 */
export async function getBacklinkMetrics(domain: string): Promise<AhrefsBacklinkMetrics> {
    if (!isAhrefsConfigured()) {
        return { backlinks: 0, referringDomains: 0, domainRating: 0, error: 'API key not configured' };
    }

    try {
        const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

        console.log(`🔗 Ahrefs: Fetching backlinks for ${cleanDomain}`);

        const response = await axios.get(`${AHREFS_API_BASE}/site-explorer/backlinks-stats`, {
            headers: {
                'Authorization': `Bearer ${AHREFS_API_KEY}`,
                'Accept': 'application/json',
            },
            params: {
                target: cleanDomain,
                mode: 'domain',
            },
            timeout: 30000,
        });

        const stats = response.data?.stats || {};

        const result: AhrefsBacklinkMetrics = {
            backlinks: stats.live || 0,
            referringDomains: stats.refdomains || 0,
            domainRating: stats.domain_rating || 0,
        };

        console.log(`✅ Ahrefs: ${result.referringDomains} referring domains, DR ${result.domainRating}`);
        return result;

    } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('❌ Ahrefs backlinks error:', errorMsg);

        if (error.response?.status === 402) {
            return { backlinks: 0, referringDomains: 0, domainRating: 0, error: 'Ahrefs API credits exhausted - please add credits' };
        }

        return { backlinks: 0, referringDomains: 0, domainRating: 0, error: errorMsg };
    }
}

/**
 * Calculate keyword benchmark from SERP competitors
 */
export async function getKeywordBenchmark(targetUrl: string, country: string = 'th'): Promise<{
    benchmark: number;
    competitors: SerpCompetitor[];
}> {
    // First get keywords for target URL
    const keywords = await getUrlKeywords(targetUrl, country);

    if (keywords.totalKeywords === 0 || keywords.keywords.length === 0) {
        return { benchmark: 20, competitors: [] }; // Default benchmark
    }

    // Get primary keyword (highest traffic)
    const primaryKeyword = keywords.keywords[0].keyword;

    // Get SERP competitors
    const competitors = await getSerpCompetitors(primaryKeyword, country);

    // Filter out target URL and get top 5
    const otherCompetitors = competitors
        .filter(c => !c.url.includes(targetUrl.replace(/^https?:\/\//, '')))
        .slice(0, 5);

    if (otherCompetitors.length === 0) {
        return { benchmark: 20, competitors: [] };
    }

    // Calculate average
    const benchmark = otherCompetitors.reduce((sum, c) => sum + c.keywordCount, 0) / otherCompetitors.length;

    return {
        benchmark: Math.round(benchmark),
        competitors: otherCompetitors,
    };
}

/**
 * Empty metrics when API unavailable
 */
function getEmptyKeywordMetrics(errorMsg: string): AhrefsKeywordMetrics {
    return {
        totalKeywords: 0,
        averagePosition: 0,
        estimatedTraffic: 0,
        keywords: [],
        intentBreakdown: {
            informational: { count: 0, percent: 0 },
            commercial: { count: 0, percent: 0 },
            transactional: { count: 0, percent: 0 },
            navigational: { count: 0, percent: 0 },
            dominant: 'unknown',
            matchPercent: 0,
        },
        error: errorMsg,
    };
}

/**
 * Test Ahrefs API connection
 */
export async function testAhrefsConnection(): Promise<{
    success: boolean;
    message: string;
}> {
    if (!isAhrefsConfigured()) {
        return { success: false, message: 'AHREFS_API_KEY not configured in .env' };
    }

    try {
        // Simple test with a known domain
        const result = await getBacklinkMetrics('google.com');

        if (result.error) {
            return { success: false, message: result.error };
        }

        return { success: true, message: `Ahrefs connected! Test: google.com has DR ${result.domainRating}` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
