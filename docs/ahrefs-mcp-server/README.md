# Ahrefs MCP Server

A Model Context Protocol (MCP) server for integrating Ahrefs SEO API with AI assistants like Cursor.

## Features

This MCP server provides 17 tools for comprehensive SEO analysis:

### Site Explorer Tools
- **ahrefs_domain_rating** - Get Domain Rating (DR) for any domain
- **ahrefs_site_metrics** - Get comprehensive SEO metrics overview
- **ahrefs_organic_keywords** - Get keywords a site ranks for
- **ahrefs_backlinks** - Get detailed backlink data
- **ahrefs_referring_domains** - Get unique referring domains
- **ahrefs_top_pages** - Get top-performing pages by traffic
- **ahrefs_organic_competitors** - Find organic search competitors
- **ahrefs_backlinks_stats** - Get backlink statistics summary
- **ahrefs_domain_rating_history** - Track DR over time
- **ahrefs_metrics_history** - Track traffic/keywords over time
- **ahrefs_broken_backlinks** - Find broken backlinks
- **ahrefs_anchors** - Analyze anchor text distribution
- **ahrefs_best_by_internal_links** - Find pages with most internal links

### Keywords Explorer Tools
- **ahrefs_keyword_overview** - Get metrics for specific keywords
- **ahrefs_keyword_ideas** - Get keyword ideas (matching terms)
- **ahrefs_related_keywords** - Get semantically related keywords

### SERP Analysis
- **ahrefs_serp_overview** - Get search results overview for keywords

### Utility
- **ahrefs_api_usage** - Check API usage and limits

## Prerequisites

- Node.js 18+ 
- Ahrefs Business plan with API access
- Ahrefs API key

## Getting Your Ahrefs API Key

1. Log in to your Ahrefs account
2. Go to **Account settings** → **API**
3. Generate a new API key or copy your existing one

## Installation

### Option 1: Clone from local directory

```bash
# Copy the server files to your projects directory
mkdir -p ~/projects/ahrefs-mcp-server
cp -r /path/to/ahrefs-mcp-server/* ~/projects/ahrefs-mcp-server/

# Install dependencies
cd ~/projects/ahrefs-mcp-server
npm install

# Build the server
npm run build
```

### Option 2: Manual setup

1. Create project directory:
```bash
mkdir ahrefs-mcp-server
cd ahrefs-mcp-server
```

2. Copy `package.json`, `tsconfig.json`, and `src/index.ts` to the directory

3. Install and build:
```bash
npm install
npm run build
```

## Configuration for Cursor

### Step 1: Locate Cursor Config File

The MCP settings file location varies by OS:

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

Alternatively, for newer Cursor versions, check:
- **macOS**: `~/.cursor/mcp.json`
- **Windows**: `%USERPROFILE%\.cursor\mcp.json`

### Step 2: Add Server Configuration

Add this to your MCP settings JSON file:

```json
{
  "mcpServers": {
    "ahrefs": {
      "command": "node",
      "args": ["/FULL/PATH/TO/ahrefs-mcp-server/dist/index.js"],
      "env": {
        "AHREFS_API_KEY": "your-ahrefs-api-key-here"
      }
    }
  }
}
```

**Important**: Replace `/FULL/PATH/TO/` with the actual absolute path to your server directory.

### Step 3: Restart Cursor

After saving the configuration, restart Cursor to load the MCP server.

## Usage Examples

Once configured, you can ask Claude in Cursor:

```
"What's the Domain Rating for conductor.co.th?"

"Show me the top 10 organic keywords for my competitor example.com in Thailand"

"Find all referring domains linking to my site with DR above 50"

"Get keyword ideas related to 'digital marketing' in the TH market"

"Analyze the SERP for 'best seo tools' in the US"

"Show me my site's traffic history over the past 6 months"

"Find broken backlinks pointing to my domain"
```

## API Units Consumption

Different endpoints consume different amounts of API units. The most expensive operations are those involving keyword metrics (volume, difficulty) which cost 10 units per row.

Use `ahrefs_api_usage` to check your remaining API units.

## Tool Parameters Reference

### Common Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `target` | Domain or URL to analyze | `"example.com"` |
| `country` | 2-letter country code (ISO 3166-1) | `"TH"`, `"US"`, `"GB"` |
| `date` | Analysis date (YYYY-MM-DD) | `"2024-12-01"` |
| `mode` | Analysis scope | `"subdomains"`, `"domain"`, `"prefix"`, `"exact"` |
| `limit` | Results limit (1-1000) | `100` |
| `order_by` | Sort order | `"volume:desc"`, `"domain_rating:desc"` |

### Mode Options

- `subdomains` - Analyze domain + all subdomains (default)
- `domain` - Analyze only the exact domain (no subdomains)
- `prefix` - Analyze all pages under a path (e.g., `example.com/blog/*`)
- `exact` - Analyze a single specific URL

## Troubleshooting

### Server not starting
- Check that Node.js 18+ is installed: `node --version`
- Verify the build succeeded: `npm run build`
- Check for TypeScript errors in the build output

### API errors
- Verify your API key is correct
- Check your API usage limits: use `ahrefs_api_usage` tool
- Ensure you have Business plan access for API

### Cursor not finding the server
- Verify the absolute path in config is correct
- Check file permissions on the server files
- Restart Cursor after config changes

## License

MIT
