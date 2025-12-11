# Ahrefs API Features & Capabilities

## Overview
The Ahrefs API integration provides comprehensive SEO data for keyword visibility, backlink analysis, and competitor benchmarking. This document outlines all available features.

## 🎯 Available Features

### 1. **Organic Keyword Analysis** (`getUrlKeywords`)
**Endpoint:** `/api/ahrefs/test?url=https://theconductor.co`

**What it does:**
- Fetches all organic keywords ranking for a specific URL
- Analyzes search intent (informational, commercial, transactional, navigational)
- Calculates average position and estimated traffic
- Identifies dominant search intent

**Returns:**
```typescript
{
  totalKeywords: number,           // Total keywords ranking
  averagePosition: number,         // Average SERP position
  estimatedTraffic: number,        // Estimated monthly traffic
  keywords: Array<{                // Top 20 keywords
    keyword: string,
    position: number,
    traffic: number,
    is_informational: boolean,
    is_commercial: boolean,
    is_transactional: boolean,
    is_navigational: boolean
  }>,
  intentBreakdown: {
    informational: { count, percent },
    commercial: { count, percent },
    transactional: { count, percent },
    navigational: { count, percent },
    dominant: string,              // Most common intent
    matchPercent: number           // % matching dominant intent
  }
}
```

**Use Cases:**
- Keyword visibility scoring (Pillar 3)
- Search intent analysis
- Content optimization recommendations
- Competitor keyword gap analysis

---

### 2. **Backlink Profile Analysis** (`getBacklinkMetrics`)
**Endpoint:** `/api/ahrefs/test?domain=theconductor.co`

**What it does:**
- Fetches total backlinks count
- Gets referring domains count
- Retrieves Domain Rating (DR)
- Analyzes link profile quality

**Returns:**
```typescript
{
  backlinks: number,              // Total backlinks
  referringDomains: number,      // Unique referring domains
  domainRating: number,          // Domain Rating (0-100)
  error?: string
}
```

**Use Cases:**
- AI Trust scoring (Pillar 5)
- Domain authority assessment
- Link building strategy
- Competitor backlink comparison

---

### 3. **SERP Competitor Analysis** (`getSerpCompetitors`)
**Endpoint:** `/api/ahrefs/test?keyword=seo tools`

**What it does:**
- Fetches top 10 SERP competitors for a keyword
- Shows how many keywords each competitor ranks for
- Identifies competitive landscape

**Returns:**
```typescript
Array<{
  url: string,
  keywordCount: number
}>
```

**Use Cases:**
- Competitor benchmarking
- Keyword gap analysis
- SERP opportunity identification
- Content strategy planning

---

### 4. **Keyword Benchmark Calculation** (`getKeywordBenchmark`)
**Internal function** - Automatically calculates benchmark

**What it does:**
- Gets primary keyword (highest traffic) for a URL
- Fetches SERP competitors for that keyword
- Calculates average keyword count of competitors
- Provides competitive benchmark

**Returns:**
```typescript
{
  benchmark: number,              // Average keywords of competitors
  competitors: Array<{
    url: string,
    keywordCount: number
  }>
}
```

**Use Cases:**
- Keyword visibility scoring
- Competitive positioning
- Content depth recommendations

---

## 🔧 API Endpoints

### Test Endpoint
**Base URL:** `/api/ahrefs/test`

**Query Parameters:**
- `url` - Test keyword data for a specific URL
  - Example: `/api/ahrefs/test?url=https://theconductor.co`
  
- `domain` - Test backlink data for a domain
  - Example: `/api/ahrefs/test?domain=theconductor.co`
  
- `keyword` - Test SERP competitors for a keyword
  - Example: `/api/ahrefs/test?keyword=seo tools`

**Response Format:**
```json
{
  "status": "success",
  "configured": true,
  "keywordMetrics": { ... },
  "backlinkMetrics": { ... },
  "serpCompetitors": [ ... ],
  "scores": { ... }
}
```

---

## 📊 Integration with Scoring System

### Pillar 3: Keyword Visibility (25 points)
Ahrefs provides data for:
- **Keywords Score (10 pts)** - Based on keyword count vs competitor benchmark
- **Positions Score (7.5 pts)** - Based on average SERP position
- **Intent Match Score (7.5 pts)** - Based on search intent consistency

### Pillar 5: AI Trust (25 points)
Ahrefs provides data for:
- **Backlinks Score (6 pts)** - Based on Domain Rating and backlink quality
- **Referring Domains Score (4 pts)** - Based on referring domain count

---

## 🚀 Usage Examples

### Example 1: Get Keywords for a URL
```typescript
import { getUrlKeywords } from '@/lib/modules/ahrefs';

const metrics = await getUrlKeywords('https://theconductor.co');
console.log(`Found ${metrics.totalKeywords} keywords`);
console.log(`Average position: #${metrics.averagePosition}`);
console.log(`Dominant intent: ${metrics.intentBreakdown.dominant}`);
```

### Example 2: Get Backlinks for a Domain
```typescript
import { getBacklinkMetrics } from '@/lib/modules/ahrefs';

const backlinks = await getBacklinkMetrics('theconductor.co');
console.log(`DR: ${backlinks.domainRating}`);
console.log(`Referring domains: ${backlinks.referringDomains}`);
```

### Example 3: Get SERP Competitors
```typescript
import { getSerpCompetitors } from '@/lib/modules/ahrefs';

const competitors = await getSerpCompetitors('seo tools', 'us');
competitors.forEach(c => {
  console.log(`${c.url}: ${c.keywordCount} keywords`);
});
```

### Example 4: Calculate Keyword Benchmark
```typescript
import { getKeywordBenchmark } from '@/lib/modules/ahrefs';

const benchmark = await getKeywordBenchmark('https://theconductor.co');
console.log(`Competitor benchmark: ${benchmark.benchmark} keywords`);
```

---

## 🔄 Automatic Fallback System

The Ahrefs API is integrated into the cascading API manager:

**Priority Order:**
1. **Ahrefs** (Primary) - Best data quality, comprehensive metrics
2. **DataForSEO** (Fallback) - Good alternative for keywords
3. **Moz** (Fallback) - Domain authority and backlinks
4. **Estimates** (Last resort) - Basic calculations

The system automatically tries Ahrefs first, then falls back to other APIs if unavailable.

---

## ⚙️ Configuration

### Setup Steps:
1. **Get Ahrefs Enterprise Plan** (API v3 requires Enterprise)
2. **Generate API Key:**
   - Go to https://ahrefs.com/settings/api
   - Create a new API token
3. **Add to Environment:**
   ```bash
   # .env file
   AHREFS_API_KEY=your_api_key_here
   ```
4. **Restart Server:**
   ```bash
   npm run dev
   ```

### Testing:
```bash
# Test script
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-ahrefs.ts

# Or via API endpoint
curl "http://localhost:3000/api/ahrefs/test?url=https://theconductor.co"
```

---

## 📈 Scoring Integration

### Keyword Visibility Scoring:
- **≥100% of benchmark** = 10/10 points
- **80-99%** = 8/10 points
- **60-79%** = 6/10 points
- **40-59%** = 4/10 points
- **20-39%** = 2/10 points
- **<20%** = 0/10 points

### Position Scoring:
- **Position ≤3** = 7.5/7.5 points
- **Position 4-10** = 5/7.5 points
- **Position 11-20** = 2.5/7.5 points
- **Position >20** = 0/7.5 points

### Intent Match Scoring:
- **≥80% match** = 7.5/7.5 points
- **60-79%** = 6/7.5 points
- **40-59%** = 4/7.5 points
- **20-39%** = 2/7.5 points
- **<20%** = 0/7.5 points

### Backlink Scoring:
- **DR ≥60** = 6/6 points
- **DR ≥40** = 4/6 points
- **DR ≥20** = 2/6 points
- **DR >0** = 1/6 points

### Referring Domains Scoring:
- **≥100 domains** = 4/4 points
- **≥50 domains** = 3/4 points
- **≥20 domains** = 2/4 points
- **>0 domains** = 1/4 points

---

## 🛡️ Error Handling

The implementation handles:
- **Rate Limiting** (429) - Returns appropriate error message
- **Credit Exhaustion** (402) - Warns about API credits
- **Invalid API Key** (401) - Returns configuration error
- **Network Errors** - Graceful fallback to other APIs
- **Empty Results** - Returns empty metrics with error message

---

## 📝 Notes

- **API v3 Requirement:** Ahrefs API v3 requires Enterprise plan ($999+/month)
- **Rate Limits:** Check your Ahrefs plan for API rate limits
- **Country Support:** Default country is 'th' (Thailand), can be changed
- **Date Range:** Uses yesterday's data by default
- **Limit:** Fetches top 100 keywords by traffic

---

## 🔗 Related Files

- **Module:** `lib/modules/ahrefs.ts`
- **Test Route:** `app/api/ahrefs/test/route.ts`
- **Test Script:** `scripts/test-ahrefs.ts`
- **API Manager:** `lib/modules/api-manager.ts`
- **Scoring:** `lib/modules/scoring.ts`

---

## 📚 Additional Resources

- [Ahrefs API Documentation](https://docs.ahrefs.com/)
- [Ahrefs Pricing](https://ahrefs.com/pricing)
- [API v3 Requirements](https://help.ahrefs.com/en/articles/6559232-about-api-v3-for-enterprise-plan)





