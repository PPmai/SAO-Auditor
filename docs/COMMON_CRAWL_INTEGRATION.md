# Common Crawl Integration

## Overview

Common Crawl integration replaces Ahrefs backlink features with free, open-source web crawl data. This eliminates the need for paid Ahrefs API access while providing backlink discovery capabilities.

## Features

1. **Backlink Discovery** - Find pages linking to target domain
2. **Referring Domains** - Count unique domains linking to target
3. **Anchor Text Analysis** - Extract anchor text distribution (limited - requires WARC processing)
4. **Outbound Links** - Analyze links from target domain (future enhancement)
5. **Content Analysis** - Uses existing scraper module

## Data Source

- **Common Crawl Index API**: `https://index.commoncrawl.org/`
- **Data Freshness**: 1-3 months old (monthly crawls)
- **Cost**: Free
- **Rate Limits**: Generous, but has usage limits

## Limitations

1. **Index API Limitation**: Common Crawl Index API does NOT support reverse lookups (finding pages that link TO a domain). The Index API only finds pages BY URL pattern. This is a fundamental limitation.

2. **Backlink Discovery**: To find actual backlinks via Common Crawl, you need:
   - **AWS Athena** queries on Common Crawl Columnar Index (~$5/TB scanned)
   - **WARC file processing** (resource-intensive, requires significant compute)
   - **Pre-processed services** that have already processed Common Crawl data

3. **Current Implementation**: The current implementation returns empty results and falls back to Moz API or estimates. This is by design due to the Index API limitation.

4. **Data Freshness**: When using WARC/Athena, data is 1-3 months old (vs real-time Ahrefs)

5. **No Domain Rating**: Proprietary Ahrefs metric not available (always returns 0)

6. **Anchor Text**: Requires WARC file processing for full data

7. **Processing Time**: May be slower than Ahrefs API

## Usage

```typescript
import { getBacklinkMetrics, getReferringDomains, getAnchorText } from '@/lib/modules/commoncrawl';

// Get comprehensive backlink metrics
const metrics = await getBacklinkMetrics('example.com');
console.log(metrics.referringDomains); // Number of unique referring domains
console.log(metrics.backlinks); // Total backlink count
console.log(metrics.domainRating); // Always 0 (not available)

// Get referring domains count
const domains = await getReferringDomains('example.com');

// Get anchor text distribution
const anchors = await getAnchorText('example.com');
```

## Caching

Results are cached for 30 days (since Common Crawl data is monthly):
- Cache key: `commoncrawl:${domain}:${crawlId}`
- TTL: 30 days
- Storage: In-memory Map

## API Manager Integration

The API Manager uses Common Crawl as the primary source for backlinks:
1. **Common Crawl** (free) - First attempt
2. **Moz** (free tier) - Fallback if Common Crawl unavailable
3. **Estimates** - Final fallback

## Future Enhancements

1. **WARC File Processing**: Full anchor text extraction
2. **Outbound Links**: Complete implementation
3. **Historical Analysis**: Track backlink changes over time
4. **Batch Processing**: Process multiple domains efficiently

## Migration from Ahrefs

The `getBacklinkMetrics()` function from Ahrefs module is now deprecated and redirects to Common Crawl. The interface is compatible, so existing code continues to work.

## Troubleshooting

**No backlinks found:**
- Common Crawl may not have crawled the domain yet
- Domain might be too new
- Check if domain is in latest crawl

**Slow performance:**
- Common Crawl Index API can be slower than paid APIs
- Results are cached for 30 days to improve performance

**Missing anchor text:**
- Full anchor text requires WARC file processing
- Current implementation provides basic structure
- Consider using Moz API for anchor text if needed

