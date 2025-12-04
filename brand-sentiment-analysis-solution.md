# Brand Sentiment Analysis Solution

## Using Gemini Deep Research (Free Tier)

---

## 1. Overview

### Purpose
Measure public sentiment about a brand by analyzing online discussions, reviews, and news, with priority given to authentic community sources over PR/marketing content.

### Core Principle
```
Community voices (Reddit, Pantip) > PR/Marketing content

Real people's opinions are more trustworthy than brand-controlled messaging.
```

### Scoring
- **Metric Name:** Brand Sentiment Score
- **Max Points:** 5 points
- **Weight in overall audit:** Configurable based on pillar structure

---

## 2. Source Trust Hierarchy

Sources are weighted based on authenticity and trustworthiness:

| Source Type | Weight | Examples | Rationale |
|-------------|--------|----------|-----------|
| **Community (UGC)** | 3x | Reddit, Pantip, Facebook Groups, Twitter/X | Real users, unfiltered opinions |
| **Review Platforms** | 2x | Wongnai, TripAdvisor, Google Reviews | Verified customers, structured feedback |
| **News/Media** | 1x | News websites, independent blogs | Editorial review, but may have bias |
| **PR/Owned Media** | 0.5x | Press releases, company blogs, advertorials | Brand-controlled, promotional intent |

### Thai Market Specific Sources

| Platform | Type | Weight | Notes |
|----------|------|--------|-------|
| pantip.com | Community | 3x | Largest Thai online forum |
| reddit.com/r/thailand | Community | 3x | Expat and local discussions |
| wongnai.com | Review | 2x | Restaurant/service reviews |
| twitter.com / x.com | Community | 3x | Real-time opinions |
| facebook.com/groups | Community | 3x | Community discussions |
| thairath.co.th | News | 1x | Major Thai news |
| prnewswire.com | PR | 0.5x | Press releases |

---

## 3. Scoring Logic

### Scoring Table

| Scenario | Score | Condition |
|----------|-------|-----------|
| Community Positive (2+ sources) | **5 pts** | ≥2 positive mentions in Reddit/Pantip/Reviews |
| Community Positive (1) + PR Positive | **4 pts** | 1 community positive + PR support |
| Neutral / Mixed | **2.5 pts** | No clear sentiment direction |
| PR Positive Only (no community) | **2 pts** | Only PR/news positive, no community data |
| Community Negative (1 source) | **1 pt** | 1 negative community mention |
| Community Negative (2+ sources) | **0 pts** | ≥2 negative mentions in Reddit/Pantip |

### Critical Override Rule

```
IF community_negative_count >= 2:
    final_score = 0
    IGNORE all positive PR/news sources
```

**Rationale:** Multiple negative community mentions indicate real problems that PR cannot mask.

---

## 4. Technical Solution: Gemini Deep Research

### Why Gemini Deep Research?

| Benefit | Description |
|---------|-------------|
| **Free** | 1,500 requests/day on free tier |
| **All-in-one** | Search + Fetch + Analyze in single API call |
| **No scraping needed** | Gemini handles web access |
| **Multilingual** | Handles Thai content natively |
| **Grounded search** | Uses Google Search for real-time data |

### Free Tier Limits

| Plan | Requests/Day | Requests/Min | Cost |
|------|--------------|--------------|------|
| Free | 1,500 | 15 | $0 |
| Pro | Unlimited | 1,000 | $20/mo |

**Capacity:** 1,500 requests/day = ~50 brand audits/day (sufficient for SMB clients)

---

## 5. Implementation

### Gemini API Setup

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  tools: [{ googleSearch: {} }]  // Enable web search
});
```

### Prompt Template

```
Research brand sentiment for "${brandName}" in Thailand.

SEARCH PRIORITY (in order):
1. Reddit (reddit.com/r/thailand, reddit.com/r/bangkok)
2. Pantip (pantip.com)
3. Wongnai (wongnai.com)
4. Twitter/X
5. Google Reviews
6. News articles

FOR EACH SOURCE FOUND, EXTRACT:
- Source URL
- Platform name (reddit/pantip/wongnai/twitter/news/pr)
- Source type: "community" | "review" | "news" | "pr"
- Weight: community=3, review=2, news=1, pr=0.5
- Sentiment: "positive" | "neutral" | "negative"
- Sentiment score: number from -1.0 (very negative) to +1.0 (very positive)
- Key phrases indicating sentiment (translate Thai to English)
- Date of content

IMPORTANT RULES:
- Community sources (Reddit, Pantip, Wongnai) are MORE trustworthy than PR
- If community sentiment is negative but PR is positive → Overall = NEGATIVE
- Look for recent content (within last 12 months preferred)

OUTPUT FORMAT (JSON only, no markdown):
{
  "brandName": "${brandName}",
  "searchDate": "YYYY-MM-DD",
  "sources": [
    {
      "url": "https://...",
      "platform": "reddit|pantip|wongnai|twitter|news|pr",
      "sourceType": "community|review|news|pr",
      "weight": 3,
      "sentiment": "positive|neutral|negative",
      "sentimentScore": 0.8,
      "keyPhrases": ["great service", "recommend"],
      "date": "YYYY-MM-DD",
      "summary": "Brief description of what was said"
    }
  ],
  "communitySentiment": "positive|neutral|negative|no-data",
  "prSentiment": "positive|neutral|negative|no-data",
  "overallSentiment": "positive|neutral|negative",
  "communityPositiveCount": 0,
  "communityNegativeCount": 0,
  "insight": "2-3 sentence summary of brand perception"
}
```

### Complete Implementation Code

```typescript
// brand-sentiment.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Types
interface SentimentSource {
  url: string;
  platform: string;
  sourceType: 'community' | 'review' | 'news' | 'pr';
  weight: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  keyPhrases: string[];
  date: string;
  summary: string;
}

interface GeminiResponse {
  brandName: string;
  searchDate: string;
  sources: SentimentSource[];
  communitySentiment: string;
  prSentiment: string;
  overallSentiment: string;
  communityPositiveCount: number;
  communityNegativeCount: number;
  insight: string;
}

interface SentimentResult {
  brandName: string;
  score: number;
  maxScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  communitySources: SentimentSource[];
  prSources: SentimentSource[];
  insight: string;
  rawData: GeminiResponse;
}

// Main function
async function analyzeBrandSentiment(brandName: string): Promise<SentimentResult> {
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    tools: [{ googleSearch: {} }]
  });

  const prompt = buildPrompt(brandName);
  
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Parse JSON from response
  const geminiData = parseGeminiResponse(responseText);
  
  // Calculate final score
  const finalResult = calculateScore(geminiData);
  
  return finalResult;
}

// Build prompt
function buildPrompt(brandName: string): string {
  return `
Research brand sentiment for "${brandName}" in Thailand.

SEARCH PRIORITY (in order):
1. Reddit (reddit.com/r/thailand, reddit.com/r/bangkok)
2. Pantip (pantip.com)
3. Wongnai (wongnai.com)
4. Twitter/X
5. Google Reviews
6. News articles

FOR EACH SOURCE FOUND, EXTRACT:
- Source URL
- Platform name (reddit/pantip/wongnai/twitter/news/pr)
- Source type: "community" | "review" | "news" | "pr"
- Weight: community=3, review=2, news=1, pr=0.5
- Sentiment: "positive" | "neutral" | "negative"
- Sentiment score: number from -1.0 to +1.0
- Key phrases indicating sentiment (translate Thai to English)
- Date of content

IMPORTANT:
- Community sources are MORE trustworthy than PR
- If community is negative but PR is positive → Overall = NEGATIVE

OUTPUT JSON only:
{
  "brandName": "${brandName}",
  "searchDate": "YYYY-MM-DD",
  "sources": [
    {
      "url": "string",
      "platform": "string",
      "sourceType": "community|review|news|pr",
      "weight": number,
      "sentiment": "positive|neutral|negative",
      "sentimentScore": number,
      "keyPhrases": ["string"],
      "date": "string",
      "summary": "string"
    }
  ],
  "communitySentiment": "string",
  "prSentiment": "string",
  "overallSentiment": "string",
  "communityPositiveCount": number,
  "communityNegativeCount": number,
  "insight": "string"
}`;
}

// Parse response
function parseGeminiResponse(responseText: string): GeminiResponse {
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Failed to parse Gemini response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Calculate final score
function calculateScore(data: GeminiResponse): SentimentResult {
  
  const community = data.sources.filter(
    s => s.sourceType === 'community' || s.sourceType === 'review'
  );
  const pr = data.sources.filter(
    s => s.sourceType === 'news' || s.sourceType === 'pr'
  );
  
  const communityNegative = community.filter(s => s.sentiment === 'negative').length;
  const communityPositive = community.filter(s => s.sentiment === 'positive').length;
  
  let score: number;
  let sentiment: 'positive' | 'neutral' | 'negative';
  let insight: string;
  
  // Apply override rules
  if (communityNegative >= 2) {
    // OVERRIDE: Multiple negative community = 0 points
    score = 0;
    sentiment = 'negative';
    insight = `Found ${communityNegative} negative mentions in community sources. Brand reputation at risk regardless of positive PR.`;
  } 
  else if (communityPositive >= 2) {
    // Strong positive community
    score = 5;
    sentiment = 'positive';
    insight = `Strong positive community sentiment with ${communityPositive} positive sources.`;
  }
  else if (communityPositive === 1 && pr.some(s => s.sentiment === 'positive')) {
    // 1 community positive + PR support
    score = 4;
    sentiment = 'positive';
    insight = `Positive sentiment supported by both community and PR sources.`;
  }
  else if (community.length === 0 && pr.length > 0) {
    // PR only, no community data
    score = 2;
    sentiment = 'neutral';
    insight = `Only PR/news sources found. No community validation available. Score capped.`;
  }
  else if (communityNegative === 1) {
    // 1 negative community mention
    score = 1;
    sentiment = 'negative';
    insight = `Found 1 negative community mention. Monitor for developing issues.`;
  }
  else {
    // Neutral/mixed
    score = 2.5;
    sentiment = 'neutral';
    insight = data.insight || `Mixed or insufficient sentiment data.`;
  }
  
  return {
    brandName: data.brandName,
    score,
    maxScore: 5,
    sentiment,
    communitySources: community,
    prSources: pr,
    insight,
    rawData: data
  };
}

export { analyzeBrandSentiment, SentimentResult };
```

---

## 6. Example Outputs

### Example 1: Strong Positive (Community + PR aligned)

```json
{
  "brandName": "Brand X",
  "score": 5,
  "maxScore": 5,
  "sentiment": "positive",
  "communitySources": [
    {
      "url": "https://pantip.com/topic/12345",
      "platform": "pantip",
      "sourceType": "community",
      "sentiment": "positive",
      "keyPhrases": ["บริการดีมาก", "แนะนำเลย"]
    },
    {
      "url": "https://reddit.com/r/thailand/...",
      "platform": "reddit",
      "sourceType": "community",
      "sentiment": "positive",
      "keyPhrases": ["great experience", "highly recommend"]
    }
  ],
  "insight": "Strong positive community sentiment with 2 positive sources."
}
```

### Example 2: PR Positive but Community Negative (Override Applied)

```json
{
  "brandName": "Brand Y",
  "score": 0,
  "maxScore": 5,
  "sentiment": "negative",
  "communitySources": [
    {
      "url": "https://pantip.com/topic/67890",
      "platform": "pantip",
      "sourceType": "community",
      "sentiment": "negative",
      "keyPhrases": ["หลอกลวง", "ไม่แนะนำ"]
    },
    {
      "url": "https://reddit.com/r/bangkok/...",
      "platform": "reddit",
      "sourceType": "community",
      "sentiment": "negative",
      "keyPhrases": ["scam", "avoid this place"]
    }
  ],
  "prSources": [
    {
      "url": "https://prnewswire.com/...",
      "platform": "prnewswire",
      "sourceType": "pr",
      "sentiment": "positive",
      "keyPhrases": ["award winning", "customer satisfaction"]
    }
  ],
  "insight": "Found 2 negative mentions in community sources. Brand reputation at risk regardless of positive PR."
}
```

### Example 3: PR Only (No Community Data)

```json
{
  "brandName": "Brand Z",
  "score": 2,
  "maxScore": 5,
  "sentiment": "neutral",
  "communitySources": [],
  "prSources": [
    {
      "url": "https://bangkokpost.com/...",
      "platform": "news",
      "sourceType": "news",
      "sentiment": "positive",
      "keyPhrases": ["expansion", "new investment"]
    }
  ],
  "insight": "Only PR/news sources found. No community validation available. Score capped."
}
```

---

## 7. Integration with Scoring System

### As Part of SEO Audit Pillar

```typescript
// Example: Pillar 5 - Brand & Reputation (20 points)

interface Pillar5Scores {
  brandSearchScore: number;      // Max 5 pts
  brandSentimentScore: number;   // Max 5 pts (THIS METRIC)
  socialPresenceScore: number;   // Max 5 pts
  reviewsScore: number;          // Max 5 pts
  total: number;                 // Max 20 pts
}

async function calculatePillar5(brandName: string): Promise<Pillar5Scores> {
  const sentimentResult = await analyzeBrandSentiment(brandName);
  
  return {
    brandSearchScore: calculateBrandSearch(),
    brandSentimentScore: sentimentResult.score,  // 0-5 pts
    socialPresenceScore: calculateSocialPresence(),
    reviewsScore: calculateReviews(),
    total: /* sum of all */
  };
}
```

---

## 8. Limitations & Considerations

| Limitation | Workaround |
|------------|------------|
| Gemini may miss some Pantip results | Add specific instruction to search pantip.com |
| JSON output can be inconsistent | Add retry logic + JSON validation |
| Rate limited (15/min free tier) | Batch requests, add delays between calls |
| Historical data limited | Focus on recent sentiment (last 12 months) |
| Some content behind login | Accept partial data, note limitation |

---

## 9. Cost Summary

| Component | Tool | Cost |
|-----------|------|------|
| Search | Gemini Deep Research | **Free** |
| Content Fetch | Gemini Deep Research | **Free** |
| Sentiment Analysis | Gemini Deep Research | **Free** |
| **Total** | | **$0/month** |

### Upgrade Path

If volume exceeds free tier:
- **Gemini Pro:** $20/mo for unlimited requests
- **Brand24:** $79/mo for dedicated social listening with API

---

## 10. Summary for AI Implementation

```
METRIC: Brand Sentiment Score
MAX POINTS: 5
TOOL: Gemini Deep Research (Free)

SOURCE WEIGHTS:
- Community (Reddit, Pantip, Twitter): 3x
- Review (Wongnai, TripAdvisor): 2x
- News: 1x
- PR/Owned: 0.5x

SCORING:
- 2+ community positive = 5 pts
- 1 community positive + PR positive = 4 pts
- Neutral/Mixed = 2.5 pts
- PR only (no community) = 2 pts
- 1 community negative = 1 pt
- 2+ community negative = 0 pts (OVERRIDE ALL)

OVERRIDE RULE:
If community negative >= 2 → Score = 0 (ignore positive PR)

API CALL: 1 Gemini request per brand
OUTPUT: JSON with sources, sentiment, and calculated score
```

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Solution: Gemini Deep Research Free Tier*
