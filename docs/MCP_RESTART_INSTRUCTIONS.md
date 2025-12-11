# MCP Server Restart Instructions

## ✅ JSON Configuration Fixed

I've fixed the indentation issue in your `mcp.json` file. The configuration is now correct:

```json
{
  "mcpServers": {
    "render": { ... },
    "perplexity": { ... },
    "vercel": { ... },
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

## 🔄 Next Steps: Restart Cursor

**IMPORTANT:** You must restart Cursor completely for the MCP server to load:

### Step 1: Quit Cursor Completely
- **Mac:** `Cmd + Q` (or Cursor → Quit Cursor)
- **Windows/Linux:** `Alt + F4` (or File → Exit)

### Step 2: Wait 5 Seconds
Let Cursor fully close before reopening.

### Step 3: Reopen Cursor
- Open Cursor normally
- Wait 30-60 seconds for MCP servers to initialize

### Step 4: Verify MCP Server is Running

1. **Check MCP Status:**
   - Open Settings (`Cmd/Ctrl + ,`)
   - Search for "MCP" or go to Features → MCP
   - Look for `ahrefs` in the list
   - Status should show "Connected" or "Running"

2. **Check Available Tools:**
   - The Ahrefs MCP tools should now be available
   - You should see tools like:
     - `mcp_ahrefs_site-explorer-domain-rating`
     - `mcp_ahrefs_site-explorer-organic-keywords`
     - `mcp_ahrefs_site-explorer-backlinks-stats`
     - etc.

### Step 5: Test the Connection

After restarting, try this prompt:
```
"Use Ahrefs MCP to get domain rating for ahrefs.com"
```

If it works, you'll see the domain rating. If you still get errors:
- Check MCP server status in settings
- Look for error messages in Cursor's developer console
- Verify the API key is correct

## 🧪 Testing theconductor.co

Once MCP is working, you can query:

```
"Use Ahrefs MCP to query theconductor.co and get:
1. Domain rating
2. Top 10 organic keywords with positions  
3. Backlinks count and referring domains"
```

**Note:** If you get "Insufficient plan" errors for custom domains like `theconductor.co`, that means you need Enterprise plan. Test domains (`ahrefs.com`, `wordcount.com`) work with any plan.

## 📋 Troubleshooting

If MCP still doesn't work after restart:

1. **Check MCP Server Installation:**
   ```bash
   npx -y @modelcontextprotocol/server-ahrefs --version
   ```

2. **Check Node.js Version:**
   ```bash
   node --version  # Should be 18+
   ```

3. **Check Cursor Logs:**
   - `Cmd/Ctrl + Shift + P` → "Developer: Toggle Developer Tools"
   - Check Console tab for MCP errors

4. **Try Manual Installation:**
   ```bash
   npm install -g @modelcontextprotocol/server-ahrefs
   ```

## ✅ Success Indicators

You'll know MCP is working when:
- ✅ Ahrefs shows as "Connected" in MCP settings
- ✅ Ahrefs tools appear in available tools list
- ✅ You can query `ahrefs.com` successfully
- ✅ No 401 authentication errors

## 🎯 After MCP is Working

Once MCP is connected, you can:
1. Query any domain (if Enterprise plan) or test domains (any plan)
2. Get comprehensive SEO data
3. Use the data in your application
4. Export results for analysis

Let me know once you've restarted Cursor and we can test the connection!



