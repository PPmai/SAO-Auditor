/**
 * Google Custom Search API Integration Module
 * 
 * Replaces:
 * - Ahrefs/Semrush brand tracking → Brand Search Position
 * - Rank tracker tools → Competitor Position Check
 * - Ahrefs position checker → Specific Keyword Position
 * - SERP preview tools → SERP Snippet Preview
 * - Competitor finder → Top 10 Competitors
 * 
 * API Docs: https://developers.google.com/custom-search/v1/overview
 * 
 * Setup:
 * 1. Go to https://programmablesearchengine.google.com/
 * 2. Create a Custom Search Engine
 * 3. Get your Search Engine ID (CX)
 * 4. Get API Key from https://console.cloud.google.com/apis/credentials
 * 5. Add to .env: GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID
 */

import axios from 'axios';

const GOOGLE_CUSTOM_SEARCH_API_BASE = 'https://www.googleapis.com/customsearch/v1';
const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
const GOOGLE_CUSTOM_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || '';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  position: number; // 1-based position in SERP
}

export interface BrandSearchResult {
  position: number; // 0 if not found in top 10
  url?: string;
  title?: string;
  snippet?: string;
  found: boolean;
  error?: string;
}

export interface KeywordPositionResult {
  keyword: string;
  position: number; // 0 if not found in top 10
  url?: string;
  title?: string;
  snippet?: string;
  found: boolean;
  error?: string;
}

export interface CompetitorPositionResult {
  competitorDomain: string;
  position: number; // 0 if not found in top 10
  url?: string;
  title?: string;
  snippet?: string;
  found: boolean;
  error?: string;
}

export interface SERPSnippet {
  title: string;
  description: string;
  url: string;
  position: number;
}

export interface TopCompetitorsResult {
  keyword: string;
  competitors: Array<{
    domain: string;
    position: number;
    title: string;
    snippet: string;
    url: string;
  }>;
  totalResults: number;
  error?: string;
}

/**
 * Check if Google Custom Search API is configured
 */
export function isGoogleCustomSearchConfigured(): boolean {
  return !!GOOGLE_CUSTOM_SEARCH_API_KEY && 
         !!GOOGLE_CUSTOM_SEARCH_ENGINE_ID &&
         GOOGLE_CUSTOM_SEARCH_API_KEY.length > 0 &&
         GOOGLE_CUSTOM_SEARCH_ENGINE_ID.length > 0;
}

/**
 * Perform a Google Custom Search
 */
async function performSearch(
  query: string,
  options: {
    num?: number; // Number of results (max 10)
    start?: number; // Start index (for pagination)
    siteSearch?: string; // Restrict to specific site
    gl?: string; // Geolocation (country code)
    hl?: string; // Interface language
  } = {}
): Promise<{ items: SearchResult[]; totalResults?: string; error?: string }> {
  if (!isGoogleCustomSearchConfigured()) {
    return {
      items: [],
      error: 'GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID not configured in .env'
    };
  }

  try {
    const params: any = {
      key: GOOGLE_CUSTOM_SEARCH_API_KEY,
      cx: GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
      q: query,
      num: options.num || 10, // Default 10 results
    };

    if (options.start) {
      params.start = options.start;
    }

    if (options.siteSearch) {
      params.siteSearch = options.siteSearch;
    }

    if (options.gl) {
      params.gl = options.gl;
    }

    if (options.hl) {
      params.hl = options.hl;
    }

    const response = await axios.get(GOOGLE_CUSTOM_SEARCH_API_BASE, {
      params,
      timeout: 30000,
    });

    const items: SearchResult[] = (response.data.items || []).map((item: any, index: number) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
      displayLink: item.displayLink || '',
      position: (options.start || 1) + index, // 1-based position
    }));

    return {
      items,
      totalResults: response.data.searchInformation?.totalResults,
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Google Custom Search API error:', errorMsg);
    return {
      items: [],
      error: errorMsg.includes('API_KEY') || errorMsg.includes('key')
        ? 'Google Custom Search API authentication failed. Check your API key and Search Engine ID.'
        : errorMsg
    };
  }
}

/**
 * Feature 1: Brand Search Position
 * Query [brand name] → find domain position
 * Replaces: Ahrefs/Semrush brand tracking
 * Pillar: Brand Ranking (5 pts)
 */
export async function getBrandSearchPosition(
  brandName: string,
  domain: string
): Promise<BrandSearchResult> {
  if (!isGoogleCustomSearchConfigured()) {
    return {
      position: 0,
      found: false,
      error: 'Google Custom Search API not configured'
    };
  }

  try {
    console.log(`🔍 Google Custom Search: Checking brand position for "${brandName}"`);
    
    // Search for brand name
    const searchResult = await performSearch(brandName, { num: 10 });
    
    if (searchResult.error) {
      return {
        position: 0,
        found: false,
        error: searchResult.error
      };
    }

    // Find domain in results
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    for (const item of searchResult.items) {
      const itemDomain = new URL(item.link).hostname.replace('www.', '');
      if (itemDomain === cleanDomain || itemDomain.includes(cleanDomain) || cleanDomain.includes(itemDomain)) {
        console.log(`✅ Brand "${brandName}" found at position ${item.position}`);
        return {
          position: item.position,
          url: item.link,
          title: item.title,
          snippet: item.snippet,
          found: true,
        };
      }
    }

    console.log(`⚠️ Brand "${brandName}" not found in top 10 results`);
    return {
      position: 0,
      found: false,
    };
  } catch (error: any) {
    console.error('❌ Brand search position error:', error.message);
    return {
      position: 0,
      found: false,
      error: error.message
    };
  }
}

/**
 * Feature 2: Competitor Position Check
 * Query [competitor brand] → compare positions
 * Replaces: Rank tracker tools
 * Pillar: Brand Ranking
 */
export async function getCompetitorPosition(
  competitorBrand: string,
  competitorDomain: string
): Promise<CompetitorPositionResult> {
  if (!isGoogleCustomSearchConfigured()) {
    return {
      competitorDomain,
      position: 0,
      found: false,
      error: 'Google Custom Search API not configured'
    };
  }

  try {
    console.log(`🔍 Google Custom Search: Checking competitor position for "${competitorBrand}"`);
    
    const searchResult = await performSearch(competitorBrand, { num: 10 });
    
    if (searchResult.error) {
      return {
        competitorDomain,
        position: 0,
        found: false,
        error: searchResult.error
      };
    }

    const cleanDomain = competitorDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    for (const item of searchResult.items) {
      const itemDomain = new URL(item.link).hostname.replace('www.', '');
      if (itemDomain === cleanDomain || itemDomain.includes(cleanDomain) || cleanDomain.includes(itemDomain)) {
        console.log(`✅ Competitor "${competitorBrand}" found at position ${item.position}`);
        return {
          competitorDomain,
          position: item.position,
          url: item.link,
          title: item.title,
          snippet: item.snippet,
          found: true,
        };
      }
    }

    return {
      competitorDomain,
      position: 0,
      found: false,
    };
  } catch (error: any) {
    console.error('❌ Competitor position check error:', error.message);
    return {
      competitorDomain,
      position: 0,
      found: false,
      error: error.message
    };
  }
}

/**
 * Feature 3: Specific Keyword Position
 * Query [keyword] → find if domain ranks
 * Replaces: Ahrefs position checker
 * Pillar: Keyword Visibility
 */
export async function getKeywordPosition(
  keyword: string,
  domain: string
): Promise<KeywordPositionResult> {
  if (!isGoogleCustomSearchConfigured()) {
    return {
      keyword,
      position: 0,
      found: false,
      error: 'Google Custom Search API not configured'
    };
  }

  try {
    console.log(`🔍 Google Custom Search: Checking keyword position for "${keyword}"`);
    
    const searchResult = await performSearch(keyword, { num: 10 });
    
    if (searchResult.error) {
      return {
        keyword,
        position: 0,
        found: false,
        error: searchResult.error
      };
    }

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    for (const item of searchResult.items) {
      const itemDomain = new URL(item.link).hostname.replace('www.', '');
      if (itemDomain === cleanDomain || itemDomain.includes(cleanDomain) || cleanDomain.includes(itemDomain)) {
        console.log(`✅ Keyword "${keyword}" found at position ${item.position}`);
        return {
          keyword,
          position: item.position,
          url: item.link,
          title: item.title,
          snippet: item.snippet,
          found: true,
        };
      }
    }

    return {
      keyword,
      position: 0,
      found: false,
    };
  } catch (error: any) {
    console.error('❌ Keyword position check error:', error.message);
    return {
      keyword,
      position: 0,
      found: false,
      error: error.message
    };
  }
}

/**
 * Feature 4: SERP Snippet Preview
 * Get title + description shown in Google
 * Replaces: SERP preview tools
 * Pillar: Content
 */
export async function getSERPSnippet(
  keyword: string,
  domain: string
): Promise<SERPSnippet | null> {
  if (!isGoogleCustomSearchConfigured()) {
    return null;
  }

  try {
    const keywordResult = await getKeywordPosition(keyword, domain);
    
    if (keywordResult.found && keywordResult.title && keywordResult.snippet) {
      return {
        title: keywordResult.title,
        description: keywordResult.snippet,
        url: keywordResult.url || '',
        position: keywordResult.position,
      };
    }

    return null;
  } catch (error: any) {
    console.error('❌ SERP snippet error:', error.message);
    return null;
  }
}

/**
 * Feature 5: Top 10 Competitors
 * See who ranks for target keywords
 * Replaces: Competitor finder
 * Pillar: Analysis
 */
export async function getTopCompetitors(
  keyword: string,
  excludeDomain?: string
): Promise<TopCompetitorsResult> {
  if (!isGoogleCustomSearchConfigured()) {
    return {
      keyword,
      competitors: [],
      totalResults: 0,
      error: 'Google Custom Search API not configured'
    };
  }

  try {
    console.log(`🔍 Google Custom Search: Finding top competitors for "${keyword}"`);
    
    const searchResult = await performSearch(keyword, { num: 10 });
    
    if (searchResult.error) {
      return {
        keyword,
        competitors: [],
        totalResults: 0,
        error: searchResult.error
      };
    }

    const excludeDomainClean = excludeDomain 
      ? excludeDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
      : '';

    const competitors = searchResult.items
      .filter(item => {
        if (!excludeDomainClean) return true;
        const itemDomain = new URL(item.link).hostname.replace('www.', '');
        return itemDomain !== excludeDomainClean && 
               !itemDomain.includes(excludeDomainClean) && 
               !excludeDomainClean.includes(itemDomain);
      })
      .map(item => ({
        domain: new URL(item.link).hostname.replace('www.', ''),
        position: item.position,
        title: item.title,
        snippet: item.snippet,
        url: item.link,
      }));

    console.log(`✅ Found ${competitors.length} competitors for "${keyword}"`);
    
    return {
      keyword,
      competitors,
      totalResults: parseInt(searchResult.totalResults || '0', 10),
    };
  } catch (error: any) {
    console.error('❌ Top competitors error:', error.message);
    return {
      keyword,
      competitors: [],
      totalResults: 0,
      error: error.message
    };
  }
}

export interface KeywordRankingResult {
  keyword: string;
  position: number | null;  // null = not found in top 100
  top10Results: string[];   // URLs of top 10 results
  foundUrl: string | null;  // URL of our domain if found
}

/**
 * Check ranking for a single keyword
 * Searches up to top 100 results (10 pages)
 */
export async function checkKeywordRanking(
  keyword: string,
  targetDomain: string,
  country: string = 'th',
  maxPages: number = 10  // 10 pages = 100 results
): Promise<KeywordRankingResult> {
  if (!isGoogleCustomSearchConfigured()) {
    return {
      keyword,
      position: null,
      top10Results: [],
      foundUrl: null
    };
  }

  let position: number | null = null;
  let foundUrl: string | null = null;
  const top10Results: string[] = [];
  
  const cleanDomain = targetDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  // Search up to 100 results (10 results per page)
  for (let page = 0; page < maxPages; page++) {
    const start = page * 10 + 1;
    
    try {
      const searchResult = await performSearch(keyword, {
        num: 10,
        start,
        gl: country,  // Geolocation
        hl: country === 'th' ? 'th' : 'en'  // Interface language
      });
      
      if (searchResult.error || searchResult.items.length === 0) {
        break;
      }
      
      // Collect top 10 for first page
      if (page === 0) {
        top10Results.push(...searchResult.items.map(item => item.link));
      }
      
      // Check if target domain is in results
      for (let i = 0; i < searchResult.items.length; i++) {
        const item = searchResult.items[i];
        const itemUrl = item.link;
        try {
          const itemDomain = new URL(itemUrl).hostname.replace('www.', '');
          
          if (itemDomain === cleanDomain || 
              itemDomain.includes(cleanDomain) || 
              cleanDomain.includes(itemDomain)) {
            position = start + i; // start is 1-based, i is 0-based, so start+i gives correct position
            foundUrl = itemUrl;
            break;
          }
        } catch {
          // Invalid URL, skip
          continue;
        }
      }
      
      if (position !== null) break;  // Found, stop searching
      
      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: any) {
      console.error(`❌ Error checking keyword "${keyword}":`, error.message);
      break;
    }
  }
  
  if (position !== null) {
    console.log(`✅ Keyword "${keyword}" found at position ${position}`);
  }
  
  return { keyword, position, top10Results, foundUrl };
}

/**
 * Batch check multiple keywords with rate limiting
 */
export async function batchCheckKeywordRankings(
  keywords: string[],
  targetDomain: string,
  country: string = 'th',
  options?: {
    maxKeywords?: number;      // Limit keywords to check (API quota)
    checkTop100?: boolean;     // Check all 100 results or just top 10
    delayBetweenKeywords?: number;  // ms delay between keywords
  }
): Promise<KeywordRankingResult[]> {
  const {
    maxKeywords = 20,
    checkTop100 = false,
    delayBetweenKeywords = 200
  } = options || {};
  
  // Limit keywords to avoid API quota issues
  const keywordsToCheck = keywords.slice(0, maxKeywords);
  const results: KeywordRankingResult[] = [];
  
  console.log(`🔍 Checking rankings for ${keywordsToCheck.length} keywords...`);
  
  for (const keyword of keywordsToCheck) {
    const result = await checkKeywordRanking(
      keyword,
      targetDomain,
      country,
      checkTop100 ? 10 : 1  // 10 pages for top 100, 1 page for top 10
    );
    results.push(result);
    
    // Rate limiting
    if (keywordsToCheck.indexOf(keyword) < keywordsToCheck.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenKeywords));
    }
  }
  
  console.log(`✅ Completed ranking check for ${results.length} keywords`);
  return results;
}

