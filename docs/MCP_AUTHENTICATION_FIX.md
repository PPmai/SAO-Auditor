# Fixing Ahrefs MCP 401 Authentication Error

## Problem
Getting `401: Request failed with status code 401` when using Ahrefs MCP tools.

## Solution

The MCP server needs your Ahrefs API key configured. Here's how to fix it:

### Option 1: Configure MCP Server in Cursor Settings

1. **Open Cursor Settings**
   - Cursor → Settings → Features → MCP

2. **Add/Update Ahrefs MCP Server Configuration**

   ```json
   {
     "mcpServers": {
       "ahrefs": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-ahrefs"],
         "env": {
           "AHREFS_API_KEY": "H5KwGVYd24n7Wx845W8PWr5YbF2nC6jNZTGBkCfN"
         }
       }
     }
   }
   ```

3. **Restart Cursor** after making changes

### Option 2: Use Direct API Calls Instead

Since you have the API key in `.env`, you can use the direct API implementation:

```typescript
// This already works with your .env API key
import { getUrlKeywords, getBacklinkMetrics } from '@/lib/modules/ahrefs';

const keywords = await getUrlKeywords('https://theconductor.co');
const backlinks = await getBacklinkMetrics('theconductor.co');
```

### Option 3: Test MCP Server Manually

Check if MCP server is running:
```bash
# Check MCP server status
# The server should be running when Cursor starts
```

## Verification

After configuring, test with:
```
"Use Ahrefs MCP to get domain rating for ahrefs.com"
```

If it works with `ahrefs.com` (test domain), then MCP is configured correctly.

## Alternative: Use Direct API

Since you have `AHREFS_API_KEY` in your `.env`, the direct API implementation in `lib/modules/ahrefs.ts` should work for test domains (`ahrefs.com`, `wordcount.com`).

For `theconductor.co`, you'll need Enterprise plan OR use alternative APIs (DataForSEO, Moz) that are already integrated.




