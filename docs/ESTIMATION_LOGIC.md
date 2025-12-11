# Estimation Logic Documentation

## Overview

When APIs are unavailable, not configured, or return no data, the system uses **estimation functions** to provide baseline metrics. These estimates are conservative and based on simple heuristics to ensure the scoring system can still function.

## Estimation Functions

### 1. Keyword Estimates (`generateKeywordEstimates`)

**Location:** `lib/modules/api-manager.ts`

**Logic:**
```typescript
function generateKeywordEstimates(url: string) {
    const domain = new URL(url).hostname;
    const isWellKnown = domain.includes('.com') || 
                       domain.includes('.co.th') || 
                       domain.includes('.org');

    return {
        total: isWellKnown ? 50 : 10,           // Total keywords
        top10: isWellKnown ? 5 : 1,             // Keywords in top 10
        top100: isWellKnown ? 30 : 5,           // Keywords in top 100
        avgPosition: 35,                         // Average position (always 35)
        estimatedTraffic: isWellKnown ? 500 : 50 // Estimated monthly traffic
    };
}
```

**Heuristics:**
- **Well-known domains** (`.com`, `.co.th`, `.org`): Assumes established site
  - 50 total keywords
  - 5 in top 10
  - 30 in top 100
  - 500 estimated monthly traffic
- **Other domains**: Assumes newer/smaller site
  - 10 total keywords
  - 1 in top 10
  - 5 in top 100
  - 50 estimated monthly traffic
- **Average position**: Always 35 (middle of search results)

**Why these values?**
- Conservative estimates that won't inflate scores
- Based on typical small-to-medium business websites
- Position 35 is neutral (not great, not terrible)

---

### 2. Backlink Estimates (`generateBacklinkEstimates`)

**Location:** `lib/modules/api-manager.ts`

**Logic:**
```typescript
function generateBacklinkEstimates(url: string) {
    const domain = new URL(url).hostname;
    const isWellKnown = domain.includes('.com') || 
                       domain.includes('.co.th') || 
                       domain.includes('.org');

    return {
        total: isWellKnown ? 100 : 10,              // Total backlinks
        referringDomains: isWellKnown ? 20 : 5,     // Unique referring domains
        domainRating: isWellKnown ? 25 : 10,        // Domain Rating (0-100)
        domainAuthority: isWellKnown ? 25 : 10      // Domain Authority (0-100)
    };
}
```

**Heuristics:**
- **Well-known domains**: Assumes some backlink profile
  - 100 total backlinks
  - 20 referring domains
  - DR/DA of 25 (low-medium)
- **Other domains**: Assumes minimal backlinks
  - 10 total backlinks
  - 5 referring domains
  - DR/DA of 10 (very low)

**Why these values?**
- Conservative estimates (low scores won't hurt)
- DR/DA of 25 is below average (won't inflate AI Trust score)
- Based on typical small business backlink profiles

---

### 3. Moz Metrics Estimates (`getEstimatedMetrics`)

**Location:** `lib/modules/moz.ts`

**Logic:**
```typescript
function getEstimatedMetrics(): MozMetrics {
    return {
        domainAuthority: 0,      // Always 0 (unknown)
        pageAuthority: 0,        // Always 0 (unknown)
        spamScore: 0,            // Always 0 (unknown)
        linkingDomains: 0,       // Always 0 (unknown)
        inboundLinks: 0,         // Always 0 (unknown)
        rootDomainsToPage: 0     // Always 0 (unknown)
    };
}
```

**Heuristics:**
- All values set to **0** (unknown/not available)
- Used when Moz API is not configured
- Scoring system treats 0 as "no data" and uses estimates from API Manager instead

---

### 4. PageSpeed Estimates

**Location:** `lib/modules/pagespeed.ts`

**Logic:**
```typescript
// When PageSpeed API fails or rate limited
return {
    performanceScore: 50,        // Middle score
    accessibilityScore: 70,        // Slightly above average
    seoScore: 70,                 // Slightly above average
    bestPracticesScore: 60,       // Slightly above average
    lcp: 3.0,                     // Needs improvement
    fid: 150,                     // Needs improvement
    cls: 0.15,                    // Needs improvement
    mobileScore: 50,              // Middle score
    isEstimate: true              // Flagged as estimate
};
```

**Heuristics:**
- **Conservative middle-range values**
- Performance: 50/100 (average)
- LCP: 3.0s (needs improvement threshold)
- CLS: 0.15 (needs improvement threshold)
- These won't inflate or deflate scores significantly

---

## When Estimates Are Used

### 1. **Keywords:**
- ✅ Ahrefs API not configured
- ✅ Ahrefs API returns "No keywords found"
- ✅ Ahrefs API authentication fails
- ✅ DataForSEO not configured (after Ahrefs fails)

### 2. **Backlinks:**
- ✅ Common Crawl returns empty (Index API limitation) → **NOT estimates, actual empty data**
- ✅ Moz API not configured (after Common Crawl returns empty)
- ✅ Moz API authentication fails
- ✅ **Only then** → Estimates are used as final fallback

### 3. **PageSpeed:**
- ✅ Google PageSpeed API rate limited
- ✅ Google PageSpeed API fails
- ✅ API key not configured

---

## Impact on Scoring

### Keyword Visibility Score (25 points)
- **With estimates:** ~16/25 (64%)
  - Based on: 50 keywords, 5 in top 10, avg position 35
  - This is a **moderate score** - not great, not terrible

### AI Trust Score (25 points)
- **With estimates:** ~8/25 (32%)
  - Based on: 20 referring domains, DR/DA of 25
  - This is a **low score** - reflects lack of real data

### Website Technical Score (18 points)
- **With PageSpeed estimates:** ~10/18 (56%)
  - Based on: LCP 3.0s, CLS 0.15, performance 50
  - This is a **moderate score** - reflects average performance

---

## Example: msig-thai.com

**Current Results (with estimates):**
```
Keywords: 50 (source: estimate)
  - Total: 50
  - Top 10: 5
  - Avg Position: 35
  - Traffic: 500/month

Backlinks: 100 (20 domains, source: estimate)
  - Total: 100
  - Referring Domains: 20
  - DR/DA: 25

Scores:
  - Keyword Visibility: 16/25 (64%)
  - AI Trust: 8/25 (32%)
  - Total: 56/100
```

**If Moz API was configured:**
```
Backlinks: [Real data from Moz]
  - Total: [Actual count]
  - Referring Domains: [Actual count]
  - DA: [Actual DA score]

Scores:
  - AI Trust: [Higher score based on real data]
  - Total: [Higher overall score]
```

---

## Limitations of Estimates

1. **Not Accurate:**
   - Estimates are generic heuristics
   - Don't reflect actual SEO performance
   - Can't replace real API data

2. **Conservative by Design:**
   - Won't inflate scores unrealistically
   - May underestimate good sites
   - May overestimate poor sites

3. **Same for All Sites:**
   - All `.com` domains get same estimates
   - Doesn't account for industry, size, or actual performance
   - No differentiation between sites

---

## Common Crawl: Not Estimates, But Empty Data

### Important Distinction

**Common Crawl does NOT provide estimates** - it provides **actual empty data** (0 backlinks, 0 referring domains) due to the Index API limitation.

### How Common Crawl Works

**Location:** `lib/modules/commoncrawl.ts`

**What it returns:**
```typescript
{
    backlinks: 0,              // Actual 0 (not an estimate)
    referringDomains: 0,       // Actual 0 (not an estimate)
    domainRating: 0,           // Always 0 (not available from Common Crawl)
    anchorText: [],            // Empty array
    error: 'Common Crawl Index API does not support reverse lookups...'
}
```

**Why it returns empty:**
- Common Crawl Index API **cannot find backlinks directly**
- The Index API only finds pages BY URL pattern, not pages that link TO a domain
- This is a **fundamental limitation** of the Index API, not a bug

**Fallback Chain:**
```
1. Common Crawl → Returns empty (0 backlinks, 0 domains)
   ↓
2. Moz API → Tries to get real data
   ↓ (if Moz not configured or fails)
3. Estimates → Uses generateBacklinkEstimates()
```

### Common Crawl vs Estimates

| Aspect | Common Crawl | Estimates |
|--------|-------------|-----------|
| **Type** | Actual API call | Heuristic calculation |
| **Returns** | Empty data (0s) | Calculated values (100 backlinks, 20 domains) |
| **Reason** | Index API limitation | No API data available |
| **Source** | `commoncrawl` | `estimate` |
| **In scoring** | Treated as "no data" | Treated as "estimated data" |

### Example Flow

**For msig-thai.com:**

1. **Common Crawl tries first:**
   ```
   Common Crawl → 0 backlinks, 0 referring domains
   (Actual empty data, not an estimate)
   ```

2. **Moz API tries next:**
   ```
   Moz API → Not configured
   (Falls back to estimates)
   ```

3. **Estimates used:**
   ```
   Estimates → 100 backlinks, 20 referring domains, DR/DA 25
   (Heuristic calculation based on domain type)
   ```

**Result in API Manager:**
```typescript
{
    backlinks: {
        total: 100,              // From estimates
        referringDomains: 20,    // From estimates
        domainRating: 25,        // From estimates
        domainAuthority: 25      // From estimates
    },
    source: {
        backlinks: 'estimate'    // Final source is estimates
    }
}
```

### Why This Matters

- **Common Crawl empty data** = "We tried but couldn't find any"
- **Estimates** = "We're guessing based on domain type"

The system correctly distinguishes between:
- ✅ **No data found** (Common Crawl: 0 backlinks)
- ✅ **Estimated data** (Estimates: 100 backlinks for .com domains)

---

## Recommendations

### For Accurate Scores:
1. **Configure Moz API** (free tier: 2,500 calls/month)
   - Provides real DA, PA, and backlink counts
   - Significantly improves AI Trust score accuracy

2. **Configure Ahrefs API** (paid plan required)
   - Provides real keyword data, positions, traffic
   - Significantly improves Keyword Visibility score accuracy

3. **Configure DataForSEO** (pay-per-use)
   - Alternative to Ahrefs for keyword data
   - Good fallback option

### For Development/Testing:
- Estimates are fine for testing the system
- Allow development without API costs
- Provide baseline functionality

---

## Summary

**Estimation Strategy:**
- ✅ Conservative (won't inflate scores)
- ✅ Simple heuristics (domain-based)
- ✅ Always available (no API required)
- ⚠️ Not accurate (generic values)
- ⚠️ Same for similar domains

**Best Practice:**
- Use estimates for development/testing
- Configure APIs for production accuracy
- System gracefully degrades when APIs fail

