# Using Ahrefs API v3 via MCP (Model Context Protocol)

## Overview

MCP (Model Context Protocol) allows you to access Ahrefs API v3 through your AI assistant (like Cursor). This is great for:
- ✅ Testing and development
- ✅ One-off queries
- ✅ When you have MCP configured but not Enterprise plan

## How MCP Works

MCP is a protocol that allows AI assistants to call external APIs. When you use Cursor with MCP configured, the AI can make Ahrefs API calls on your behalf.

## Setup

### 1. Configure Ahrefs MCP Server

In your Cursor settings (or MCP configuration), add:

```json
{
  "mcpServers": {
    "ahrefs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-ahrefs"],
      "env": {
        "AHREFS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 2. Verify MCP is Working

Ask Cursor to test:
```
"Can you query Ahrefs for theconductor.co organic keywords?"
```

The AI will use MCP to call:
```
mcp_ahrefs_site-explorer-organic-keywords
```

## Available MCP Tools

### 1. Organic Keywords
```typescript
mcp_ahrefs_site-explorer-organic-keywords({
  target: "theconductor.co",
  mode: "domain",
  country: "us",
  date: "2024-12-04",
  select: "keyword,best_position,sum_traffic,is_informational,is_commercial,is_transactional,is_navigational",
  limit: 100
})
```

### 2. Domain Rating
```typescript
mcp_ahrefs_site-explorer-domain-rating({
  target: "theconductor.co",
  date: "2024-12-04"
})
```

### 3. Backlinks Stats
```typescript
mcp_ahrefs_site-explorer-backlinks-stats({
  target: "theconductor.co",
  mode: "domain",
  date: "2024-12-04"
})
```

### 4. Site Metrics
```typescript
mcp_ahrefs_site-explorer-metrics({
  target: "theconductor.co",
  mode: "domain",
  date: "2024-12-04"
})
```

### 5. SERP Overview
```typescript
mcp_ahrefs_serp-overview-serp-overview({
  keyword: "seo tools",
  country: "us",
  select: "url,position,title",
  top_positions: 10
})
```

## Using MCP in Your Application

### Option 1: AI-Assisted Queries (Recommended)

Since MCP is for AI assistants, you can:

1. **Ask Cursor to query data:**
   ```
   "Query Ahrefs for theconductor.co keywords and save to a file"
   ```

2. **Use AI to generate API calls:**
   ```
   "Generate a script that uses Ahrefs MCP to analyze theconductor.co"
   ```

### Option 2: Hybrid Approach

Keep direct API calls for production, use MCP for:
- Development/testing
- One-off analysis
- Data exploration

## Testing with theconductor.co

### Example: Get Keywords

Ask Cursor:
```
"Use Ahrefs MCP to get organic keywords for theconductor.co and show me the top 10"
```

The AI will execute:
```typescript
const result = await mcp_ahrefs_site-explorer-organic-keywords({
  target: "theconductor.co",
  mode: "domain",
  country: "us",
  date: "2024-12-04",
  select: "keyword,best_position,sum_traffic",
  limit: 10
});
```

### Example: Get Backlinks

Ask Cursor:
```
"Get backlink stats for theconductor.co using Ahrefs MCP"
```

## MCP vs Direct API

| Feature | MCP | Direct API |
|---------|-----|------------|
| **Access** | Through AI assistant | Direct HTTP calls |
| **Use Case** | Development, testing | Production code |
| **Plan Required** | Works with your plan | Enterprise for custom domains |
| **Integration** | AI context only | Application code |
| **Best For** | Exploration, one-offs | Automated workflows |

## Converting MCP Responses

The `lib/modules/ahrefs-mcp.ts` file includes helpers to convert MCP responses to your application format:

```typescript
import { convertMCPKeywordsResponse } from '@/lib/modules/ahrefs-mcp';

// In AI context, get MCP response
const mcpResponse = await mcp_ahrefs_site-explorer-organic-keywords({...});

// Convert to your format
const metrics = convertMCPKeywordsResponse(mcpResponse);
```

## Limitations

1. **MCP is for AI context** - Can't call directly from application code
2. **Rate limits** - Still subject to Ahrefs API rate limits
3. **Plan restrictions** - Same plan limitations apply
4. **Not for production** - Use direct API for production workflows

## Recommendations

### For Development:
✅ Use MCP via Cursor for quick queries and testing

### For Production:
✅ Use direct API calls (when you have Enterprise plan)
✅ Or use DataForSEO/Moz APIs (already integrated)

## Next Steps

1. **Test MCP:** Ask Cursor to query Ahrefs for theconductor.co
2. **Verify Setup:** Make sure MCP server is configured correctly
3. **Use for Development:** Leverage MCP for testing and exploration
4. **Plan Production:** Decide on direct API vs alternative APIs for production

---

## Quick Test

Try asking Cursor:
```
"Can you use Ahrefs MCP to get the domain rating for theconductor.co?"
```

If it works, you'll see the DR value. If you get 401 errors, check your MCP server configuration.




