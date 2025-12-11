import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';

export interface ScrapingResult {
  url: string;
  title?: string;
  metaDescription?: string;
  h1: string[];
  h2: string[];
  h3: string[];
  hasSchema: boolean;
  schemaTypes: string[];
  tableCount: number;
  listCount: number;
  imageCount: number;
  imagesWithAlt: number;
  videoCount: number;
  internalLinks: number;
  externalLinks: number;
  hasSSL: boolean;
  hasRobotsTxt: boolean;
  hasLlmsTxt: boolean;    // NEW: /llms.txt detection
  sitemapValid: boolean;  // NEW: sitemap.xml validation
  wordCount: number;
  error?: string;
}

export async function scrapeWebsite(url: string): Promise<ScrapingResult> {
  try {
    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Check SSL
    const hasSSL = normalizedUrl.startsWith('https://');

    // Fetch HTML
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HAS-Auditor/1.0; +http://example.com/bot)'
      },
      timeout: 10000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // For MVP, accept self-signed certs
      })
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text() || $('meta[property="og:title"]').attr('content');

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content');

    // Extract headings - filter out hidden elements and those in excluded sections
    const h1 = $('h1')
      .filter((_, el) => {
        const $el = $(el);
        // Exclude hidden elements
        if ($el.css('display') === 'none' || 
            $el.css('visibility') === 'hidden' || 
            $el.attr('hidden') !== undefined ||
            $el.hasClass('sr-only') ||
            $el.hasClass('visually-hidden')) {
          return false;
        }
        // Exclude headings in navigation, footer, modal, or other excluded sections
        const parent = $el.closest('nav, footer, header, [role="navigation"], [role="banner"], .modal, .popup, [aria-hidden="true"]');
        if (parent.length > 0) {
          return false;
        }
        // Exclude empty headings
        const text = $el.text().trim();
        if (!text || text.length === 0) {
          return false;
        }
        return true;
      })
      .map((_, el) => $(el).text().trim())
      .get();
    
    const h2 = $('h2')
      .filter((_, el) => {
        const $el = $(el);
        // Exclude hidden elements
        if ($el.css('display') === 'none' || 
            $el.css('visibility') === 'hidden' || 
            $el.attr('hidden') !== undefined ||
            $el.hasClass('sr-only') ||
            $el.hasClass('visually-hidden')) {
          return false;
        }
        // Exclude headings in navigation, footer, modal, or other excluded sections
        const parent = $el.closest('nav, footer, header, [role="navigation"], [role="banner"], .modal, .popup, [aria-hidden="true"]');
        if (parent.length > 0) {
          return false;
        }
        // Exclude empty headings
        const text = $el.text().trim();
        if (!text || text.length === 0) {
          return false;
        }
        return true;
      })
      .map((_, el) => $(el).text().trim())
      .get();
    
    const h3 = $('h3')
      .filter((_, el) => {
        const $el = $(el);
        // Exclude hidden elements
        if ($el.css('display') === 'none' || 
            $el.css('visibility') === 'hidden' || 
            $el.attr('hidden') !== undefined ||
            $el.hasClass('sr-only') ||
            $el.hasClass('visually-hidden')) {
          return false;
        }
        // Exclude headings in navigation, footer, modal, or other excluded sections
        const parent = $el.closest('nav, footer, header, [role="navigation"], [role="banner"], .modal, .popup, [aria-hidden="true"]');
        if (parent.length > 0) {
          return false;
        }
        // Exclude empty headings
        const text = $el.text().trim();
        if (!text || text.length === 0) {
          return false;
        }
        return true;
      })
      .map((_, el) => $(el).text().trim())
      .get();

    // Check for Schema.org JSON-LD
    const schemaScripts = $('script[type="application/ld+json"]').toArray();
    const schemaTypes: string[] = [];
    let hasSchema = false;

    schemaScripts.forEach(script => {
      try {
        const schemaData = JSON.parse($(script).html() || '{}');
        if (schemaData['@type']) {
          schemaTypes.push(schemaData['@type']);
          hasSchema = true;
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    // Count tables and lists
    const tableCount = $('table').length;
    const listCount = $('ul, ol').length;

    // Count images
    const imageCount = $('img').length;
    const imagesWithAlt = $('img[alt]').length;

    // Count videos - including YouTube embeds (youtube.com, youtu.be, youtube-nocookie.com)
    const videoCount = $('video').length + 
      $('iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie"]').length +
      $('iframe[src*="vimeo"]').length;

    // Count links
    const domain = new URL(normalizedUrl).hostname;
    let internalLinks = 0;
    let externalLinks = 0;

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('/') || href.includes(domain)) {
        internalLinks++;
      } else if (href.startsWith('http')) {
        externalLinks++;
      }
    });

    // Word count (rough estimate)
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(' ').length;

    // Check robots.txt
    let hasRobotsTxt = false;
    try {
      const robotsUrl = new URL(normalizedUrl).origin + '/robots.txt';
      const robotsResponse = await axios.get(robotsUrl, { timeout: 5000 });
      hasRobotsTxt = robotsResponse.status === 200;
    } catch (e) {
      hasRobotsTxt = false;
    }

    // Check llms.txt
    let hasLlmsTxt = false;
    try {
      const origin = new URL(normalizedUrl).origin;
      for (const path of ['/llms.txt', '/llms-full.txt']) {
        const resp = await axios.head(origin + path, { timeout: 3000 });
        if (resp.status === 200) { hasLlmsTxt = true; break; }
      }
    } catch (e) { hasLlmsTxt = false; }

    // Check sitemap*.xml validity - Check all sitemap files (sitemap.xml, sitemap_index.xml, etc.)
    let sitemapValid = false;
    try {
      const origin = new URL(normalizedUrl).origin;
      // Try common sitemap file names
      const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'];
      
      for (const path of sitemapPaths) {
        try {
          const sitemapUrl = origin + path;
          const sitemapResp = await axios.get(sitemapUrl, { timeout: 5000 });
          if (sitemapResp.status === 200) {
            const xml = sitemapResp.data;
            // Basic validation: must have urlset/sitemapindex and loc
            const hasUrlset = xml.includes('<urlset') || xml.includes('<sitemapindex');
            const hasLoc = xml.includes('<loc>');
            if (hasUrlset && hasLoc) {
              sitemapValid = true;
              break; // Found valid sitemap, stop searching
            }
          }
        } catch (e) {
          // Continue to next sitemap path
          continue;
        }
      }
    } catch (e) { sitemapValid = false; }

    return {
      url: normalizedUrl,
      title,
      metaDescription,
      h1,
      h2,
      h3,
      hasSchema,
      schemaTypes,
      tableCount,
      listCount,
      imageCount,
      imagesWithAlt,
      videoCount,
      internalLinks,
      externalLinks,
      hasSSL,
      hasRobotsTxt,
      hasLlmsTxt,
      sitemapValid,
      wordCount
    };
  } catch (error: any) {
    return {
      url,
      h1: [],
      h2: [],
      h3: [],
      hasSchema: false,
      schemaTypes: [],
      tableCount: 0,
      listCount: 0,
      imageCount: 0,
      imagesWithAlt: 0,
      videoCount: 0,
      internalLinks: 0,
      externalLinks: 0,
      hasSSL: false,
      hasRobotsTxt: false,
      hasLlmsTxt: false,
      sitemapValid: false,
      wordCount: 0,
      error: error.message
    };
  }
}

