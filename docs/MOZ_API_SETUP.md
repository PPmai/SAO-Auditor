# Moz API Setup Guide

## Overview

Moz API provides Domain Authority (DA), Page Authority (PA), and backlink counts. It's used as a fallback after Common Crawl in the API manager chain.

## Getting Your Moz API Token (Free Tier)

1. **Sign up for Moz API**
   - Visit: https://moz.com/products/api
   - Sign up for a free account
   - **Note**: As of March 2024, Moz requires a valid credit card on file for Free Tier (but won't charge you)

2. **Get Your API Token**
   - After signing up, go to your Moz account dashboard
   - Navigate to API section
   - Copy your API token (it looks like: `moz-xxxx-xxxx-xxxx`)

3. **Add to .env**
   ```bash
   MOZ_API_TOKEN=your_moz_api_token_here
   ```

## Free Tier Limits

- **2,500 API calls per month**
- Domain Authority (DA) and Page Authority (PA)
- Linking domains count
- Inbound links count
- Spam score

## Integration in SAO Auditor

The Moz API is automatically used in the fallback chain:

```
Backlinks: Common Crawl → Moz API → Estimates
```

When Common Crawl returns empty (due to Index API limitation), the system automatically falls back to Moz API if configured.

## Testing

Run the comprehensive test script:
```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-all-features.ts
```

This will test:
- Common Crawl integration
- Moz API integration
- API Manager fallback chain
- Full scoring system

## Troubleshooting

### Error: "Invalid Moz API token"
- Check that `MOZ_API_TOKEN` is set in `.env`
- Verify the token is correct (no extra spaces)
- Ensure your Moz account is active

### Error: "Moz API rate limit exceeded"
- You've exceeded 2,500 calls/month
- Wait for next month or upgrade plan
- System will fall back to estimates

### No data returned
- Check your Moz account has API access enabled
- Verify the URL format is correct
- Check Moz API status page for outages

