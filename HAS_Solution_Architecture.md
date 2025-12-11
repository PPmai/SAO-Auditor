# 🛠️ Digital Performance Scorecard (HAS)
## Solution Architecture Document

**Version:** 1.0  
**Date:** December 2025  
**Budget:** $550/month  
**Approach:** Hybrid (Semrush + Google APIs + Claude + Scraping)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [API Integration Plan](#api-integration-plan)
5. [Scoring System (4 Pillars)](#scoring-system)
6. [Cost Breakdown](#cost-breakdown)
7. [Database Schema](#database-schema)
8. [UI/UX Wireframe Concept](#uiux-wireframe)
9. [Development Timeline](#development-timeline)

---

## 1. Executive Summary <a name="executive-summary"></a>

### Project Goal
สร้างเครื่องมือวิเคราะห์ความพร้อมของเว็บไซต์สำหรับ SEO ยุคใหม่ (GEO/AIO) โดยให้คะแนน 100 คะแนน แบ่งเป็น 4 Pillars:

| Pillar | Weight | Focus |
|--------|--------|-------|
| Content Structure | 30% | AI-readable content |
| Official Brand Ranking | 30% | Technical foundation |
| Keyword Visibility | 20% | Search presence |
| AI Trust & Sentiment | 20% | Brand reputation |

### Key Features
- ✅ Input URL + up to 4 Competitor URLs
- ✅ Comprehensive Score Card (0-100)
- ✅ Detailed metrics breakdown per pillar
- ✅ Competitor comparison
- ✅ Actionable recommendations
- ✅ PDF/Report export (Phase 2)

---

## 2. Tech Stack <a name="tech-stack"></a>

### Frontend
| Technology | Purpose | Reason |
|------------|---------|--------|
| **Next.js 14** | Framework | App Router, Server Components, API Routes |
| **Tailwind CSS** | Styling | Rapid UI development, responsive |
| **Shadcn/ui** | UI Components | Clean, accessible, customizable |
| **Recharts** | Charts | Radar chart, bar charts |
| **Framer Motion** | Animations | Smooth transitions |

### Backend
| Technology | Purpose | Reason |
|------------|---------|--------|
| **Next.js API Routes** | API Layer | Serverless, integrated |
| **Prisma ORM** | Database | Type-safe, easy migrations |
| **Supabase (PostgreSQL)** | Database | Free tier, scalable |

### External APIs
| API | Purpose | Cost |
|-----|---------|------|
| **Semrush API** | Keywords, Backlinks, Domain Analytics | ~$500/mo (Business + Units) |
| **Google PageSpeed Insights** | Core Web Vitals, Lighthouse | FREE |
| **Claude API** | Sentiment Analysis, Content Analysis | ~$20-30/mo |
| **Cheerio/Puppeteer** | HTML Scraping | FREE |

### Deployment
| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Hosting | Free tier / $20/mo Pro |
| **Supabase** | Database | Free tier |

---

## 3. System Architecture <a name="system-architecture"></a>

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                    (Next.js + Tailwind + Shadcn)                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ /api/scan   │  │ /api/report │  │ /api/compare│  │ /api/export│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ANALYSIS ENGINE                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    ORCHESTRATOR SERVICE                       │  │
│  │  - Queue management                                           │  │
│  │  - Parallel API calls                                         │  │
│  │  - Score calculation                                          │  │
│  │  - Result aggregation                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                    │
│    ┌───────────┬───────────┬───────────┬───────────┐               │
│    ▼           ▼           ▼           ▼           ▼               │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                 │
│ │Semrush│ │PageSpd│ │Claude │ │Scraper│ │SSL/DNS│                 │
│ │Module │ │Module │ │Module │ │Module │ │Module │                 │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │ Scans   │  │ Reports │  │ Users   │  │ History │               │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Integration Plan <a name="api-integration-plan"></a>

### 4.0 API Manager - Cascading Fallback System

**Architecture:** Priority-based failover for SEO data collection

```
┌─────────────────────────────────────────────────────────────────────┐
│                      API MANAGER                                     │
│                (lib/modules/api-manager.ts)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   KEYWORDS DATA             BACKLINKS DATA                          │
│   ┌─────────────┐           ┌─────────────┐                        │
│   │  1. Ahrefs  │           │  1. Ahrefs  │  ← Best data quality   │
│   └──────┬──────┘           └──────┬──────┘                        │
│          ↓ (if fail)               ↓ (if fail)                      │
│   ┌─────────────┐           ┌─────────────┐                        │
│   │ 2. DataFor  │           │   2. Moz    │  ← Free tier available │
│   │    SEO      │           └──────┬──────┘                        │
│   └──────┬──────┘                  ↓ (if fail)                      │
│          ↓ (if fail)         ┌─────────────┐                        │
│   ┌─────────────┐           │ 3. Estimate │                        │
│   │ 3. Estimate │           └─────────────┘                        │
│   └─────────────┘                                                   │
│                                                                     │
│   OUTPUT: Unified SEO Metrics with source tracking                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Fallback Priority:**
| Priority | API | Data Provided | Status |
|----------|-----|---------------|--------|
| 1 | Ahrefs | Keywords, Positions, Traffic | Requires paid plan with API access |
| 2 | DataForSEO | Keywords, Positions, Traffic | ~$50/month pay-per-use |
| 3 | Google Search Console | Real search performance data | Requires OAuth setup |
| 4 | Google Custom Search | Brand/keyword positions, SERP snippets, competitors | 100 free searches/day |
| 5 | Moz | DA, PA, Backlinks, Referring Domains | Free tier: 10 queries/month |
| 6 | Common Crawl | Backlinks (limited) | Free, but Index API limitation |
| 7 | Gemini | Brand sentiment analysis | Free tier available |
| 8 | Estimates | Basic estimates based on domain | Always available |

### 4.1 Google Custom Search API (Brand & Keyword Positions)
**Subscription:** Free tier: 100 searches/day, then pay-per-use

| Feature | Purpose | Metrics |
|---------|---------|---------|
| `getBrandSearchPosition()` | Brand Search Position | Position in top 10 for brand name |
| `getKeywordPosition()` | Keyword Position Check | Position in top 10 for specific keywords |
| `getCompetitorPosition()` | Competitor Position | Competitor ranking for brand/keywords |
| `getSERPSnippet()` | SERP Preview | Title + description as shown in Google |
| `getTopCompetitors()` | Competitor Finder | Top 10 competitors for target keywords |

**Setup:**
1. Create Custom Search Engine at https://programmablesearchengine.google.com/
2. Get Search Engine ID (CX)
3. Get API Key from https://console.cloud.google.com/apis/credentials
4. Add to `.env`: `GOOGLE_CUSTOM_SEARCH_API_KEY` and `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

**Replaces:**
- Ahrefs/Semrush brand tracking
- Rank tracker tools
- Ahrefs position checker
- SERP preview tools
- Competitor finder

### 4.2 Ahrefs API (Primary for Keywords - Optional)
**Subscription Required:** API access plan ($199+/mo)

| Endpoint | Purpose | Metrics |
|----------|---------|---------|
| `site-explorer/organic-keywords` | Organic Keywords | Keywords, positions, traffic, intent |

**Note:** Falls back to DataForSEO or Google Custom Search if plan doesn't include API access.

### 4.3 DataForSEO API (Fallback for Keywords)
**Subscription:** Pay-per-use (~$50/mo for 100 scans)

| Endpoint | Purpose | Metrics |
|----------|---------|---------|
| `serp/google/organic` | Keyword Rankings | Positions, traffic estimates |
| `domain_analytics` | Domain Overview | Keyword count, traffic |

### 4.4 Moz API (Fallback for Backlinks)
**Subscription:** Free tier available (10 queries/month)

| Metric | Source | Limits |
|--------|--------|--------|
| Domain Authority (DA) | Link Explorer | Free: 10/month |
| Page Authority (PA) | Link Explorer | Free: 10/month |
| Linking Domains | Link Explorer | Free: 10/month |
| Inbound Links | Link Explorer | Free: 10/month |

### 4.5 Google PageSpeed Insights API (FREE)
**Endpoint:** `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`

| Metric | Source | Scoring |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | Lighthouse | Good < 2.5s |
| INP (Interaction to Next Paint) | Lighthouse | Good < 200ms |
| CLS (Cumulative Layout Shift) | Lighthouse | Good < 0.1 |
| Performance Score | Lighthouse | 0-100 |

**Rate Limit:** 25,000 queries/day (FREE)

### 4.6 Gemini API (For Brand Sentiment Analysis)
**Model:** gemini-2.5-flash (cost-effective)

| Task | Purpose | Est. Tokens |
|------|---------|-------------|
| Sentiment Analysis | Analyze content tone | ~1,000 |
| Content Quality | E-E-A-T evaluation | ~1,500 |
| Recommendations | Generate action items | ~2,000 |

### 4.6 HTML Scraping (FREE)
**Tools:** Cheerio (static) + Puppeteer (dynamic)

| Data Point | Method | Selector |
|------------|--------|----------|
| Meta Title | Cheerio | `title`, `meta[property="og:title"]` |
| Meta Description | Cheerio | `meta[name="description"]` |
| H1, H2, H3 tags | Cheerio | `h1`, `h2`, `h3` |
| Schema.org JSON-LD | Cheerio | `script[type="application/ld+json"]` |
| Images with alt | Cheerio | `img[alt]` |
| Tables | Cheerio | `table` |
| Lists | Cheerio | `ul`, `ol` |
| Videos | Cheerio | `video`, `iframe[src*="youtube"]` |
| Internal/External Links | Cheerio | `a[href]` |
| robots.txt | Fetch | `/robots.txt` |
| SSL Certificate | Node TLS | SSL check |

---

## 5. Scoring System (4 Pillars) <a name="scoring-system"></a>

### Total Score: 100 Points

---

### 5.1 PILLAR 1: Content Structure (25 points)

| Metric | Weight | Data Source | Scoring Logic |
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

---

### 5.2 PILLAR 2: Brand Ranking (9 points)

| Metric | Weight | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Brand Search Position** | 5 | Google Custom Search API | #1: 5, #2-3: 3, #4-10: 1.5, Not in top 10: 0 |
| **Brand Sentiment** | 5 | Gemini API | 2+ positive: 5, 1 pos+PR: 4, Neutral: 2.5, PR only: 2, 1 negative: 1, 2+ negative: 0 |

**Scoring Formula:**
```javascript
brandScore = brandSearchScore + brandSentimentScore
// Max: 9 points (rounded from 10)
```

**Note**: Core Web Vitals and technical metrics moved to "Website Technical" pillar (see 5.3).

---

### 5.3 PILLAR 3: Keyword Visibility (20 points)

| Metric | Weight | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Organic Keywords** | 12.5 | Ahrefs/DataForSEO/GSC | Based on keyword count vs competitor benchmark |
| **Average Position** | 5 | Ahrefs/DataForSEO/GSC | ≤3: 5, ≤10: 3, ≤20: 1, >20: 0 |
| **Search Intent Match** | 5.5 | Ahrefs/DataForSEO | Intent analysis based on keyword types |

**Scoring Formula:**
```javascript
keywordScore = organicKeywordsScore + averagePositionScore + intentMatchScore
// Max: 23 points
```

**Google Custom Search API Features:**
- **Keyword Position Check**: `getKeywordPosition(keyword, domain)` - Check if domain ranks for specific keywords
- **SERP Snippet Preview**: `getSERPSnippet(keyword, domain)` - Get title + description as shown in Google
- **Top 10 Competitors**: `getTopCompetitors(keyword, excludeDomain)` - See who ranks for target keywords

---

### 5.5 PILLAR 5: AI Trust (22 points)

| Metric | Weight | Data Source | Scoring Logic |
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

**Data Sources (Priority Order):**
1. **Common Crawl** (free, but Index API limitation)
2. **Moz API** (fallback, free tier: 10 queries/month)
3. **Estimates** (final fallback)

---

### 5.6 Final Score Calculation

```javascript
const calculateFinalScore = (scores) => {
  // Direct 100-point system (no normalization)
  return Math.round(
    scores.contentStructure +    // 28 pts max
    scores.brandRanking +        // 9 pts max
    scores.websiteTechnical +    // 17 pts max
    scores.keywordVisibility +   // 23 pts max
    scores.aiTrust              // 23 pts max
  );
  // Total: 100 points
};
```

**Pillar Breakdown:**
- Content Structure: 25 points (reduced from 28)
- Brand Ranking: 9 points
- Website Technical: 17 points
- Keyword Visibility: 23 points
- AI Trust: 22 points (reduced from 23)
- **Total: 96 points** (normalized to 100 in display)

// Score Interpretation
const getScoreLabel = (score) => {
  if (score >= 90) return { label: "Excellent", color: "green" };
  if (score >= 70) return { label: "Good", color: "blue" };
  if (score >= 50) return { label: "Needs Improvement", color: "yellow" };
  return { label: "Poor", color: "red" };
};
```

---

## 6. Cost Breakdown <a name="cost-breakdown"></a>

### Monthly Budget: $550

| Service | Cost | Notes |
|---------|------|-------|
| **Semrush Business** | $499.95 | Required for API access |
| **Semrush API Units** | ~$5-10 | ~100,000 units for 100+ scans |
| **Claude API** | ~$5-10 | Sentiment + Content analysis |
| **Vercel Pro** | $20 | Optional (can use free tier initially) |
| **Supabase** | $0 | Free tier sufficient |
| **Google PageSpeed** | $0 | Free |
| **Domain/SSL** | ~$15 | Annual, prorated |
| **Buffer** | ~$10 | For unexpected usage |
| **Total** | **~$550** | ✅ Within budget |

### Usage Estimates (per month)
| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| URL Scans | 100 | $0.50 | $50 |
| Competitor Comparisons | 50 | $1.00 | $50 |
| PDF Reports | 50 | $0.10 | $5 |

---

## 7. Database Schema <a name="database-schema"></a>

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  scans     Scan[]
}

model Scan {
  id           String   @id @default(cuid())
  url          String
  createdAt    DateTime @default(now())
  status       ScanStatus @default(PENDING)
  
  // Scores
  totalScore           Int?
  contentStructureScore Int?
  brandRankingScore     Int?
  keywordVisibilityScore Int?
  aiTrustScore          Int?
  
  // Raw Data (JSON)
  semrushData   Json?
  pagespeedData Json?
  claudeData    Json?
  scrapingData  Json?
  
  // Relations
  userId       String?
  user         User?    @relation(fields: [userId], references: [id])
  competitors  Competitor[]
  recommendations Recommendation[]
}

enum ScanStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model Competitor {
  id        String   @id @default(cuid())
  url       String
  scanId    String
  scan      Scan     @relation(fields: [scanId], references: [id])
  
  // Competitor Scores
  totalScore           Int?
  contentStructureScore Int?
  brandRankingScore     Int?
  keywordVisibilityScore Int?
  aiTrustScore          Int?
  
  // Raw Data
  rawData   Json?
}

model Recommendation {
  id        String   @id @default(cuid())
  scanId    String
  scan      Scan     @relation(fields: [scanId], references: [id])
  
  pillar    String   // contentStructure, brandRanking, etc.
  priority  Priority
  title     String
  description String
  impact    String   // High, Medium, Low
}

enum Priority {
  HIGH
  MEDIUM
  LOW
}
```

---

## 8. UI/UX Wireframe Concept <a name="uiux-wireframe"></a>

### 8.1 Main Dashboard (Input)

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔍 Digital Performance Scorecard                    [Login]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    ┌───────────────────────────────────────────────────────────┐   │
│    │  Enter URL to analyze                                     │   │
│    │  ┌─────────────────────────────────────────────────────┐  │   │
│    │  │ https://example.com                           [Scan]│  │   │
│    │  └─────────────────────────────────────────────────────┘  │   │
│    └───────────────────────────────────────────────────────────┘   │
│                                                                     │
│    ➕ Add Competitors (Optional, max 4)                            │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │ 1. https://competitor1.com                          [×]    │ │
│    │ 2. https://competitor2.com                          [×]    │ │
│    │ + Add competitor                                           │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                    [ 🚀 Start Analysis ]                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Results Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Analysis Results for example.com                 [Export PDF]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐│
│  │                     │    │         RADAR CHART                 ││
│  │     OVERALL SCORE   │    │                                     ││
│  │                     │    │      Content Structure              ││
│  │        85/100       │    │            ★                        ││
│  │                     │    │           /│\                       ││
│  │    ⭐ Excellent     │    │  AI Trust ──┼── Brand Ranking       ││
│  │                     │    │           \│/                       ││
│  │                     │    │            ★                        ││
│  │                     │    │      Keyword Visibility             ││
│  └─────────────────────┘    └─────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  PILLAR BREAKDOWN                                               ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │  Content Structure    ████████████████████░░░░  27/30  (90%)   ││
│  │  Brand Ranking        ██████████████████░░░░░░  24/30  (80%)   ││
│  │  Keyword Visibility   ████████████████░░░░░░░░  16/20  (80%)   ││
│  │  AI Trust & Sentiment █████████████████░░░░░░░  18/20  (90%)   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  🎯 TOP RECOMMENDATIONS                                         ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │  🔴 HIGH: Add FAQ Schema markup to improve AI readability       ││
│  │  🟡 MED:  Optimize INP - currently at 350ms (target: <200ms)    ││
│  │  🟢 LOW:  Add video content with transcripts                   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Competitor Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚔️ Competitor Comparison                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  │ Metric              │ You │ Comp1 │ Comp2 │ Comp3 │ Comp4 │     │
│  ├─────────────────────┼─────┼───────┼───────┼───────┼───────┤     │
│  │ Overall Score       │ 85  │ 72    │ 68    │ 91    │ 55    │     │
│  │ Content Structure   │ 27  │ 22    │ 18    │ 28    │ 15    │     │
│  │ Brand Ranking       │ 24  │ 20    │ 22    │ 29    │ 18    │     │
│  │ Keyword Visibility  │ 16  │ 14    │ 12    │ 18    │ 10    │     │
│  │ AI Trust            │ 18  │ 16    │ 16    │ 16    │ 12    │     │
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  📈 [View detailed comparison chart]                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Development Timeline <a name="development-timeline"></a>

### Total Duration: 8 Weeks

| Phase | Week | Tasks | Deliverables |
|-------|------|-------|--------------|
| **1. Setup** | 1 | Project setup, DB schema, API keys | Repo, DB, env config |
| **2. Core APIs** | 2-3 | Semrush, PageSpeed, Claude integration | API modules |
| **3. Scraping** | 3 | HTML scraper, Schema parser | Scraping module |
| **4. Scoring Engine** | 4 | Score calculation, aggregation | Scoring service |
| **5. UI - Input** | 5 | URL input, competitor input | Input forms |
| **6. UI - Results** | 5-6 | Score card, radar chart, tables | Results dashboard |
| **7. Comparison** | 6-7 | Competitor comparison view | Comparison page |
| **8. Polish** | 7-8 | Testing, bug fixes, optimization | Production ready |

### MVP Features (Phase 1)
- ✅ Single URL scan
- ✅ 4 Pillar scores
- ✅ Radar chart visualization
- ✅ Basic recommendations
- ✅ Competitor comparison (up to 4)

### Future Features (Phase 2)
- 📋 PDF export
- 📊 Historical tracking
- 🔐 User accounts
- 📧 Email reports
- 🏷️ White-label reports

---

## 10. Next Steps

1. **ยืนยัน Architecture นี้** ก่อนเริ่ม development
2. **สมัคร Semrush Business** + activate API
3. **สร้าง Supabase project** + run migrations
4. **เริ่ม Phase 1: Setup**

---

*Document created for Conductor Agency*  
*Last updated: December 2025*
