/**
 * API Manager - Cascading SEO Data Collection
 * 
 * Priority Order:
 * 1. Ahrefs (paid) - Best data quality
 * 2. DataForSEO (paid) - Good alternative
 * 3. Moz (free tier) - DA/PA, backlinks
 * 4. Estimates (fallback) - Basic calculations
 * 
 * This module orchestrates API calls with automatic failover.
 */

import { getUrlKeywords, getBacklinkMetrics, isAhrefsConfigured, AhrefsKeywordMetrics, AhrefsBacklinkMetrics } from './ahrefs';
import { getDomainKeywords, isDataForSEOConfigured, DomainKeywordMetrics } from './dataforseo';
import { getMozMetrics, isMozConfigured, MozMetrics } from './moz';

// Unified metrics interface
export interface UnifiedSEOMetrics {
    keywords: {
        total: number;
        top10: number;
        top100: number;
        avgPosition: number;
        estimatedTraffic: number;
    };
    backlinks: {
        total: number;
        referringDomains: number;
        domainRating: number;
        domainAuthority: number;
    };
    source: {
        keywords: 'ahrefs' | 'dataforseo' | 'moz' | 'estimate';
        backlinks: 'ahrefs' | 'moz' | 'estimate';
    };
    errors: string[];
}

/**
 * Get unified SEO metrics with cascading fallback
 * Tries: Ahrefs → DataForSEO → Moz → Estimates
 */
export async function getUnifiedSEOMetrics(url: string): Promise<UnifiedSEOMetrics> {
    const errors: string[] = [];
    let keywordSource: UnifiedSEOMetrics['source']['keywords'] = 'estimate';
    let backlinkSource: UnifiedSEOMetrics['source']['backlinks'] = 'estimate';

    // Initialize with empty metrics
    let keywords = { total: 0, top10: 0, top100: 0, avgPosition: 0, estimatedTraffic: 0 };
    let backlinks = { total: 0, referringDomains: 0, domainRating: 0, domainAuthority: 0 };

    // ===== STEP 1: Try Ahrefs first (best data) =====
    if (isAhrefsConfigured()) {
        console.log('🔍 API Manager: Trying Ahrefs...');
        try {
            const [ahrefsKeywords, ahrefsBacklinks] = await Promise.all([
                getUrlKeywords(url),
                getBacklinkMetrics(url)
            ]);

            // Check for keywords
            if (!ahrefsKeywords.error && ahrefsKeywords.totalKeywords > 0) {
                keywords = {
                    total: ahrefsKeywords.totalKeywords,
                    top10: ahrefsKeywords.keywords.filter(k => k.position <= 10).length,
                    top100: ahrefsKeywords.keywords.filter(k => k.position <= 100).length,
                    avgPosition: ahrefsKeywords.averagePosition,
                    estimatedTraffic: ahrefsKeywords.estimatedTraffic
                };
                keywordSource = 'ahrefs';
                console.log(`✅ Ahrefs keywords: ${keywords.total} found`);
            } else if (ahrefsKeywords.error) {
                errors.push(`Ahrefs keywords: ${ahrefsKeywords.error}`);
                console.log(`⚠️ Ahrefs keywords failed: ${ahrefsKeywords.error}`);
            }

            // Check for backlinks
            if (!ahrefsBacklinks.error && ahrefsBacklinks.referringDomains > 0) {
                backlinks = {
                    total: ahrefsBacklinks.backlinks,
                    referringDomains: ahrefsBacklinks.referringDomains,
                    domainRating: ahrefsBacklinks.domainRating,
                    domainAuthority: ahrefsBacklinks.domainRating // Use DR as DA equivalent
                };
                backlinkSource = 'ahrefs';
                console.log(`✅ Ahrefs backlinks: ${backlinks.referringDomains} referring domains`);
            } else if (ahrefsBacklinks.error) {
                errors.push(`Ahrefs backlinks: ${ahrefsBacklinks.error}`);
                console.log(`⚠️ Ahrefs backlinks failed: ${ahrefsBacklinks.error}`);
            }
        } catch (e: any) {
            errors.push(`Ahrefs error: ${e.message}`);
            console.log(`❌ Ahrefs failed: ${e.message}`);
        }
    }

    // ===== STEP 2: Try DataForSEO if keywords not found =====
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

    // ===== STEP 3: Try Moz if backlinks not found =====
    if (backlinkSource === 'estimate' && isMozConfigured()) {
        console.log('🔄 API Manager: Trying Moz for backlinks...');
        try {
            const moz = await getMozMetrics(url);
            if (moz.domainAuthority > 0 || moz.linkingDomains > 0) {
                backlinks = {
                    total: moz.inboundLinks || 0,
                    referringDomains: moz.linkingDomains || 0,
                    domainRating: moz.domainAuthority, // Use DA as DR equivalent
                    domainAuthority: moz.domainAuthority
                };
                backlinkSource = 'moz';
                console.log(`✅ Moz backlinks: DA ${backlinks.domainAuthority}`);
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
    ahrefs: boolean;
    dataforseo: boolean;
    moz: boolean;
} {
    return {
        ahrefs: isAhrefsConfigured(),
        dataforseo: isDataForSEOConfigured(),
        moz: isMozConfigured()
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
        trend: 'stable'
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
        // Add Ahrefs data if available
        ...(unified.source.backlinks === 'ahrefs' ? {
            ahrefsBacklinks: unified.backlinks.total,
            ahrefsReferringDomains: unified.backlinks.referringDomains,
            ahrefsDomainRating: unified.backlinks.domainRating
        } : {})
    };
}
