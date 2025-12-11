/**
 * Gemini API Integration Module
 * 
 * Used for:
 * - Brand Sentiment Analysis (Pillar 2)
 * - Community sentiment from Reddit, Pantip, forums, reviews
 * 
 * API Docs: https://ai.google.dev/docs
 */

import axios from 'axios';
import { ScrapingResult } from './scraper';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number; // 0-5 points
  confidence: number; // 0-1
  sources: {
    community: number; // Count of community mentions (Reddit, Pantip, forums)
    pr: number; // Count of PR/news mentions
    reviews: number; // Count of review mentions
  };
  sourceDetails: {
    communities: string[]; // List of specific communities checked (e.g., ["Reddit", "Pantip", "Thai forums"])
    reviewSites: string[]; // List of review sites checked
    newsSources: string[]; // List of news/PR sources checked
    totalSourcesChecked: number; // Total number of sources analyzed
    urlsAnalyzed: number; // Number of URLs/pages analyzed (from training data)
    pagesCrawled: number; // Number of pages crawled (same as urlsAnalyzed for clarity)
  };
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  error?: string;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 0;
}

/**
 * Analyze brand sentiment using Gemini API
 * 
 * Scoring logic:
 * - 2+ community positive = 5 pts
 * - 1 community pos + PR = 4 pts
 * - Neutral/Mixed = 2.5 pts
 * - PR only = 2 pts
 * - 1 community negative = 1 pt
 * - 2+ community negative = 0 pts (OVERRIDE)
 */
export async function analyzeBrandSentiment(
  brandName: string,
  domain?: string
): Promise<SentimentResult> {
  if (!isGeminiConfigured()) {
    console.log('⚠️ Gemini API not configured');
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      sources: { community: 0, pr: 0, reviews: 0 },
      sourceDetails: {
        communities: [],
        reviewSites: [],
        newsSources: [],
        totalSourcesChecked: 0,
        urlsAnalyzed: 0,
        pagesCrawled: 0
      },
      breakdown: { positive: 0, neutral: 0, negative: 0 },
      error: 'GEMINI_API_KEY not configured in .env'
    };
  }

  try {
    const cleanBrand = brandName.trim();
    const searchQuery = domain 
      ? `${cleanBrand} OR ${domain}`
      : cleanBrand;

    console.log(`🔍 Gemini: Analyzing sentiment for "${cleanBrand}"`);

    // Create prompt for sentiment analysis
    // Note: Gemini cannot perform real-time web searches, so we ask for general sentiment assessment
    const prompt = `Analyze the brand sentiment for "${cleanBrand}"${domain ? ` (domain: ${domain})` : ''} based on your training data and knowledge.

IMPORTANT: You cannot perform real-time web searches. Base your analysis on your training data up to your knowledge cutoff date.

Check the following sources in your training data:
1. Community Forums: Reddit (r/Thailand, relevant subreddits), Pantip.com, Thai forums, industry-specific forums
2. Review Sites: Google Reviews, Trustpilot, G2, Capterra, App Store reviews, Play Store reviews
3. News/PR Sources: News articles, press releases, industry publications, business news sites
4. Social Media: Twitter/X mentions, Facebook discussions (if in training data)

For each source type, provide:
- Which specific sources you checked (e.g., ["Reddit", "Pantip", "Google Reviews"])
- Count of mentions found in your training data
- Estimated number of URLs/pages you analyzed from your training data
- Sentiment breakdown

IMPORTANT: Estimate how many URLs/pages from your training data you analyzed to find these mentions. This helps users understand the scope of the analysis.

Return ONLY valid JSON (no markdown, no explanations):
{
  "sentiment": "positive|neutral|negative|mixed",
  "community_positive": <number>,
  "community_neutral": <number>,
  "community_negative": <number>,
  "pr_mentions": <number>,
  "review_mentions": <number>,
  "confidence": <0-1>,
  "communities_checked": ["Reddit", "Pantip", "Thai forums"],
  "review_sites_checked": ["Google Reviews", "Trustpilot"],
  "news_sources_checked": ["News articles", "Press releases"],
  "total_sources_checked": <number>,
  "urls_analyzed": <number>,
  "pages_crawled": <number>
}

If you have no knowledge about this brand, use confidence: 0.2, all counts as 0, empty arrays for sources, and 0 for URLs/pages.`;

    const response = await axios.post(
      `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('No content returned from Gemini API');
    }

    // Parse JSON from response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      let jsonText = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Extract JSON object (handle incomplete responses)
      const jsonMatch = jsonText.match(/\{[\s\S]*/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
        
        // Complete incomplete JSON with default values
        if (!jsonText.includes('"sentiment"')) {
          jsonText = '{"sentiment":"neutral"';
        }
        if (!jsonText.includes('"community_positive"')) {
          jsonText += ',"community_positive":0';
        }
        if (!jsonText.includes('"community_neutral"')) {
          jsonText += ',"community_neutral":0';
        }
        if (!jsonText.includes('"community_negative"')) {
          jsonText += ',"community_negative":0';
        }
        if (!jsonText.includes('"pr_mentions"')) {
          jsonText += ',"pr_mentions":0';
        }
        if (!jsonText.includes('"review_mentions"')) {
          jsonText += ',"review_mentions":0';
        }
        if (!jsonText.includes('"confidence"')) {
          jsonText += ',"confidence":0.3';
        }
        if (!jsonText.includes('"communities_checked"')) {
          jsonText += ',"communities_checked":[]';
        }
        if (!jsonText.includes('"review_sites_checked"')) {
          jsonText += ',"review_sites_checked":[]';
        }
        if (!jsonText.includes('"news_sources_checked"')) {
          jsonText += ',"news_sources_checked":[]';
        }
        if (!jsonText.includes('"total_sources_checked"')) {
          jsonText += ',"total_sources_checked":0';
        }
        if (!jsonText.includes('"urls_analyzed"')) {
          jsonText += ',"urls_analyzed":0';
        }
        if (!jsonText.includes('"pages_crawled"')) {
          jsonText += ',"pages_crawled":0';
        }
        
        // Close the JSON object
        if (!jsonText.endsWith('}')) {
          jsonText += '}';
        }
        
        parsedData = JSON.parse(jsonText);
      } else {
        // No JSON found, use defaults
        parsedData = {
          sentiment: 'neutral',
          community_positive: 0,
          community_neutral: 0,
          community_negative: 0,
          pr_mentions: 0,
          review_mentions: 0,
          confidence: 0.3,
          communities_checked: [],
          review_sites_checked: [],
          news_sources_checked: [],
          total_sources_checked: 0
        };
      }
    } catch (parseError) {
      console.error('❌ Gemini: Failed to parse JSON response:', content.substring(0, 200));
      // Return default values if parsing fails
      parsedData = {
        sentiment: 'neutral',
        community_positive: 0,
        community_neutral: 0,
        community_negative: 0,
        pr_mentions: 0,
        review_mentions: 0,
        confidence: 0.3,
        communities_checked: [],
        review_sites_checked: [],
        news_sources_checked: [],
        total_sources_checked: 0,
        urls_analyzed: 0,
        pages_crawled: 0
      };
    }

    const communityPositive = parsedData.community_positive || 0;
    const communityNeutral = parsedData.community_neutral || 0;
    const communityNegative = parsedData.community_negative || 0;
    const prMentions = parsedData.pr_mentions || 0;
    const reviewMentions = parsedData.review_mentions || 0;
    const confidence = Math.min(1, Math.max(0, parsedData.confidence || 0));
    const sentiment = parsedData.sentiment?.toLowerCase() || 'neutral';
    
    // Extract source details
    const communitiesChecked = Array.isArray(parsedData.communities_checked) 
      ? parsedData.communities_checked 
      : (parsedData.communities_checked ? [parsedData.communities_checked] : []);
    const reviewSitesChecked = Array.isArray(parsedData.review_sites_checked)
      ? parsedData.review_sites_checked
      : (parsedData.review_sites_checked ? [parsedData.review_sites_checked] : []);
    const newsSourcesChecked = Array.isArray(parsedData.news_sources_checked)
      ? parsedData.news_sources_checked
      : (parsedData.news_sources_checked ? [parsedData.news_sources_checked] : []);
    const totalSourcesChecked = parsedData.total_sources_checked || 
      (communitiesChecked.length + reviewSitesChecked.length + newsSourcesChecked.length);
    const urlsAnalyzed = parsedData.urls_analyzed || parsedData.pages_crawled || 0;
    const pagesCrawled = parsedData.pages_crawled || parsedData.urls_analyzed || 0;

    // Calculate score based on logic
    let score = 0;
    if (communityNegative >= 2) {
      score = 0; // OVERRIDE: 2+ negative = 0 pts
    } else if (communityPositive >= 2) {
      score = 5; // 2+ community positive = 5 pts
    } else if (communityPositive >= 1 && prMentions > 0) {
      score = 4; // 1 community pos + PR = 4 pts
    } else if (prMentions > 0 && communityPositive === 0 && communityNegative === 0) {
      score = 2; // PR only = 2 pts
    } else if (communityNegative === 1) {
      score = 1; // 1 community negative = 1 pt
    } else {
      score = 2.5; // Neutral/Mixed = 2.5 pts
    }

    const result: SentimentResult = {
      sentiment: sentiment as 'positive' | 'neutral' | 'negative' | 'mixed',
      score: Math.round(score * 10) / 10, // Round to 1 decimal
      confidence,
      sources: {
        community: communityPositive + communityNeutral + communityNegative,
        pr: prMentions,
        reviews: reviewMentions,
      },
      sourceDetails: {
        communities: communitiesChecked.length > 0 
          ? communitiesChecked 
          : (communityPositive + communityNeutral + communityNegative > 0 
              ? ['Reddit', 'Pantip', 'Thai forums'] 
              : []),
        reviewSites: reviewSitesChecked.length > 0
          ? reviewSitesChecked
          : (reviewMentions > 0 
              ? ['Google Reviews', 'Trustpilot'] 
              : []),
        newsSources: newsSourcesChecked.length > 0
          ? newsSourcesChecked
          : (prMentions > 0
              ? ['News articles', 'Press releases']
              : []),
        totalSourcesChecked: totalSourcesChecked > 0
          ? totalSourcesChecked
          : (communitiesChecked.length + reviewSitesChecked.length + newsSourcesChecked.length),
        urlsAnalyzed: urlsAnalyzed,
        pagesCrawled: pagesCrawled
      },
      breakdown: {
        positive: communityPositive,
        neutral: communityNeutral,
        negative: communityNegative,
      }
    };

    console.log(`✅ Gemini: Sentiment analysis complete - ${result.sentiment} (${result.score}/5 pts, confidence: ${(confidence * 100).toFixed(0)}%)`);
    return result;

  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Gemini API error:', errorMsg);
    
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      sources: { community: 0, pr: 0, reviews: 0 },
      sourceDetails: {
        communities: [],
        reviewSites: [],
        newsSources: [],
        totalSourcesChecked: 0,
        urlsAnalyzed: 0,
        pagesCrawled: 0
      },
      breakdown: { positive: 0, neutral: 0, negative: 0 },
      error: errorMsg.includes('API_KEY') 
        ? 'Gemini API authentication failed. Check your GEMINI_API_KEY.'
        : errorMsg
    };
  }
}

/**
 * Extract potential keywords from page content using Gemini
 * 
 * @param scrapingResult - Scraped content from the page
 * @param brandName - Brand name to identify branded keywords
 * @returns Array of keywords with their intent
 */
export async function extractKeywordsWithGemini(
  scrapingResult: ScrapingResult,
  brandName: string
): Promise<{ keyword: string; intent: string }[]> {
  if (!isGeminiConfigured()) {
    console.log('⚠️ Gemini API not configured - cannot extract keywords');
    return [];
  }

  try {
    const prompt = `คุณเป็น SEO Expert ที่เชี่ยวชาญการวิเคราะห์ keywords
วิเคราะห์ content ด้านล่างและแนะนำ keywords ที่หน้านี้น่าจะติดอันดับบน Google Thailand

## Content Information:

- URL: ${scrapingResult.url}
- Title: ${scrapingResult.title || 'N/A'}
- Meta Description: ${scrapingResult.metaDescription || 'N/A'}
- H1: ${scrapingResult.h1.join(', ') || 'N/A'}
- H2s: ${scrapingResult.h2.slice(0, 10).join(', ') || 'N/A'}
- Word Count: ${scrapingResult.wordCount}
- Brand Name: ${brandName}

## Instructions:

1. วิเคราะห์ content และหา keywords ที่เกี่ยวข้อง 15-20 keywords
2. **สำคัญมาก**: ต้องเดา keywords จาก:
   - H1 tag (ใช้เป็น primary keyword)
   - คำที่ซ้ำๆ ใน content (redundant keywords)
   - Title และ Meta Description
   - ไม่ใช่แค่ชื่อ domain/แบรนด์เท่านั้น
3. แยกเป็น branded keywords (มีชื่อแบรนด์) และ non-branded keywords
4. ระบุ search intent ของแต่ละ keyword:
   - **Informational**: As one of the most common search intents, informational intent refers to users looking for information. They typically need an answer to a specific question, want to learn how to solve a problem, or do in-depth research on a particular topic. Examples: "what is", "how to", "why", "วิธี", "คืออะไร", "ทำไม"
   - **Commercial Investigation**: Some searchers may have the intention of buying a specific product or service - but haven't made their final purchase decision yet. They're looking to learn more and compare different products. Examples: "เปรียบเทียบ", "รีวิว", "ที่ไหนดี", "review", "compare", "best"
   - **Transactional**: Users will search with transactional intent when they're ready to complete a specific action - more often than not, make a purchase. Examples: "ซื้อ", "สมัคร", "ราคา", "buy", "price", "order"
   - **Navigational**: The second type of search intent involves users looking to visit a specific website - but are either unsure about the exact URL or find it easier to do a quick Google search. Examples: brand name searches, "website name login", "แบรนด์ login"
5. เน้น keywords ที่:
   - เป็นภาษาไทย (Thai keywords สำคัญมาก)
   - มี search volume น่าจะสูง
   - เกี่ยวข้องกับ content โดยตรง (โดยเฉพาะจาก H1)
   - ทั้ง short-tail และ long-tail
   - ตัวอย่าง: ถ้า H1 คือ "Krungsri The Coach" ให้เดา "krungsri the coach", "กรุงศรี the coach", "กรุงศรี เดอะโค้ช"

## Output Format (JSON only, no markdown):

{
  "brandedKeywords": [
    { "keyword": "msig ประกันรถยนต์", "intent": "navigational" },
    { "keyword": "msig ราคา", "intent": "transactional" }
  ],
  "nonBrandedKeywords": [
    { "keyword": "ประกันรถยนต์ชั้น 1", "intent": "commercial" },
    { "keyword": "ประกันภัยรถยนต์ ที่ไหนดี", "intent": "commercial" },
    { "keyword": "ประกันรถยนต์ ราคาถูก", "intent": "transactional" }
  ]
}

ตอบเป็น JSON เท่านั้น ไม่ต้องมี explanation หรือ markdown code blocks`;

    const response = await axios.post(
      `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('No content returned from Gemini API');
    }

    // Extract JSON from response
    let jsonText = content.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Try to fix common JSON issues
    // Remove trailing commas
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('❌ Gemini: JSON parse error:', parseError.message);
      console.error('   Raw response (first 500 chars):', jsonText.substring(0, 500));
      
      // Try to extract keywords manually from text
      const keywordMatches = jsonText.match(/"keyword"\s*:\s*"([^"]+)"/gi);
      const intentMatches = jsonText.match(/"intent"\s*:\s*"([^"]+)"/gi);
      
      if (keywordMatches && keywordMatches.length > 0) {
        const keywords: string[] = [];
        const intents: string[] = [];
        
        keywordMatches.forEach((match: string) => {
          const kw = match.match(/"keyword"\s*:\s*"([^"]+)"/i)?.[1];
          if (kw) keywords.push(kw);
        });
        
        intentMatches?.forEach((match: string) => {
          const intent = match.match(/"intent"\s*:\s*"([^"]+)"/i)?.[1];
          if (intent) intents.push(intent);
        });
        
        // Create manual structure
        parsedData = {
          brandedKeywords: [],
          nonBrandedKeywords: keywords.map((kw, i) => ({
            keyword: kw,
            intent: intents[i] || 'informational'
          }))
        };
      } else {
        // Return empty if can't parse
        return [];
      }
    }

    // Combine branded and non-branded keywords
    const allKeywords: { keyword: string; intent: string }[] = [];
    
    if (parsedData.brandedKeywords && Array.isArray(parsedData.brandedKeywords)) {
      parsedData.brandedKeywords.forEach((item: any) => {
        if (item.keyword && item.intent) {
          allKeywords.push({
            keyword: item.keyword.trim(),
            intent: item.intent.toLowerCase()
          });
        }
      });
    }
    
    if (parsedData.nonBrandedKeywords && Array.isArray(parsedData.nonBrandedKeywords)) {
      parsedData.nonBrandedKeywords.forEach((item: any) => {
        if (item.keyword && item.intent) {
          allKeywords.push({
            keyword: item.keyword.trim(),
            intent: item.intent.toLowerCase()
          });
        }
      });
    }

    console.log(`✅ Gemini: Extracted ${allKeywords.length} keywords from content`);
    return allKeywords;

  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Gemini keyword extraction error:', errorMsg);
    return [];
  }
}

/**
 * Get empty sentiment result (for fallback)
 */
export function getEmptySentimentResult(error?: string): SentimentResult {
  return {
    sentiment: 'neutral',
    score: 0,
    confidence: 0,
    sources: { community: 0, pr: 0, reviews: 0 },
    sourceDetails: {
      communities: [],
      reviewSites: [],
      newsSources: [],
      totalSourcesChecked: 0,
      urlsAnalyzed: 0,
      pagesCrawled: 0
    },
    breakdown: { positive: 0, neutral: 0, negative: 0 },
    error: error || 'Sentiment analysis not available'
  };
}

