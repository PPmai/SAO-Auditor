/**
 * Common Crawl Integration Module
 * 
 * Replaces Ahrefs backlink features with free Common Crawl data:
 * - Backlink Discovery
 * - Referring Domains
 * - Anchor Text Analysis
 * - Outbound Links
 * - Content Analysis (via existing scraper)
 * - Keyword Discovery & Validation (NEW)
 * 
 * Common Crawl Index API: https://index.commoncrawl.org/
 * Data freshness: 1-3 months (monthly crawls)
 */

import axios from 'axios';

// Cache for Common Crawl results (30 days TTL since data is monthly)
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

export interface CommonCrawlBacklinkMetrics {
    backlinks: number;
    referringDomains: number;
    domainRating: number; // Always 0 (not available from Common Crawl)
    anchorText: {
        text: string;
        count: number;
    }[];
    outboundLinks: number;
    error?: string;
}

export interface BacklinkRecord {
    url_from: string;
    url_to: string;
    anchor: string;
    domain_from: string;
}

/**
 * Get latest Common Crawl collection ID
 */
/**
 * Get latest Common Crawl collection ID with retry logic
 */
async function getLatestCrawlId(retries: number = 2): Promise<string | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await axios.get('https://index.commoncrawl.org/collinfo.json', {
                timeout: 15000, // Increased timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; SAO-Auditor/1.0)',
                },
                // Retry on network errors
                validateStatus: (status) => status < 500,
            });
            
            if (response.status === 200 && response.data && Array.isArray(response.data) && response.data.length > 0) {
                return response.data[0].id; // Latest crawl ID
            }
            
            // If we get here, response was not 200 or data is invalid
            if (attempt < retries) {
                console.log(`⚠️ Common Crawl: Retry ${attempt + 1}/${retries} for crawl ID...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                continue;
            }
            
            return null;
        } catch (error: any) {
            // Network errors - retry
            if ((error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') && attempt < retries) {
                console.log(`⚠️ Common Crawl: Connection error, retry ${attempt + 1}/${retries}...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                continue;
            }
            
            // Final attempt failed or non-retryable error
            if (attempt === retries) {
                console.error('❌ Common Crawl: Failed to get latest crawl ID after retries:', error.message);
                console.error('   💡 This is expected - Common Crawl Index API has limitations');
                console.error('   💡 System will fall back to Moz API or estimates');
            }
            return null;
        }
    }
    return null;
}

/**
 * Query Common Crawl Index API for backlinks
 * 
 * IMPORTANT LIMITATION: Common Crawl Index API does NOT support reverse lookups
 * (finding pages that link TO a domain). The Index API only finds pages BY URL pattern.
 * 
 * To find actual backlinks, you would need to:
 * 1. Process WARC files directly (resource-intensive, requires significant compute)
 * 2. Use a pre-processed Common Crawl service (e.g., Common Crawl Columnar Index on AWS)
 * 3. Use AWS Athena to query the columnar index (costs ~$5/TB scanned)
 * 
 * This implementation provides a placeholder that:
 * - Attempts to query the index (will likely return empty/timeout)
 * - Falls back gracefully to other APIs (Moz, estimates)
 * - Documents the limitation clearly
 * 
 * For production backlink discovery via Common Crawl, consider:
 * - Using AWS Athena with Common Crawl Columnar Index
 * - Processing WARC files with tools like warcio
 * - Using a service that has pre-processed Common Crawl data
 */
async function queryCommonCrawlIndex(domain: string, crawlId: string): Promise<BacklinkRecord[]> {
    // Common Crawl Index API limitation: Cannot directly find backlinks
    // The Index API finds pages by URL, not pages that link to a URL
    // 
    // This is a known limitation - full backlink discovery requires WARC processing
    // For now, we return empty array and let the system fall back to Moz/estimates
    
    console.log(`⚠️ Common Crawl: Index API does not support reverse lookups (finding pages linking TO ${domain})`);
    console.log(`   Full backlink discovery requires WARC file processing or AWS Athena queries`);
    console.log(`   Falling back to Moz API or estimates...`);
    
    // Return empty array - this allows graceful fallback to Moz API
    return [];
}

/**
 * Get backlinks for a domain using Common Crawl
 */
export async function getBacklinks(domain: string): Promise<BacklinkRecord[]> {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    const cacheKey = `backlinks:${cleanDomain}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 Common Crawl: Using cached backlinks for ${cleanDomain}`);
        return cached.data;
    }

    console.log(`🔍 Common Crawl: Fetching backlinks for ${cleanDomain}`);

    try {
        const crawlId = await getLatestCrawlId(2); // 2 retries
        if (!crawlId) {
            // This is expected - Common Crawl Index API has limitations
            // Return empty and let system fall back to Moz
            console.log(`⚠️ Common Crawl: Could not get crawl ID (expected limitation)`);
            console.log(`   → System will fall back to Moz API or estimates`);
            
            // Cache empty result to avoid repeated attempts
            cache.set(cacheKey, { data: [], timestamp: Date.now() });
            return [];
        }

        const records = await queryCommonCrawlIndex(cleanDomain, crawlId);
        
        // Cache results (even if empty)
        cache.set(cacheKey, { data: records, timestamp: Date.now() });
        
        if (records.length > 0) {
            console.log(`✅ Common Crawl: Found ${records.length} backlink records for ${cleanDomain}`);
        } else {
            console.log(`✅ Common Crawl: Found 0 backlink records for ${cleanDomain} (Index API limitation)`);
        }
        
        return records;
    } catch (error: any) {
        console.error(`❌ Common Crawl: Error fetching backlinks for ${cleanDomain}:`, error.message);
        console.error(`   → System will fall back to Moz API or estimates`);
        
        // Cache empty result to avoid repeated attempts
        cache.set(cacheKey, { data: [], timestamp: Date.now() });
    return [];
  }
}

export interface KeywordValidationResult {
  keyword: string;
  foundInCommonCrawl: boolean;
  pageCount: number; // Number of pages in Common Crawl containing this keyword
  relatedKeywords: string[]; // Keywords found on similar pages
  confidence: number; // 0-1, based on how common this keyword is
}

/**
 * Validate and enrich keywords using Common Crawl
 * 
 * Uses Common Crawl Index API to:
 * 1. Check if keywords appear in URL paths of crawled pages (heuristic validation)
 * 2. Find related keywords from similar pages' URL paths
 * 3. Calculate confidence score based on keyword frequency in URLs
 * 
 * Note: Common Crawl Index API only searches by URL pattern, not content.
 * This is a heuristic approach - full content analysis requires WARC processing.
 * 
 * @param keywords - Keywords to validate (from Gemini)
 * @param domain - Target domain for context
 * @param maxKeywords - Maximum keywords to check (API quota)
 */
export async function validateKeywordsWithCommonCrawl(
  keywords: string[],
  domain: string,
  maxKeywords: number = 20
): Promise<KeywordValidationResult[]> {
  const results: KeywordValidationResult[] = [];
  const keywordsToCheck = keywords.slice(0, maxKeywords);
  
  console.log(`🔍 Common Crawl: Validating ${keywordsToCheck.length} keywords...`);
  
  const crawlId = await getLatestCrawlId();
  if (!crawlId) {
    console.warn('⚠️ Common Crawl: Could not get latest crawl ID');
    // Return empty validation results
    return keywordsToCheck.map(kw => ({
      keyword: kw,
      foundInCommonCrawl: false,
      pageCount: 0,
      relatedKeywords: [],
      confidence: 0.3 // Default confidence for keywords without validation
    }));
  }
  
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  for (const keyword of keywordsToCheck) {
    try {
      // Search for pages where keyword might appear in URL path
      // Common Crawl Index API searches by URL pattern
      // We search for pages on the target domain that might contain the keyword
      const keywordSlug = keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
      const searchPattern = `${cleanDomain}/*${keywordSlug}*`;
      
      // Query Common Crawl Index API
      const indexUrl = `https://index.commoncrawl.org/CC-MAIN-${crawlId}-index?url=${encodeURIComponent(searchPattern)}&output=json&limit=10`;
      
      const response = await axios.get(indexUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SAO-Auditor/1.0)',
        },
        validateStatus: (status) => status < 500,
      });
      
      let pageCount = 0;
      const relatedKeywords: string[] = [];
      
      if (response.status === 200 && response.data) {
        // Parse response (may be JSON lines format or plain text)
        let lines: string[] = [];
        if (typeof response.data === 'string') {
          lines = response.data.toString().trim().split('\n').filter(line => line.trim());
        } else if (Array.isArray(response.data)) {
          lines = response.data.map(item => JSON.stringify(item));
        }
        
        for (const line of lines.slice(0, 10)) {
          try {
            const record = typeof line === 'string' ? JSON.parse(line) : line;
            if (record.url) {
              pageCount++;
              
              // Extract potential related keywords from URL path
              try {
                const urlPath = new URL(record.url).pathname.toLowerCase();
                const urlKeywords = urlPath
                  .split(/[\/\-_]/)
                  .filter(part => 
                    part.length > 2 && 
                    part.length < 20 &&
                    !part.match(/^\d+$/) && // Not just numbers
                    !part.match(/^(page|index|home|about|contact|en|th)$/i) // Not common page names
                  )
                  .slice(0, 3); // Take first 3 potential keywords
                
                relatedKeywords.push(...urlKeywords);
              } catch {
                // Invalid URL, skip
                continue;
              }
            }
          } catch {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
      
      // Calculate confidence based on page count
      // More pages = higher confidence that keyword is relevant
      // Even if not found, give some confidence (0.3) since Gemini suggested it
      const confidence = pageCount > 0 
        ? Math.min(1, 0.5 + (pageCount / 20)) // 0.5-1.0 based on page count
        : 0.3; // Default confidence for keywords not found in URLs
      
      results.push({
        keyword,
        foundInCommonCrawl: pageCount > 0,
        pageCount,
        relatedKeywords: [...new Set(relatedKeywords)].slice(0, 5), // Unique, max 5
        confidence
      });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error: any) {
      // If error, mark as not found but give default confidence
      results.push({
        keyword,
        foundInCommonCrawl: false,
        pageCount: 0,
        relatedKeywords: [],
        confidence: 0.3 // Default confidence since Gemini suggested it
      });
    }
  }
  
  console.log(`✅ Common Crawl: Validated ${results.length} keywords`);
  return results;
}

/**
 * Find related keywords from Common Crawl pages
 * 
 * Searches Common Crawl for pages similar to target domain
 * and extracts potential keywords from those pages
 * 
 * @param domain - Target domain
 * @param maxPages - Maximum pages to analyze
 */
export async function findRelatedKeywordsFromCommonCrawl(
  domain: string,
  maxPages: number = 10
): Promise<string[]> {
  const relatedKeywords: string[] = [];
  
  try {
    const crawlId = await getLatestCrawlId();
    if (!crawlId) {
      return [];
    }
    
    // Search for pages from similar domains (same TLD, similar structure)
    const domainParts = domain.split('.');
    const baseDomain = domainParts[0];
    const tld = domainParts.slice(1).join('.');
    
    // Search pattern: pages from similar domains
    const searchPattern = `*.${tld}/*`;
    
    const indexUrl = `https://index.commoncrawl.org/CC-MAIN-${crawlId}-index?url=${encodeURIComponent(searchPattern)}&output=json&limit=${maxPages}`;
    
    const response = await axios.get(indexUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SAO-Auditor/1.0)',
      },
      validateStatus: (status) => status < 500,
    });
    
    if (response.status === 200 && response.data) {
      const lines = response.data.toString().trim().split('\n').filter((line: string) => line.trim());
      
      for (const line of lines.slice(0, maxPages) as string[]) {
        try {
          const record = JSON.parse(line);
          if (record.url) {
            // Extract keywords from URL path
            const urlPath = new URL(record.url).pathname.toLowerCase();
            const keywords = urlPath
              .split(/[\/\-_]/)
              .filter(part => 
                part.length > 2 && 
                part.length < 20 &&
                !part.match(/^\d+$/) && // Not just numbers
                !part.match(/^(page|index|home|about|contact)$/i) // Not common page names
              )
              .slice(0, 3);
            
            relatedKeywords.push(...keywords);
          }
        } catch {
          continue;
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Common Crawl: Error finding related keywords:', error.message);
  }
  
  // Return unique keywords
  return [...new Set(relatedKeywords)].slice(0, 15);
}

/**
 * Get referring domains count
 */
export async function getReferringDomains(domain: string): Promise<number> {
    const backlinks = await getBacklinks(domain);
    const uniqueDomains = new Set<string>();
    
    for (const record of backlinks) {
        if (record.domain_from) {
            uniqueDomains.add(record.domain_from);
        }
    }
    
    return uniqueDomains.size;
}

/**
 * Get anchor text distribution
 */
export async function getAnchorText(domain: string): Promise<{ text: string; count: number }[]> {
    const backlinks = await getBacklinks(domain);
    const anchorMap = new Map<string, number>();
    
    for (const record of backlinks) {
        if (record.anchor && record.anchor.trim()) {
            const anchor = record.anchor.trim().toLowerCase();
            anchorMap.set(anchor, (anchorMap.get(anchor) || 0) + 1);
        }
    }
    
    // Convert to array and sort by count
    const anchorText = Array.from(anchorMap.entries())
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count);
    
    return anchorText;
}

/**
 * Get outbound links from target domain
 * Note: This requires fetching WARC files, which is more complex
 * For now, we'll return 0 and note this limitation
 */
export async function getOutboundLinks(domain: string): Promise<number> {
    // TODO: Implement outbound links analysis
    // This requires fetching and parsing WARC files, which is more resource-intensive
    // For MVP, we'll return 0 and note this limitation
    console.log(`⚠️ Common Crawl: Outbound links analysis not yet implemented for ${domain}`);
    return 0;
}

/**
 * Get comprehensive backlink metrics (compatible with AhrefsBacklinkMetrics)
 */
export async function getBacklinkMetrics(domain: string): Promise<CommonCrawlBacklinkMetrics> {
    try {
        const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        
        console.log(`🔗 Common Crawl: Fetching backlink metrics for ${cleanDomain}`);
        
        const [backlinks, referringDomains, anchorText] = await Promise.all([
            getBacklinks(cleanDomain),
            getReferringDomains(cleanDomain),
            getAnchorText(cleanDomain),
        ]);

        const result: CommonCrawlBacklinkMetrics = {
            backlinks: backlinks.length,
            referringDomains: referringDomains,
            domainRating: 0, // Not available from Common Crawl
            anchorText: anchorText.slice(0, 100), // Top 100 anchor texts
            outboundLinks: 0, // Not yet implemented
            error: 'Common Crawl Index API does not support reverse lookups. Use Moz API or AWS Athena for backlink discovery.'
        };

        if (result.backlinks === 0 && result.referringDomains === 0) {
            console.log(`⚠️ Common Crawl: No backlinks found (Index API limitation)`);
            console.log(`   → System will fall back to Moz API or estimates`);
        } else {
            console.log(`✅ Common Crawl: ${result.referringDomains} referring domains, ${result.backlinks} backlinks`);
        }
        
        return result;
    } catch (error: any) {
        console.error('❌ Common Crawl backlinks error:', error.message);
        return {
            backlinks: 0,
            referringDomains: 0,
            domainRating: 0,
            anchorText: [],
            outboundLinks: 0,
            error: error.message,
        };
    }
}

/**
 * Check if Common Crawl is available
 */
export function isCommonCrawlAvailable(): boolean {
    // Common Crawl is always available (it's a public service)
    return true;
}

/**
 * Clear cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
    cache.clear();
    console.log('🗑️ Common Crawl: Cache cleared');
}

