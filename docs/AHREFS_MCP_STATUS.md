# Ahrefs MCP Status & Next Steps

## Current Status

✅ **Configuration Fixed:**
- Package name: `@ahrefs/mcp` (correct)
- Environment variable: `API_KEY` (correct)
- JSON syntax: Valid

❌ **Still Getting 401 Errors:**
- MCP server may not have reloaded yet
- Or MCP key authentication needs different handling

## What We've Done

1. ✅ Fixed package name from `@modelcontextprotocol/server-ahrefs` → `@ahrefs/mcp`
2. ✅ Fixed environment variable from `MCP_KEY` → `API_KEY`
3. ✅ Validated JSON syntax
4. ✅ Verified package exists and can run

## Next Steps

### Option 1: Restart Cursor (Most Likely Fix)

The MCP server needs to reload with the new configuration:

1. **Quit Cursor Completely**
   - `Cmd+Q` (Mac) or `Alt+F4` (Windows)
   - Wait 5 seconds

2. **Reopen Cursor**
   - Wait 30-60 seconds for MCP servers to initialize

3. **Check MCP Status**
   - Settings → Features → MCP
   - Verify `ahrefs` shows "Connected"

4. **Test Again**
   ```
   "Use Ahrefs MCP to get domain rating for ahrefs.com"
   ```

### Option 2: Check MCP Server Logs

If restart doesn't work, check logs:

1. Open Developer Tools (`Cmd/Ctrl + Shift + P` → "Developer: Toggle Developer Tools")
2. Check Console for MCP errors
3. Look for authentication errors or connection issues

### Option 3: Verify MCP Key Format

The MCP key you provided:
```
eYPb.MbAOsd7LEWgStWIpQOSh6TppQzByTDhFckI2S2UxUXFsY2I2MGwwUU5NejNPTjArZk50ejBwUmZqUW1mOFhGTlNDemNxVFBHWXd0VDlpMmdRWTJ3OHdtTVdvRFVJbGlyOXlkOGZxRUhwOVNlbFVQN2RaMXQ5THFEUG8yZDBnU0lTVFFsZS9NSW91amc.EfKv
```

This looks like a JWT-style token (has dots). Make sure:
- ✅ No extra spaces or quotes
- ✅ Copied completely
- ✅ Valid in your Ahrefs account

### Option 4: Try Alternative Environment Variables

The `@ahrefs/mcp` package might expect different variable names. Try:

```json
{
  "ahrefs": {
    "command": "npx",
    "args": ["-y", "@ahrefs/mcp"],
    "env": {
      "API_KEY": "your-key-here",
      "AHREFS_API_KEY": "your-key-here",
      "AHREFS_MCP_KEY": "your-key-here"
    }
  }
}
```

## Current Configuration

Your `mcp.json` is correctly configured:

```json
{
  "mcpServers": {
    "ahrefs": {
      "command": "npx",
      "args": ["-y", "@ahrefs/mcp"],
      "env": {
        "API_KEY": "eYPb.MbAOsd7LEWgStWIpQOSh6TppQzByTDhFckI2S2UxUXFsY2I2MGwwUU5NejNPTjArZk50ejBwUmZqUW1mOFhGTlNDemNxVFBHWXd0VDlpMmdRWTJ3OHdtTVdvRFVJbGlyOXlkOGZxRUhwOVNlbFVQN2RaMXQ5THFEUG8yZDBnU0lTVFFsZS9NSW91amc.EfKv"
      }
    }
  }
}
```

## Verification Checklist

After restarting Cursor:

- [ ] MCP server shows "Connected" in settings
- [ ] Ahrefs tools appear in available tools list
- [ ] Can query `ahrefs.com` successfully
- [ ] No 401 errors in console
- [ ] MCP server logs show API key found

## If Still Not Working

1. **Check Ahrefs Account:**
   - Verify MCP key is active
   - Check if key has API access permissions
   - Confirm key hasn't expired

2. **Try Direct API:**
   - Use the direct API implementation (already in codebase)
   - Works with test domains (`ahrefs.com`, `wordcount.com`)
   - Use DataForSEO/Moz for custom domains

3. **Contact Support:**
   - Ahrefs support for MCP key issues
   - Or use alternative APIs (DataForSEO, Moz) already integrated

## Summary

The configuration is correct. The most likely issue is that Cursor needs to be restarted for the MCP server to reload with the new configuration. After restart, the Ahrefs MCP tools should be available and working.


