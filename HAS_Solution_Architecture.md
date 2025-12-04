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

### 4.1 Semrush API
**Subscription Required:** Business Plan ($499.95/mo) + API Units

| Endpoint | Purpose | Metrics | Units/Request |
|----------|---------|---------|---------------|
| `domain_ranks` | Domain Overview | Authority Score, Traffic | 10 |
| `domain_organic` | Organic Keywords | Top keywords, positions, **AI Overview features** | 10/keyword |
| `backlinks_overview` | Backlink Summary | Total backlinks, referring domains | 40 |
| `backlinks` | Backlink Details | DR, anchor texts | 40/row |
| `domain_organic_organic` | Competitors | Competing domains | 10 |
| `position_tracking` | AI Visibility | **Track "AI Overview" SERP feature presence** | Varies |

**Estimated Usage per Scan (1 URL + 4 competitors = 5 URLs):**
- Domain Overview: 5 × 10 = 50 units
- Top 10 Keywords: 5 × 100 = 500 units
- Backlinks Overview: 5 × 40 = 200 units
- **Total per scan: ~750 units**
- **100 scans/month: ~75,000 units ($3.75)**

### 4.2 Google PageSpeed Insights API (FREE)
**Endpoint:** `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`

| Metric | Source | Scoring |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | Lighthouse | Good < 2.5s |
| INP (Interaction to Next Paint) | Lighthouse | Good < 200ms |
| CLS (Cumulative Layout Shift) | Lighthouse | Good < 0.1 |
| Performance Score | Lighthouse | 0-100 |
| Accessibility Score | Lighthouse | 0-100 |
| SEO Score | Lighthouse | 0-100 |

**Rate Limit:** 25,000 queries/day (more than enough!)

### 4.3 Claude API (Anthropic)
**Model:** claude-3-5-sonnet (cost-effective)

| Task | Purpose | Est. Tokens |
|------|---------|-------------|
| Sentiment Analysis | Analyze content tone | ~1,000 |
| Content Quality | E-E-A-T evaluation | ~1,500 |
| Recommendations | Generate action items | ~2,000 |

**Estimated Cost:**
- Input: $3/million tokens
- Output: $15/million tokens
- Per scan: ~$0.05
- 100 scans/month: ~$5

### 4.4 HTML Scraping (FREE)
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

### 5.1 PILLAR 1: Content Structure (30 points)

| Metric | Weight | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Schema Coverage** | 8 | Scraping | Has JSON-LD: +4, Rich schema (FAQ/HowTo/Product): +4 |
| **Table/List Utilization** | 6 | Scraping | Tables ≥2: +3, Lists ≥5: +3 |
| **Heading Structure** | 5 | Scraping | Proper H1→H2→H3 hierarchy: +5 |
| **Multimodal Content** | 5 | Scraping | Images with alt: +2, Videos: +2, Infographics: +1 |
| **Direct Answer (TL;DR)** | 3 | Claude API | First 50 words answer main query: 0-3 |
| **Content Gap Score** | 3 | Semrush + Claude | Missing key topics vs competitors: 0-3 |

**Scoring Formula:**
```javascript
contentScore = schemaScore + tableListScore + headingScore + 
               multimodalScore + directAnswerScore + contentGapScore
// Max: 30 points
```

---

### 5.2 PILLAR 2: Official Brand Ranking (30 points)

| Metric | Weight | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Core Web Vitals (LCP)** | 6 | PageSpeed API | Good: 6, Needs Improvement: 3, Poor: 0 |
| **Core Web Vitals (INP)** | 4 | PageSpeed API | Good: 4, Needs Improvement: 2, Poor: 0 |
| **Core Web Vitals (CLS)** | 4 | PageSpeed API | Good: 4, Needs Improvement: 2, Poor: 0 |
| **Mobile Friendly** | 4 | PageSpeed API | Score ≥ 90: 4, ≥ 70: 2, < 70: 0 |
| **SSL/HTTPS** | 4 | SSL Check | Valid SSL: 4, Invalid/None: 0 |
| **Broken Links** | 4 | Scraping + Check | 0 broken: 4, 1-5: 2, > 5: 0 |
| **Branded Search Rank** | 4 | Semrush | #1 for brand: 4, Top 3: 2, Not in top 10: 0 |

**Scoring Formula:**
```javascript
brandScore = lcpScore + inpScore + clsScore + mobileScore + 
             sslScore + brokenLinksScore + brandedSearchScore
// Max: 30 points
```

---

### 5.3 PILLAR 3: Keyword Visibility (20 points)

| Metric | Weight | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Organic Keywords (Top 10)** | 6 | Semrush | ≥100 keywords: 6, ≥50: 4, ≥20: 2, <20: 0 |
| **Organic Traffic** | 5 | Semrush | Based on percentile vs competitors |
| **Keyword Positions** | 5 | Semrush | Avg position ≤3: 5, ≤10: 3, ≤20: 1, >20: 0 |
| **Search Visibility Trend** | 4 | Semrush | Improving: 4, Stable: 2, Declining: 0 |

**Scoring Formula:**
```javascript
visibilityScore = keywordCountScore + trafficScore + 
                  positionScore + trendScore
// Max: 20 points
```

---

### 5.4 PILLAR 4: AI Trust & Sentiment (20 points)

| Metric | Weight | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Backlink Quality** | 6 | Semrush | High DR referring domains ratio |
| **Referring Domains** | 4 | Semrush | ≥100: 4, ≥50: 3, ≥20: 2, <20: 1 |
| **Content Sentiment** | 4 | Claude API | Positive: 4, Neutral: 2, Negative: 0 |
| **E-E-A-T Signals** | 4 | Scraping + Claude | Author bio, About page, Citations |
| **Local/GEO Signals** | 2 | Scraping | GMB embed, Address schema, Map |

**Scoring Formula:**
```javascript
trustScore = backlinkQualityScore + referringDomainsScore + 
             sentimentScore + eeatScore + localScore
// Max: 20 points
```

---

### 5.5 Final Score Calculation

```javascript
const calculateFinalScore = (scores) => {
  const weights = {
    contentStructure: 0.30,    // 30 points max
    brandRanking: 0.30,        // 30 points max
    keywordVisibility: 0.20,   // 20 points max
    aiTrust: 0.20              // 20 points max
  };
  
  return Math.round(
    scores.contentStructure + 
    scores.brandRanking + 
    scores.keywordVisibility + 
    scores.aiTrust
  );
};

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
