# Scoring Logic Documentation

## Overview

The SAO Auditor uses a **5-Pillar Scoring System** with a total of **100 points**. Each pillar measures different aspects of SEO and GEO (Generative Engine Optimization) readiness.

---

## Pillar Structure

| Pillar | Points | Focus |
|--------|--------|-------|
| **Content Structure** | 25 | Schema, headings, tables, multimedia, direct answers |
| **Brand Ranking** | 9 | Brand search position, brand sentiment |
| **Website Technical** | 17 | Core Web Vitals, mobile, SSL, sitemap, LLMs.txt |
| **Keyword Visibility** | 23 | Organic keywords, positions, traffic, intent match |
| **AI Trust** | 22 | Backlinks, E-E-A-T, sentiment, local signals |
| **Total** | **96** | (Normalized to 100 in display) |

---

## PILLAR 1: Content Structure (25 points)

### Metrics Breakdown

| Metric | Points | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Schema Coverage** | 8 | Scraping | Basic schema: +3.5, Rich schema (FAQ/HowTo/Product): +4.5 |
| **Heading Structure** | 5 | Scraping | Proper H1→H2→H3 hierarchy: +5 |
| **Multimodal Content** | 4 | Scraping | Images with alt: +1.5, Videos: +1.5, Infographics: +0.75 |
| **Image Alt Text** | 2.5 | Scraping | 80%+ coverage: 2.5, 60%+: 1.75, 40%+: 1, <40%: 0 |
| **Table/List Utilization** | 2 | Scraping | Tables ≥1: +1, Lists ≥3: +1 |
| **Direct Answer (TL;DR)** | 2 | Scraping | First 50 words answer main query: 0-2 |
| **Content Gap Score** | 1 | Scraping | Word count ≥1000: 1, ≥500: 0.75, ≥200: 0.5, <200: 0 |

**Scoring Formula:**
```javascript
contentScore = schemaScore + headingScore + multimodalScore + 
               imageAltScore + tableListScore + directAnswerScore + contentGapScore
// Max: 25 points
```

### Data Sources
- **Scraping**: HTML parsing with Cheerio
- **Schema Detection**: JSON-LD parsing
- **Content Analysis**: Word count, heading structure, media elements

---

## PILLAR 2: Brand Ranking (9 points)

### Metrics Breakdown

| Metric | Points | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Brand Search Position** | 5 | Google Custom Search API | #1: 5, #2-3: 3, #4-10: 1.5, Not in top 10: 0 |
| **Brand Sentiment** | 5 | Gemini API | 2+ positive: 5, 1 pos+PR: 4, Neutral: 2.5, PR only: 2, 1 negative: 1, 2+ negative: 0 |

**Scoring Formula:**
```javascript
brandScore = brandSearchScore + brandSentimentScore
// Max: 9 points (rounded from 10)
```

### Data Sources

#### Brand Search Position (Google Custom Search API)
- **Replaces**: Ahrefs/Semrush brand tracking
- **How it works**: 
  1. Extracts brand name from domain (e.g., "msig-thai" from "msig-thai.com")
  2. Searches Google for brand name
  3. Finds domain position in top 10 results
  4. Scores based on position
- **Scoring**:
  - Position #1 = 5 points
  - Position #2-3 = 3 points
  - Position #4-10 = 1.5 points
  - Not in top 10 = 0 points
- **Fallback**: If Google Custom Search not configured, returns 0 points with setup instructions

#### Brand Sentiment (Gemini API)
- **Replaces**: Manual sentiment analysis
- **How it works**:
  1. Analyzes brand mentions from training data
  2. Checks communities (Reddit, Pantip, forums), reviews, PR sources
  3. Calculates sentiment score based on positive/negative mentions
- **Scoring**:
  - 2+ community positive = 5 pts
  - 1 community pos + PR = 4 pts
  - Neutral/Mixed = 2.5 pts
  - PR only = 2 pts
  - 1 community negative = 1 pt
  - 2+ community negative = 0 pts (OVERRIDE)
- **Fallback**: If Gemini not configured, returns 0 points with setup instructions

---

## PILLAR 3: Website Technical (17 points)

### Metrics Breakdown

| Metric | Points | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **LCP (Largest Contentful Paint)** | 3 | PageSpeed API | <5s: 3, 5-7s: 1.5, >7s: 0 |
| **INP (Interaction to Next Paint)** | 1 | PageSpeed API | ≤200ms: 1, >200ms: 0 |
| **CLS (Cumulative Layout Shift)** | 1 | PageSpeed API | ≤0.1: 1, >0.1: 0 |
| **Mobile Score** | 3 | PageSpeed API | ≥90: 3, ≥70: 2, <70: 0 |
| **SSL/HTTPS** | 3 | SSL Check | Valid SSL: 3, Invalid/None: 0 |
| **Broken Links** | 2 | Scraping | 0 broken: 2, 1-5: 1, >5: 0 |
| **LLMs.txt** | 2 | Scraping | Present: 2, Missing: 0 |
| **Sitemap** | 2.5 | Scraping | Valid sitemap.xml: 2.5, Invalid/Missing: 0 |

**Scoring Formula:**
```javascript
technicalScore = lcpScore + inpScore + clsScore + mobileScore + 
                sslScore + brokenLinksScore + llmsTxtScore + sitemapScore
// Max: 17 points
```

### Data Sources
- **PageSpeed API**: Google PageSpeed Insights (free tier: 25,000 queries/day)
- **SSL Check**: Node.js TLS verification
- **Scraping**: robots.txt, sitemap.xml, llms.txt detection

---

## PILLAR 4: Keyword Visibility (23 points)

### Metrics Breakdown

| Metric | Points | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Organic Keywords** | 12.5 | Ahrefs/DataForSEO/GSC | Based on keyword count vs competitor benchmark |
| **Average Position** | 5 | Ahrefs/DataForSEO/GSC | ≤3: 5, ≤10: 3, ≤20: 1, >20: 0 |
| **Search Intent Match** | 5.5 | Ahrefs/DataForSEO | Intent analysis based on keyword types |

**Scoring Formula:**
```javascript
keywordScore = organicKeywordsScore + averagePositionScore + intentMatchScore
// Max: 23 points
```

### Data Sources (Priority Order)

1. **Ahrefs API** (if configured)
   - `site-explorer/organic-keywords` endpoint
   - Provides keywords, positions, traffic, intent classification
   - Requires paid plan with API access

2. **DataForSEO API** (fallback)
   - `serp/google/organic` endpoint
   - Provides keyword positions and traffic estimates
   - Pay-per-use (~$50/month for 100 scans)

3. **Google Search Console** (fallback)
   - Provides actual search performance data
   - Requires OAuth setup

4. **Estimates** (final fallback)
   - Based on domain type and TLD
   - Conservative estimates when APIs unavailable

### Google Custom Search API Features

#### Keyword Position Check
- **Function**: `getKeywordPosition(keyword, domain)`
- **Replaces**: Ahrefs position checker
- **How it works**: 
  1. Searches Google for specific keyword
  2. Checks if domain appears in top 10 results
  3. Returns position if found
- **Use case**: Check ranking for specific keywords

#### SERP Snippet Preview
- **Function**: `getSERPSnippet(keyword, domain)`
- **Replaces**: SERP preview tools
- **How it works**:
  1. Gets keyword position
  2. Returns title and description as shown in Google
- **Use case**: Preview how your page appears in search results

#### Top 10 Competitors
- **Function**: `getTopCompetitors(keyword, excludeDomain)`
- **Replaces**: Competitor finder tools
- **How it works**:
  1. Searches Google for keyword
  2. Returns top 10 results (excluding your domain)
  3. Shows competitor domains, positions, titles, snippets
- **Use case**: Competitor analysis and benchmarking

---

## PILLAR 5: AI Trust (22 points)

### Metrics Breakdown

| Metric | Points | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Backlink Quality** | 5 | Common Crawl/Moz | Based on referring domains count (normalized) |
| **Referring Domains** | 4 | Common Crawl/Moz | ≥100: 4, ≥50: 3, ≥20: 2, <20: 1 |
| **Sentiment** | 3.5 | Scraping | Based on content depth and word count |
| **E-E-A-T Signals** | 3.5 | Scraping | Author info, schema, citations: 0-3.5 |
| **Local/GEO Signals** | 1.75 | Scraping | LocalBusiness schema: 1.75, None: 0 |

**Scoring Formula:**
```javascript
aiTrustScore = backlinkScore + referringDomainsScore + 
               sentimentScore + eeatScore + localScore
// Max: 22 points
```

### Data Sources (Priority Order)

1. **Common Crawl** (for backlinks)
   - Free, always available
   - **Limitation**: Index API doesn't support reverse lookups
   - Returns empty results, falls back to Moz

2. **Moz API** (fallback for backlinks)
   - Provides Domain Authority, Page Authority, backlink counts
   - Free tier: 10 queries/month
   - Requires `MOZ_API_TOKEN`

3. **Estimates** (final fallback)
   - Based on domain type and TLD
   - Conservative estimates when APIs unavailable

---

## Google Custom Search API Integration

### Features Implemented

| Feature | Replaces | Pillar | Function |
|---------|----------|--------|----------|
| **Brand Search Position** | Ahrefs/Semrush brand tracking | Brand Ranking | `getBrandSearchPosition()` |
| **Competitor Position Check** | Rank tracker tools | Brand Ranking | `getCompetitorPosition()` |
| **Keyword Position Check** | Ahrefs position checker | Keyword Visibility | `getKeywordPosition()` |
| **SERP Snippet Preview** | SERP preview tools | Content | `getSERPSnippet()` |
| **Top 10 Competitors** | Competitor finder | Analysis | `getTopCompetitors()` |

### Setup Instructions

1. **Create Custom Search Engine**:
   - Go to https://programmablesearchengine.google.com/
   - Click "Add" to create a new search engine
   - Set "Sites to search" to "Search the entire web"
   - Get your Search Engine ID (CX)

2. **Get API Key**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create a new API key or use existing one
   - Enable "Custom Search API" for the project

3. **Add to .env**:
   ```env
   GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id_here
   ```

4. **Free Tier Limits**:
   - 100 free searches per day
   - Additional searches require billing setup

### Usage Examples

```typescript
import { 
  getBrandSearchPosition,
  getKeywordPosition,
  getTopCompetitors 
} from '@/lib/modules/google-custom-search';

// Check brand search position
const brandResult = await getBrandSearchPosition('msig-thai', 'msig-thai.com');
// Returns: { position: 1, found: true, url: '...', title: '...' }

// Check keyword position
const keywordResult = await getKeywordPosition('insurance thailand', 'msig-thai.com');
// Returns: { keyword: 'insurance thailand', position: 3, found: true }

// Get top competitors
const competitors = await getTopCompetitors('insurance thailand', 'msig-thai.com');
// Returns: { competitors: [...], totalResults: 1000000 }
```

---

## Score Calculation Flow

```
1. Scrape Website
   ↓
2. Analyze PageSpeed
   ↓
3. Get SEO Metrics (API Manager)
   ├─→ Try Ahrefs for keywords
   ├─→ Try DataForSEO (fallback)
   ├─→ Try Common Crawl for backlinks
   ├─→ Try Moz (fallback)
   └─→ Use estimates (final fallback)
   ↓
4. Get Brand Search Position (Google Custom Search)
   ↓
5. Get Brand Sentiment (Gemini API)
   ↓
6. Calculate 5 Pillar Scores
   ├─→ Content Structure (28 pts)
   ├─→ Brand Ranking (9 pts)
   ├─→ Website Technical (17 pts)
   ├─→ Keyword Visibility (23 pts)
   └─→ AI Trust (23 pts)
   ↓
7. Total Score = Sum of all pillars (100 pts max)
```

---

## API Fallback Chain

### Keywords
1. **Ahrefs API** → Best data quality (requires paid plan)
2. **DataForSEO API** → Good fallback (pay-per-use)
3. **Google Search Console** → Real performance data (requires OAuth)
4. **Estimates** → Conservative estimates (always available)

### Backlinks
1. **Common Crawl** → Free, but limited (Index API limitation)
2. **Moz API** → Good fallback (free tier: 10 queries/month)
3. **Estimates** → Conservative estimates (always available)

### Brand Search
1. **Google Custom Search API** → Real-time position check (100 free/day)
2. **Not configured** → Returns 0 points with setup instructions

### Brand Sentiment
1. **Gemini API** → AI-powered sentiment analysis
2. **Not configured** → Returns 0 points with setup instructions

---

## Score Interpretation

| Score Range | Label | Description |
|-------------|-------|-------------|
| 90-100 | Excellent | Well-optimized for modern search and AI |
| 70-89 | Good | Performing well with room for improvement |
| 50-69 | Needs Improvement | Several areas need attention |
| 0-49 | Poor | Significant optimization needed |

---

## Data Source Tracking

The system tracks which APIs were used for each metric:

```typescript
{
  dataSource: {
    moz: boolean,              // Moz API used for backlinks
    dataforseo: boolean,       // DataForSEO used for keywords
    gsc: boolean,              // Google Search Console used
    pagespeed: boolean,        // PageSpeed API used
    scraping: boolean,          // HTML scraping used
    gemini: boolean,           // Gemini API used for sentiment
    googleCustomSearch: boolean // Google Custom Search used
  }
}
```

---

## Recommendations System

The system generates prioritized recommendations based on:
- **Score gaps**: Metrics scoring below maximum
- **API errors**: Failed API calls that affect scoring
- **Missing features**: Required APIs not configured
- **Priority levels**: HIGH, MEDIUM, LOW based on impact

Each recommendation includes:
- **Title**: Clear action item
- **Description**: Detailed explanation
- **Impact**: Expected score improvement
- **Priority**: HIGH, MEDIUM, or LOW

---

## Last Updated

- **Date**: December 2025
- **Version**: 2.0
- **Changes**: 
  - Added Google Custom Search API integration
  - Updated Brand Ranking to use Google Custom Search
  - Added Gemini API for brand sentiment
  - Updated to 5-pillar system (was 4-pillar)

