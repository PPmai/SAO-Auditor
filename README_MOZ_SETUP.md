# Quick Setup: Moz API for Backlink Data

## Current Status

✅ **Common Crawl Integration**: Complete (but has Index API limitation)  
❌ **Moz API**: Not configured  
⚠️ **Current Backlink Source**: Estimates (fallback)

## Why Configure Moz API?

The Common Crawl Index API has a limitation - it cannot find backlinks directly (reverse lookups). When Common Crawl returns empty, the system needs to fall back to Moz API for actual backlink data.

**Current Flow:**
```
Common Crawl → Returns empty → Moz API (not configured) → Estimates
```

**After Moz Setup:**
```
Common Crawl → Returns empty → Moz API (✅ configured) → Real backlink data!
```

## Quick Setup (3 Steps)

### Step 1: Get Your Moz API Token

1. Visit: **https://moz.com/products/api**
2. Sign up for a **free account**
   - ⚠️ Note: Requires credit card (won't be charged for free tier)
   - Free tier: 2,500 API calls/month
3. Copy your API token from the dashboard

### Step 2: Add Token to .env

**Option A: Use the setup script**
```bash
./scripts/setup-moz-api.sh
```

**Option B: Manual edit**
Edit `.env` and add:
```bash
MOZ_API_TOKEN=your_moz_api_token_here
```

### Step 3: Test It

Run the comprehensive test:
```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-all-features.ts
```

You should see:
```
🔗 TEST 3: Moz API Integration
   ✅ Domain Authority (DA): [real number]
   ✅ Page Authority (PA): [real number]
   ✅ Linking Domains: [real number]
   ✅ Inbound Links: [real number]
```

## What You Get

With Moz API configured, you'll get:

- ✅ **Domain Authority (DA)**: 0-100 score
- ✅ **Page Authority (PA)**: 0-100 score  
- ✅ **Linking Domains**: Count of unique domains linking to you
- ✅ **Inbound Links**: Total backlink count
- ✅ **Spam Score**: 0-17 (lower is better)

## Test Results for msig-thai.com

After setup, run the test and you should see real Moz data instead of estimates.

## Troubleshooting

**"Invalid Moz API token"**
- Check token is correct (no extra spaces)
- Verify token in Moz dashboard

**"Moz API rate limit exceeded"**
- You've used 2,500 calls this month
- Wait for next month or upgrade plan

**Still showing estimates**
- Restart your dev server after adding token
- Check `.env` file is loaded correctly

## Documentation

- Full guide: `docs/MOZ_API_SETUP.md`
- Test script: `scripts/test-all-features.ts`

