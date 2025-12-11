# Ahrefs API Plan Guide - What You Can Use

## 🔍 Current Status

Based on testing, your Ahrefs API key is **configured correctly**, but you're on a **non-Enterprise plan**. Here's what you can and cannot do:

---

## ✅ **What WORKS (Free Testing)**

Ahrefs allows **free API testing** (no units consumed) for these test domains:
- `ahrefs.com`
- `wordcount.com`

### Available Endpoints for Test Domains:

#### 1. **Domain Rating** ✅
```bash
GET /v3/site-explorer/domain-rating?target=ahrefs.com&date=YYYY-MM-DD
```
**Returns:** Domain Rating and Ahrefs Rank

#### 2. **Organic Keywords** ✅
```bash
GET /v3/site-explorer/organic-keywords?target=ahrefs.com&mode=domain&country=us&date=YYYY-MM-DD&select=keyword,best_position,sum_traffic&limit=10
```
**Returns:** List of keywords with positions and traffic

#### 3. **Backlinks Stats** ✅
```bash
GET /v3/site-explorer/backlinks-stats?target=ahrefs.com&mode=domain&date=YYYY-MM-DD
```
**Returns:** Total backlinks, referring domains, domain rating

#### 4. **Site Explorer Metrics** ✅
```bash
GET /v3/site-explorer/metrics?target=ahrefs.com&mode=domain&date=YYYY-MM-DD
```
**Returns:** Comprehensive domain metrics

---

## ❌ **What DOESN'T WORK (Requires Enterprise)**

### For Custom Domains (like `theconductor.co`):
- ❌ `site-explorer/organic-keywords` - "Insufficient plan"
- ❌ `site-explorer/backlinks-stats` - "Insufficient plan"
- ❌ `site-explorer/domain-rating` - "Insufficient plan"
- ❌ `site-explorer/metrics` - "Insufficient plan"
- ❌ `keywords-explorer/*` - "Insufficient plan"
- ❌ `serp-overview/*` - Likely requires Enterprise

---

## 📊 **Plan Comparison**

### Current Plan (Non-Enterprise)
- ✅ API key works
- ✅ Can test with `ahrefs.com` and `wordcount.com` (free, no units)
- ❌ Cannot query custom domains
- ❌ Cannot use most endpoints for real data

### Enterprise Plan ($999+/month)
- ✅ Full API access
- ✅ All endpoints available
- ✅ Query any domain
- ✅ 2,000,000 API units included
- ✅ Additional units can be purchased

---

## 🛠️ **Workarounds & Alternatives**

### Option 1: Use Test Domains for Development
You can use `ahrefs.com` or `wordcount.com` to:
- Test API integration
- Develop and debug code
- Learn API structure
- Build features (then switch to Enterprise for production)

### Option 2: Use Alternative APIs
For production use without Enterprise plan, consider:

1. **DataForSEO API** (Already integrated)
   - Pay-per-use (~$50/month for moderate usage)
   - Keyword rankings, SERP data
   - Works with any domain

2. **Moz API** (Already integrated)
   - Starter plan: $5/month
   - Domain Authority, Page Authority
   - Backlink data

3. **Google Search Console API** (Already integrated)
   - Free (requires GSC access)
   - Your own site's keyword data
   - Click-through rates, impressions

### Option 3: Upgrade to Enterprise
If you need Ahrefs data for custom domains:
- Contact Ahrefs sales
- Enterprise plan: $999+/month
- Includes 2M API units
- Full API access

---

## 🧪 **Testing Your Current Setup**

### Test Script (Works with Test Domains)
```bash
# Test with ahrefs.com (free)
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-ahrefs.ts
```

### Manual API Test
```bash
# Get API key
API_KEY=$(grep AHREFS_API_KEY .env | cut -d '=' -f2)
DATE=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d '1 day ago' +%Y-%m-%d)

# Test domain rating (works with test domains)
curl -H "Authorization: Bearer $API_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/domain-rating?target=ahrefs.com&date=$DATE"

# Test organic keywords (works with test domains)
curl -H "Authorization: Bearer $API_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/organic-keywords?target=ahrefs.com&mode=domain&country=us&date=$DATE&select=keyword,best_position,sum_traffic&limit=10"
```

---

## 💡 **Recommendations**

### For Development:
1. ✅ **Keep Ahrefs API integration** - Use test domains (`ahrefs.com`) for development
2. ✅ **Use DataForSEO** - For real keyword data in production
3. ✅ **Use Moz API** - For backlink/authority data
4. ✅ **Use GSC API** - For your own site's data

### For Production:
1. **If budget allows:** Upgrade to Ahrefs Enterprise ($999+/month)
2. **If budget limited:** Use DataForSEO + Moz combination (~$55/month)
3. **Best value:** GSC (free) + DataForSEO + Moz (~$55/month)

---

## 📝 **Current Implementation Status**

Your codebase already has:
- ✅ Ahrefs API integration (ready for Enterprise)
- ✅ DataForSEO integration (works now)
- ✅ Moz API integration (works now)
- ✅ Google Search Console integration (works now)
- ✅ Cascading fallback system (tries Ahrefs → DataForSEO → Moz → Estimates)

**The system will automatically:**
1. Try Ahrefs first (if Enterprise plan)
2. Fall back to DataForSEO for keywords
3. Fall back to Moz for backlinks
4. Use estimates if no APIs available

---

## 🔗 **Next Steps**

1. **For Testing:** Use `ahrefs.com` or `wordcount.com` as test domains
2. **For Production:** 
   - Option A: Upgrade to Ahrefs Enterprise
   - Option B: Use DataForSEO + Moz (already integrated)
3. **Monitor:** Check which API provides best data for your use case

---

## 📚 **Resources**

- [Ahrefs API v3 Documentation](https://docs.ahrefs.com/)
- [Ahrefs API v3 Plan Requirements](https://help.ahrefs.com/en/articles/6559232-about-api-v3-for-enterprise-plan)
- [Ahrefs Pricing](https://ahrefs.com/pricing)
- [DataForSEO Documentation](https://docs.dataforseo.com/)
- [Moz API Documentation](https://moz.com/products/api)





