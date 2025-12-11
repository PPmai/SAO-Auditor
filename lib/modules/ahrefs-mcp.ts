/**
 * Ahrefs API Integration via MCP (Model Context Protocol)
 * 
 * This module provides an alternative implementation using MCP when available.
 * MCP allows access to Ahrefs API v3 through the AI assistant context.
 * 
 * Note: MCP is typically used in AI assistant contexts (like Cursor),
 * not directly in application code. This is a bridge for when MCP is available.
 */

import { 
    AhrefsKeywordMetrics, 
    AhrefsBacklinkMetrics, 
    SerpCompetitor,
    AhrefsKeyword
} from './ahrefs';

/**
 * Check if MCP is available
 * In a real implementation, this would check if MCP server is connected
 */
export function isMCPAvailable(): boolean {
    // This would check if MCP server is available
    // For now, return false - MCP is typically used in AI context
    return false;
}

/**
 * Get organic keywords via MCP
 * This would be called from an AI assistant context, not directly from app code
 */
export async function getUrlKeywordsViaMCP(
    url: string, 
    country: string = 'us'
): Promise<AhrefsKeywordMetrics> {
    // This is a placeholder - actual MCP calls happen in AI assistant context
    // The AI assistant would call: mcp_ahrefs_site-explorer-organic-keywords
    
    throw new Error('MCP calls must be made from AI assistant context, not application code');
}

/**
 * Get backlink metrics via MCP
 */
export async function getBacklinkMetricsViaMCP(
    domain: string
): Promise<AhrefsBacklinkMetrics> {
    // Placeholder - MCP calls happen in AI assistant context
    throw new Error('MCP calls must be made from AI assistant context, not application code');
}

/**
 * Helper: Convert MCP response to our format
 */
export function convertMCPKeywordsResponse(mcpResponse: any): AhrefsKeywordMetrics {
    const keywords = mcpResponse?.keywords || [];
    
    if (keywords.length === 0) {
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
            error: 'No keywords found',
        };
    }

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

    const intentCounts = [
        { type: 'informational', count: infoCount },
        { type: 'commercial', count: commCount },
        { type: 'transactional', count: transCount },
        { type: 'navigational', count: navCount },
    ];
    intentCounts.sort((a, b) => b.count - a.count);
    const dominant = intentCounts[0];

    return {
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
}

/**
 * Helper: Convert MCP backlinks response
 */
export function convertMCPBacklinksResponse(mcpResponse: any): AhrefsBacklinkMetrics {
    const stats = mcpResponse?.metrics || mcpResponse?.stats || {};
    
    return {
        backlinks: stats.live || 0,
        referringDomains: stats.live_refdomains || stats.refdomains || 0,
        domainRating: mcpResponse?.domain_rating?.domain_rating || 0,
    };
}




