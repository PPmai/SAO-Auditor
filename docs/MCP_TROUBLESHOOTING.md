# MCP Authentication Troubleshooting

## Current Issue: 401 Authentication Errors

Even after configuring MCP authentication, we're still getting 401 errors. Here's how to fix it:

## Step 1: Verify MCP Server Configuration

### Check Cursor Settings

1. **Open Cursor Settings**
   - `Cmd/Ctrl + ,` → Search for "MCP"
   - Or: Cursor → Settings → Features → MCP

2. **Verify Ahrefs MCP Server is Listed**
   - Should see `ahrefs` in the list of MCP servers
   - Status should be "Connected" or "Running"

3. **Check Configuration Format**

   The configuration should look like this:
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

## Step 2: Restart Cursor

**Critical:** After changing MCP configuration, you MUST restart Cursor completely:

1. Quit Cursor completely (`Cmd+Q` on Mac, `Alt+F4` on Windows)
2. Wait 5 seconds
3. Reopen Cursor
4. Wait for MCP servers to initialize (check status in settings)

## Step 3: Verify API Key

### Check API Key Format

Your API key should be:
- ✅ `H5KwGVYd24n7Wx845W8PWr5YbF2nC6jNZTGBkCfN` (32 characters)
- ❌ No spaces or quotes
- ❌ No `Bearer` prefix

### Verify API Key Works

Test the API key directly:
```bash
# From project root
API_KEY=$(grep AHREFS_API_KEY .env | cut -d '=' -f2)
curl -H "Authorization: Bearer $API_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/domain-rating?target=ahrefs.com&date=2024-12-04"
```

If this works, the API key is valid. If not, check your Ahrefs account.

## Step 4: Check MCP Server Logs

1. **Open Cursor Developer Tools**
   - `Cmd/Ctrl + Shift + P` → "Developer: Toggle Developer Tools"
   - Or: View → Developer → Developer Tools

2. **Check Console for MCP Errors**
   - Look for errors related to "ahrefs" or "MCP"
   - Check if MCP server is starting correctly

## Step 5: Alternative MCP Server Setup

If the standard setup doesn't work, try:

### Option A: Use Full Path to MCP Server

```json
{
  "mcpServers": {
    "ahrefs": {
      "command": "node",
      "args": [
        "/path/to/node_modules/@modelcontextprotocol/server-ahrefs/dist/index.js"
      ],
      "env": {
        "AHREFS_API_KEY": "H5KwGVYd24n7Wx845W8PWr5YbF2nC6jNZTGBkCfN"
      }
    }
  }
}
```

### Option B: Install MCP Server Locally

```bash
npm install -g @modelcontextprotocol/server-ahrefs
```

Then use:
```json
{
  "mcpServers": {
    "ahrefs": {
      "command": "mcp-server-ahrefs",
      "env": {
        "AHREFS_API_KEY": "H5KwGVYd24n7Wx845W8PWr5YbF2nC6jNZTGBkCfN"
      }
    }
  }
}
```

## Step 6: Verify MCP Server is Running

After restarting Cursor, check:

1. **MCP Server Status**
   - Settings → Features → MCP
   - Should show "Connected" for ahrefs

2. **Test with Simple Query**
   ```
   "What MCP servers are available?"
   ```

3. **Check if Ahrefs Tools are Available**
   ```
   "List available Ahrefs MCP tools"
   ```

## Step 7: Test Authentication

Once MCP is running, test with:

```
"Use Ahrefs MCP to get domain rating for ahrefs.com"
```

If this works, MCP is configured correctly. If you still get 401:
- Double-check API key in MCP config matches .env
- Verify API key is active in Ahrefs account
- Check Ahrefs account has API access enabled

## Common Issues

### Issue: "MCP server not found"
**Solution:** Install the MCP server package:
```bash
npm install -g @modelcontextprotocol/server-ahrefs
```

### Issue: "401 Unauthorized"
**Solutions:**
1. Verify API key is correct (no extra spaces)
2. Restart Cursor completely
3. Check API key is active in Ahrefs dashboard
4. Verify your Ahrefs plan supports API access

### Issue: "MCP server not starting"
**Solutions:**
1. Check Node.js is installed: `node --version`
2. Check npm is working: `npm --version`
3. Try installing MCP server globally
4. Check Cursor logs for errors

## Verification Checklist

- [ ] MCP server listed in Cursor settings
- [ ] MCP server status shows "Connected"
- [ ] API key matches .env file (no spaces/quotes)
- [ ] Cursor restarted after configuration
- [ ] API key works with direct curl test
- [ ] Test domain (ahrefs.com) works
- [ ] Custom domain (theconductor.co) works (if Enterprise plan)

## Next Steps

Once MCP is working:
1. Test with `ahrefs.com` (should work with any plan)
2. Test with `theconductor.co` (requires Enterprise plan)
3. If Enterprise plan: All domains work
4. If non-Enterprise: Only test domains work

## Fallback Options

If MCP still doesn't work:
1. ✅ Use direct API calls (already implemented)
2. ✅ Use DataForSEO API (already integrated)
3. ✅ Use Moz API (already integrated)
4. ✅ Use Google Search Console (already integrated)

The application will automatically fall back to these alternatives.




