/**
 * API Manager - Cascading SEO Data Collection
 * 
 * Priority Order for Keywords:
 * 1. Google Custom Search API (via Keyword Discovery) - Real ranking data
 * 2. DataForSEO (paid) - Good alternative
 * 3. Estimates (fallback) - Basic calculations
 * 
 * Priority Order for Backlinks:
 * 1. Common Crawl (free) - Backlink discovery, referring domains, anchor text
 * 2. Moz (free tier) - DA/PA, backlinks
 * 3. Estimates (fallback) - Basic calculations
 * 
 * This module orchestrates API calls with automatic failover.
 */

import { getDomainKeywords, isDataForSEOConfigured, DomainKeywordMetrics } from './dataforseo';
import { getMozMetrics, isMozConfigured, MozMetrics } from './moz';
import { getBacklinkMetrics, isCommonCrawlAvailable, CommonCrawlBacklinkMetrics } from './commoncrawl';
import { discoverKeywords, KeywordDiscoveryResult } from './keyword-discovery';
import { isGoogleCustomSearchConfigured } from './google-custom-search';

// Unified metrics interface
export interface UnifiedSEOMetrics {
    keywords: {
        total: number;
        top10: number;
        top100: number;
        avgPosition: number;
        estimatedTraffic: number;
        intentBreakdown?: {
            informational: number;
            commercial: number;
            transactional: number;
            navigational: number;
            dominant: string;
            dominantPercent: number;
        };
    };
    backlinks: {
        total: number;
        referringDomains: number;
        domainRating: number;
        domainAuthority: number;
    };
    source: {
        keywords: 'googlecustomsearch' | 'dataforseo' | 'estimate';
        backlinks: 'commoncrawl' | 'moz' | 'estimate';
    };
    errors: string[];
}

/**
 * Get unified SEO metrics with cascading fallback
 * Keywords: Ahrefs → DataForSEO → Estimates
 * Backlinks: Common Crawl → Moz → Estimates
 */
export async function getUnifiedSEOMetrics(url: string): Promise<UnifiedSEOMetrics> {
    const errors: string[] = [];
    let keywordSource: UnifiedSEOMetrics['source']['keywords'] = 'estimate';
    let backlinkSource: UnifiedSEOMetrics['source']['backlinks'] = 'estimate';

    // Initialize with empty metrics
    let keywords = { total: 0, top10: 0, top100: 0, avgPosition: 0, estimatedTraffic: 0 };
    let backlinks = { total: 0, referringDomains: 0, domainRating: 0, domainAuthority: 0 };

    // ===== STEP 1: Try Common Crawl for backlinks (free, always available) =====
    // Note: Common Crawl Index API has a limitation - it cannot find backlinks directly
    // It will return empty results and we'll fall back to Moz API
    if (isCommonCrawlAvailable()) {
        console.log('🔍 API Manager: Trying Common Crawl for backlinks...');
        try {
            const commonCrawlBacklinks = await getBacklinkMetrics(url);
            // Common Crawl Index API limitation: cannot find backlinks directly
            // Check if we got actual data (not just the limitation error)
            if (!commonCrawlBacklinks.error && commonCrawlBacklinks.referringDomains > 0) {
                backlinks = {
                    total: commonCrawlBacklinks.backlinks,
                    referringDomains: commonCrawlBacklinks.referringDomains,
                    domainRating: commonCrawlBacklinks.domainRating, // Always 0 (not available)
                    domainAuthority: 0 // Will be filled by Moz if available
                };
                backlinkSource = 'commoncrawl';
                console.log(`✅ Common Crawl backlinks: ${backlinks.referringDomains} referring domains`);
            } else {
                // Common Crawl has limitation - silently continue to Moz fallback
                // Don't log error as this is expected behavior
                if (commonCrawlBacklinks.error && !commonCrawlBacklinks.error.includes('Index API limitation')) {
                    // Only log if it's an unexpected error
                    console.log(`⚠️ Common Crawl: ${commonCrawlBacklinks.error}`);
                }
            }
        } catch (e: any) {
            // Only log unexpected errors (not connection timeouts which are expected)
            if (!e.message.includes('timeout') && !e.message.includes('ECONNREFUSED')) {
                errors.push(`Common Crawl error: ${e.message}`);
                console.log(`❌ Common Crawl failed: ${e.message}`);
            }
        }
    }

    // ===== STEP 2: Try Google Custom Search API (Keyword Discovery) for keywords =====
    if (isGoogleCustomSearchConfigured()) {
        console.log('🔍 API Manager: Trying Google Custom Search (Keyword Discovery) for keywords...');
        try {
            // Extract domain from URL
            let domain = '';
            try {
                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                domain = urlObj.hostname.replace('www.', '');
            } catch {
                domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
            }

            // Get scraping data first (needed for keyword discovery)
            const { scrapeWebsite } = await import('./scraper');
            const scrapingData = await scrapeWebsite(url);

            // Use keyword discovery module
            const discoveryResult = await discoverKeywords(url, domain, scrapingData, 'th');
            
            if (discoveryResult.totalKeywordsFound > 0) {
                // Calculate average position from discovered keywords
                const allKeywords = discoveryResult.allKeywords || [];
                const keywordsWithPosition = allKeywords.filter(k => k.position !== null);
                const avgPosition = keywordsWithPosition.length > 0
                    ? keywordsWithPosition.reduce((sum, k) => sum + (k.position || 0), 0) / keywordsWithPosition.length
                    : 0;

                // Convert intent breakdown to percentage format
                const totalIntent = discoveryResult.intentBreakdown.informational + 
                                  discoveryResult.intentBreakdown.commercial + 
                                  discoveryResult.intentBreakdown.transactional + 
                                  discoveryResult.intentBreakdown.navigational;
                
                keywords = {
                    total: discoveryResult.totalKeywordsFound,
                    top10: discoveryResult.keywordsInTop10,
                    top100: discoveryResult.keywordsInTop100,
                    avgPosition: avgPosition,
                    estimatedTraffic: 0, // Not available from Custom Search
                    intentBreakdown: {
                        informational: discoveryResult.intentBreakdown.informational,
                        commercial: discoveryResult.intentBreakdown.commercial,
                        transactional: discoveryResult.intentBreakdown.transactional,
                        navigational: discoveryResult.intentBreakdown.navigational,
                        dominant: discoveryResult.intentBreakdown.dominant,
                        dominantPercent: totalIntent > 0 
                            ? Math.round(((discoveryResult.intentBreakdown[discoveryResult.intentBreakdown.dominant as 'informational' | 'commercial' | 'transactional' | 'navigational'] || 0) / totalIntent) * 100)
                            : 0
                    }
                } as UnifiedSEOMetrics['keywords'];
                keywordSource = 'googlecustomsearch';
                console.log(`✅ Google Custom Search keywords: ${keywords.total} found (${keywords.top10} in top 10, avg position: ${avgPosition.toFixed(1)}, intent: ${discoveryResult.intentBreakdown.dominant})`);
            } else {
                console.log(`⚠️ Google Custom Search: No keywords found`);
            }
        } catch (e: any) {
            errors.push(`Google Custom Search keyword discovery error: ${e.message}`);
            console.log(`❌ Google Custom Search keyword discovery failed: ${e.message}`);
        }
    }

    // ===== STEP 3: Try DataForSEO if keywords not found =====
    if (keywordSource === 'estimate' && isDataForSEOConfigured()) {
        console.log('🔄 API Manager: Trying DataForSEO for keywords...');
        try {
            const dataForSEO = await getDomainKeywords(url);
            if (!dataForSEO.error && dataForSEO.totalKeywords > 0) {
                keywords = {
                    total: dataForSEO.totalKeywords,
                    top10: dataForSEO.keywordsTop10,
                    top100: dataForSEO.keywordsTop100,
                    avgPosition: dataForSEO.averagePosition,
                    estimatedTraffic: dataForSEO.estimatedTraffic
                };
                keywordSource = 'dataforseo';
                console.log(`✅ DataForSEO keywords: ${keywords.total} found`);
            } else if (dataForSEO.error) {
                errors.push(`DataForSEO: ${dataForSEO.error}`);
            }
        } catch (e: any) {
            errors.push(`DataForSEO error: ${e.message}`);
        }
    }

    // ===== STEP 4: Try Moz if backlinks not found or to get DA =====
    if (isMozConfigured()) {
        console.log('🔄 API Manager: Trying Moz for backlinks/DA...');
        try {
            const moz = await getMozMetrics(url);
            if (moz.domainAuthority > 0 || moz.linkingDomains > 0) {
                // If Common Crawl didn't provide data, use Moz
                if (backlinkSource === 'estimate') {
                    backlinks = {
                        total: moz.inboundLinks || 0,
                        referringDomains: moz.linkingDomains || 0,
                        domainRating: moz.domainAuthority, // Use DA as DR equivalent
                        domainAuthority: moz.domainAuthority
                    };
                    backlinkSource = 'moz';
                    console.log(`✅ Moz backlinks: DA ${backlinks.domainAuthority}`);
                } else {
                    // Common Crawl provided data, but add DA from Moz
                    backlinks.domainAuthority = moz.domainAuthority;
                    if (backlinks.domainRating === 0) {
                        backlinks.domainRating = moz.domainAuthority; // Use DA as DR if not available
                    }
                    console.log(`✅ Moz DA: ${moz.domainAuthority} (added to Common Crawl data)`);
                }
            }
        } catch (e: any) {
            errors.push(`Moz error: ${e.message}`);
        }
    }

    // ===== STEP 4: Generate estimates if still no data =====
    if (keywordSource === 'estimate') {
        console.log('📊 API Manager: Using keyword estimates...');
        keywords = generateKeywordEstimates(url);
    }

    if (backlinkSource === 'estimate') {
        console.log('📊 API Manager: Using backlink estimates...');
        backlinks = generateBacklinkEstimates(url);
    }

    console.log(`📈 API Manager Summary: Keywords from ${keywordSource}, Backlinks from ${backlinkSource}`);

    return {
        keywords,
        backlinks,
        source: {
            keywords: keywordSource,
            backlinks: backlinkSource
        },
        errors
    };
}

/**
 * Generate keyword estimates based on URL analysis
 */
function generateKeywordEstimates(url: string): UnifiedSEOMetrics['keywords'] {
    // Simple heuristic - established domains likely have more keywords
    const domain = new URL(url).hostname;
    const isWellKnown = domain.includes('.com') || domain.includes('.co.th') || domain.includes('.org');

    return {
        total: isWellKnown ? 50 : 10,
        top10: isWellKnown ? 5 : 1,
        top100: isWellKnown ? 30 : 5,
        avgPosition: 35,
        estimatedTraffic: isWellKnown ? 500 : 50
    };
}

/**
 * Generate backlink estimates based on URL analysis
 */
function generateBacklinkEstimates(url: string): UnifiedSEOMetrics['backlinks'] {
    const domain = new URL(url).hostname;
    const isWellKnown = domain.includes('.com') || domain.includes('.co.th') || domain.includes('.org');

    return {
        total: isWellKnown ? 100 : 10,
        referringDomains: isWellKnown ? 20 : 5,
        domainRating: isWellKnown ? 25 : 10,
        domainAuthority: isWellKnown ? 25 : 10
    };
}

/**
 * Get API status for debugging
 */
export function getAPIStatus(): {
    dataforseo: boolean;
    moz: boolean;
    commoncrawl: boolean;
    googleCustomSearch: boolean;
} {
    return {
        dataforseo: isDataForSEOConfigured(),
        moz: isMozConfigured(),
        commoncrawl: isCommonCrawlAvailable(),
        googleCustomSearch: isGoogleCustomSearchConfigured()
    };
}

/**
 * Convert unified metrics to DomainKeywordMetrics format for scoring
 */
export function toKeywordMetrics(unified: UnifiedSEOMetrics): DomainKeywordMetrics | undefined {
    if (unified.source.keywords === 'estimate' && unified.keywords.total === 0) {
        return undefined;
    }

    return {
        totalKeywords: unified.keywords.total,
        keywordsTop10: unified.keywords.top10,
        keywordsTop100: unified.keywords.top100,
        estimatedTraffic: unified.keywords.estimatedTraffic,
        averagePosition: unified.keywords.avgPosition,
        topKeywords: [],
        trend: 'stable',
        // Include intent breakdown if available from keyword discovery
        intentBreakdown: unified.keywords.intentBreakdown
    };
}

/**
 * Convert unified metrics to enhanced Moz format for scoring
 */
export function toMozMetrics(unified: UnifiedSEOMetrics, baseMoz: MozMetrics): MozMetrics {
    return {
        ...baseMoz,
        domainAuthority: unified.backlinks.domainAuthority || baseMoz.domainAuthority,
        linkingDomains: unified.backlinks.referringDomains || baseMoz.linkingDomains,
        inboundLinks: unified.backlinks.total || baseMoz.inboundLinks,
        // Add Common Crawl data if available
        ...(unified.source.backlinks === 'commoncrawl' ? {
            commonCrawlBacklinks: unified.backlinks.total,
            commonCrawlReferringDomains: unified.backlinks.referringDomains
        } : {})
    };
}
