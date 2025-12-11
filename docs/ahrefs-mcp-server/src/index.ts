import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = "https://api.ahrefs.com/v3";
const API_KEY = process.env.AHREFS_API_KEY;

if (!API_KEY) {
  console.error("Error: AHREFS_API_KEY environment variable is required");
  process.exit(1);
}

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T> {
  data?: T;
  error?: { message: string };
}

// ============================================================================
// API Client
// ============================================================================

async function makeApiRequest<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  
  // Add non-undefined params to URL
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ahrefs API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as ApiResponse<T>;
  
  if (data.error) {
    throw new Error(`Ahrefs API error: ${data.error.message}`);
  }

  return data as T;
}

// ============================================================================
// Shared Schemas
// ============================================================================

const ModeSchema = z.enum(["exact", "prefix", "domain", "subdomains"]).default("subdomains")
  .describe("Scope: exact=single URL, prefix=path/*, domain=domain only, subdomains=domain+all subdomains");

const ProtocolSchema = z.enum(["both", "http", "https"]).default("both")
  .describe("Protocol filter for target URLs");

const CountrySchema = z.string().length(2).optional()
  .describe("Two-letter country code (ISO 3166-1 alpha-2), e.g., 'US', 'TH', 'GB'");

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("Date in YYYY-MM-DD format");

const LimitSchema = z.number().int().min(1).max(1000).default(100)
  .describe("Number of results to return (1-1000)");

// ============================================================================
// Server Initialization
// ============================================================================

const server = new McpServer({
  name: "ahrefs-mcp-server",
  version: "1.0.0",
});

// ============================================================================
// Tool: Site Explorer - Domain Rating
// ============================================================================

server.registerTool(
  "ahrefs_domain_rating",
  {
    title: "Get Domain Rating",
    description: `Get the Domain Rating (DR) and related metrics for a domain or URL.

Domain Rating is Ahrefs' proprietary metric showing the strength of a website's backlink profile on a 0-100 scale.

Args:
  - target (string): Domain or URL to analyze (e.g., "example.com")
  - date (string): Date in YYYY-MM-DD format
  - protocol (string): Protocol filter - 'both', 'http', or 'https' (default: 'both')

Returns:
  Domain rating score, ahrefs_rank, and backlinks data.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      date: DateSchema,
      protocol: ProtocolSchema,
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/domain-rating", {
      target: params.target,
      date: params.date,
      protocol: params.protocol,
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Site Explorer - Metrics Overview
// ============================================================================

server.registerTool(
  "ahrefs_site_metrics",
  {
    title: "Get Site Metrics Overview",
    description: `Get comprehensive SEO metrics for a domain, URL, or site section.

Returns organic traffic, keywords count, referring domains, backlinks count, and traffic value.

Args:
  - target (string): Domain or URL to analyze
  - date (string): Date in YYYY-MM-DD format
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - country (string): Two-letter country code for organic metrics (optional)
  - protocol (string): Protocol filter (default: 'both')

Returns:
  Organic traffic, organic keywords, referring domains, backlinks, and traffic value.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      date: DateSchema,
      mode: ModeSchema,
      country: CountrySchema,
      protocol: ProtocolSchema,
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/metrics", {
      target: params.target,
      date: params.date,
      mode: params.mode,
      country: params.country,
      protocol: params.protocol,
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Site Explorer - Organic Keywords
// ============================================================================

server.registerTool(
  "ahrefs_organic_keywords",
  {
    title: "Get Organic Keywords",
    description: `Get organic keywords that a domain/URL ranks for in search results.

Returns keywords with position, search volume, traffic, CPC, keyword difficulty, and SERP features.

Args:
  - target (string): Domain or URL to analyze
  - date (string): Date in YYYY-MM-DD format
  - country (string): Two-letter country code (e.g., 'US', 'TH')
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 100)
  - order_by (string): Sort column, e.g., 'volume:desc' or 'best_position:asc'
  - where (string): Filter expression in Ahrefs filter syntax (optional)

Returns:
  List of keywords with rankings, volume, traffic, CPC, and more.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      date: DateSchema,
      country: z.string().length(2).describe("Two-letter country code (required)"),
      mode: ModeSchema,
      limit: LimitSchema,
      order_by: z.string().optional().describe("Sort column:direction, e.g., 'volume:desc'"),
      where: z.string().optional().describe("Filter expression"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/organic-keywords", {
      target: params.target,
      date: params.date,
      country: params.country,
      mode: params.mode,
      limit: params.limit,
      order_by: params.order_by,
      where: params.where,
      select: "keyword,best_position,volume,sum_traffic,cpc,keyword_difficulty,best_position_url,serp_features",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Site Explorer - Backlinks
// ============================================================================

server.registerTool(
  "ahrefs_backlinks",
  {
    title: "Get Backlinks",
    description: `Get detailed backlink data for a domain or URL.

Returns referring pages, anchor text, domain rating of linking sites, and link attributes.

Args:
  - target (string): Domain or URL to analyze
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 100)
  - order_by (string): Sort column, e.g., 'domain_rating:desc'
  - where (string): Filter expression (optional)

Returns:
  List of backlinks with source URL, anchor, DR, traffic, and link attributes.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      mode: ModeSchema,
      limit: LimitSchema,
      order_by: z.string().optional().describe("Sort column:direction"),
      where: z.string().optional().describe("Filter expression"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/all-backlinks", {
      target: params.target,
      mode: params.mode,
      limit: params.limit,
      order_by: params.order_by,
      where: params.where,
      select: "url_from,url_to,anchor,domain_rating,url_from_ahrefs_rank,traffic_domain,dofollow,first_seen,last_seen",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Site Explorer - Referring Domains
// ============================================================================

server.registerTool(
  "ahrefs_referring_domains",
  {
    title: "Get Referring Domains",
    description: `Get referring domains that link to a target domain or URL.

Returns unique domains linking to target with their DR, backlinks count, and traffic.

Args:
  - target (string): Domain or URL to analyze
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 100)
  - order_by (string): Sort column, e.g., 'domain_rating:desc'

Returns:
  List of referring domains with DR, backlinks count, dofollow links, and traffic.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      mode: ModeSchema,
      limit: LimitSchema,
      order_by: z.string().optional().describe("Sort column:direction"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/refdomains", {
      target: params.target,
      mode: params.mode,
      limit: params.limit,
      order_by: params.order_by,
      select: "domain,domain_rating,backlinks,backlinks_dofollow,first_seen,last_visited,traffic_domain",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Site Explorer - Top Pages
// ============================================================================

server.registerTool(
  "ahrefs_top_pages",
  {
    title: "Get Top Pages",
    description: `Get top-performing pages for a website ranked by organic traffic.

Returns pages with their traffic, keywords count, top keyword, and referring domains.

Args:
  - target (string): Domain or URL to analyze
  - date (string): Date in YYYY-MM-DD format
  - country (string): Two-letter country code (optional)
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 100)

Returns:
  List of pages with traffic, keywords, top keyword, and backlink metrics.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      date: DateSchema,
      country: CountrySchema,
      mode: ModeSchema,
      limit: LimitSchema,
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/top-pages", {
      target: params.target,
      date: params.date,
      country: params.country,
      mode: params.mode,
      limit: params.limit,
      select: "url,sum_traffic,keywords,top_keyword,top_keyword_volume,top_keyword_best_position,refdomains",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Site Explorer - Organic Competitors
// ============================================================================

server.registerTool(
  "ahrefs_organic_competitors",
  {
    title: "Get Organic Competitors",
    description: `Get organic search competitors for a domain based on keyword overlap.

Returns competing domains with traffic, common keywords, and domain metrics.

Args:
  - target (string): Domain or URL to analyze
  - date (string): Date in YYYY-MM-DD format
  - country (string): Two-letter country code (required)
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 50)

Returns:
  List of competitors with common keywords, traffic estimates, and DR.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      date: DateSchema,
      country: z.string().length(2).describe("Two-letter country code (required)"),
      mode: ModeSchema,
      limit: LimitSchema.default(50),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/organic-competitors", {
      target: params.target,
      date: params.date,
      country: params.country,
      mode: params.mode,
      limit: params.limit,
      select: "domain,common_keywords,keywords,sum_traffic,domain_rating",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Keywords Explorer - Overview
// ============================================================================

server.registerTool(
  "ahrefs_keyword_overview",
  {
    title: "Get Keyword Overview",
    description: `Get detailed metrics for specific keywords.

Returns search volume, keyword difficulty, CPC, clicks data, and search intent.

Args:
  - keywords (string): Comma-separated keywords to analyze (e.g., "seo,keyword research")
  - country (string): Two-letter country code (required)
  - limit (number): Number of results (default: 100)

Returns:
  Keyword metrics including volume, difficulty, CPC, clicks, and intent signals.`,
    inputSchema: z.object({
      keywords: z.string().describe("Comma-separated keywords to analyze"),
      country: z.string().length(2).describe("Two-letter country code (required)"),
      limit: LimitSchema,
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("keywords-explorer/overview", {
      keywords: params.keywords,
      country: params.country,
      limit: params.limit,
      select: "keyword,volume,keyword_difficulty,cpc,clicks,global_volume,traffic_potential",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Keywords Explorer - Matching Terms
// ============================================================================

server.registerTool(
  "ahrefs_keyword_ideas",
  {
    title: "Get Keyword Ideas (Matching Terms)",
    description: `Get keyword ideas by matching input terms or phrases.

Returns related keywords with volume, difficulty, CPC, and traffic potential.

Args:
  - keywords (string): Seed keywords (comma-separated)
  - country (string): Two-letter country code (required)
  - limit (number): Number of results (1-1000, default: 100)
  - order_by (string): Sort column, e.g., 'volume:desc'
  - where (string): Filter expression (optional)

Returns:
  List of matching keyword ideas with metrics.`,
    inputSchema: z.object({
      keywords: z.string().describe("Seed keywords, comma-separated"),
      country: z.string().length(2).describe("Two-letter country code (required)"),
      limit: LimitSchema,
      order_by: z.string().optional().describe("Sort column:direction"),
      where: z.string().optional().describe("Filter expression"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("keywords-explorer/matching-terms", {
      keywords: params.keywords,
      country: params.country,
      limit: params.limit,
      order_by: params.order_by,
      where: params.where,
      select: "keyword,volume,keyword_difficulty,cpc,traffic_potential,parent_topic,serp_features",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Keywords Explorer - Related Terms
// ============================================================================

server.registerTool(
  "ahrefs_related_keywords",
  {
    title: "Get Related Keywords",
    description: `Get related keywords (also rank for / also talk about) for a keyword.

Returns semantically related keywords that pages ranking for your keyword also rank for.

Args:
  - keywords (string): Seed keywords (comma-separated)
  - country (string): Two-letter country code (required)
  - limit (number): Number of results (1-1000, default: 100)
  - view_for (string): 'also_rank_for' or 'also_talk_about' (default: 'also_rank_for')

Returns:
  List of related keywords with metrics.`,
    inputSchema: z.object({
      keywords: z.string().describe("Seed keywords, comma-separated"),
      country: z.string().length(2).describe("Two-letter country code (required)"),
      limit: LimitSchema,
      view_for: z.enum(["also_rank_for", "also_talk_about"]).default("also_rank_for")
        .describe("Type of related keywords to find"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("keywords-explorer/related-terms", {
      keywords: params.keywords,
      country: params.country,
      limit: params.limit,
      view_for: params.view_for,
      select: "keyword,volume,keyword_difficulty,cpc,traffic_potential,serp_features",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: SERP Overview
// ============================================================================

server.registerTool(
  "ahrefs_serp_overview",
  {
    title: "Get SERP Overview",
    description: `Get search results (SERP) overview for a specific keyword.

Returns top ranking pages with their metrics, backlinks, and traffic data.

Args:
  - keyword (string): Keyword to analyze
  - country (string): Two-letter country code (required)
  - top_positions (number): Number of positions to return (default: 10, max: 100)

Returns:
  SERP results with page metrics, DR, backlinks, and traffic estimates.`,
    inputSchema: z.object({
      keyword: z.string().describe("Keyword to analyze"),
      country: z.string().length(2).describe("Two-letter country code (required)"),
      top_positions: z.number().int().min(1).max(100).default(10)
        .describe("Number of SERP positions to return"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("serp-overview/serp-overview", {
      keyword: params.keyword,
      country: params.country,
      top_positions: params.top_positions,
      select: "position,title,url,domain_rating,url_rating,backlinks,refdomains,traffic,keywords",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Backlinks Stats
// ============================================================================

server.registerTool(
  "ahrefs_backlinks_stats",
  {
    title: "Get Backlinks Statistics",
    description: `Get summary statistics about backlinks for a domain or URL.

Returns total backlinks, referring domains, dofollow/nofollow counts, and more.

Args:
  - target (string): Domain or URL to analyze
  - date (string): Date in YYYY-MM-DD format
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')

Returns:
  Backlink statistics summary including totals and breakdowns.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      date: DateSchema,
      mode: ModeSchema,
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/backlinks-stats", {
      target: params.target,
      date: params.date,
      mode: params.mode,
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Domain Rating History
// ============================================================================

server.registerTool(
  "ahrefs_domain_rating_history",
  {
    title: "Get Domain Rating History",
    description: `Get historical Domain Rating data for a domain over time.

Useful for tracking DR growth/decline and analyzing link building effectiveness.

Args:
  - target (string): Domain to analyze
  - date_from (string): Start date in YYYY-MM-DD format
  - date_to (string): End date in YYYY-MM-DD format (optional)
  - history_grouping (string): Grouping interval - 'daily', 'weekly', 'monthly' (default: 'monthly')

Returns:
  Historical DR values over the specified time range.`,
    inputSchema: z.object({
      target: z.string().describe("Domain to analyze"),
      date_from: DateSchema.describe("Start date"),
      date_to: DateSchema.optional().describe("End date"),
      history_grouping: z.enum(["daily", "weekly", "monthly"]).default("monthly")
        .describe("Data grouping interval"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/domain-rating-history", {
      target: params.target,
      date_from: params.date_from,
      date_to: params.date_to,
      history_grouping: params.history_grouping,
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Metrics History
// ============================================================================

server.registerTool(
  "ahrefs_metrics_history",
  {
    title: "Get Metrics History",
    description: `Get historical organic traffic and keyword metrics over time.

Track organic traffic, keywords, referring domains, and traffic value trends.

Args:
  - target (string): Domain or URL to analyze
  - date_from (string): Start date in YYYY-MM-DD format
  - date_to (string): End date (optional)
  - country (string): Two-letter country code (optional)
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - history_grouping (string): 'daily', 'weekly', or 'monthly' (default: 'monthly')

Returns:
  Historical metrics values over time.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      date_from: DateSchema.describe("Start date"),
      date_to: DateSchema.optional().describe("End date"),
      country: CountrySchema,
      mode: ModeSchema,
      history_grouping: z.enum(["daily", "weekly", "monthly"]).default("monthly")
        .describe("Data grouping interval"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/metrics-history", {
      target: params.target,
      date_from: params.date_from,
      date_to: params.date_to,
      country: params.country,
      mode: params.mode,
      history_grouping: params.history_grouping,
      select: "date,organic_traffic,organic_keywords,refdomains,organic_cost",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Broken Backlinks
// ============================================================================

server.registerTool(
  "ahrefs_broken_backlinks",
  {
    title: "Get Broken Backlinks",
    description: `Get broken backlinks pointing to non-functioning pages on a domain.

Useful for finding link reclamation opportunities.

Args:
  - target (string): Domain or URL to analyze
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 100)

Returns:
  List of broken backlinks with source URL, target URL, and metrics.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      mode: ModeSchema,
      limit: LimitSchema,
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/broken-backlinks", {
      target: params.target,
      mode: params.mode,
      limit: params.limit,
      select: "url_from,url_to,anchor,domain_rating,http_code,first_seen,last_seen",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Anchors
// ============================================================================

server.registerTool(
  "ahrefs_anchors",
  {
    title: "Get Anchor Text Analysis",
    description: `Get anchor text distribution for backlinks to a domain or URL.

Analyze how other sites are linking to you with different anchor texts.

Args:
  - target (string): Domain or URL to analyze
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 100)
  - order_by (string): Sort column, e.g., 'backlinks:desc'

Returns:
  List of anchor texts with backlinks count and referring domains.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      mode: ModeSchema,
      limit: LimitSchema,
      order_by: z.string().optional().describe("Sort column:direction"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/anchors", {
      target: params.target,
      mode: params.mode,
      limit: params.limit,
      order_by: params.order_by,
      select: "anchor,backlinks,backlinks_dofollow,refdomains,refdomains_dofollow,first_seen,last_seen",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Best by Links (Internal)
// ============================================================================

server.registerTool(
  "ahrefs_best_by_internal_links",
  {
    title: "Get Best Pages by Internal Links",
    description: `Get pages with the most internal links within a site.

Useful for understanding internal link structure and finding orphan pages.

Args:
  - target (string): Domain or URL to analyze
  - mode (string): Scope - 'exact', 'prefix', 'domain', or 'subdomains' (default: 'subdomains')
  - limit (number): Number of results (1-1000, default: 100)

Returns:
  List of pages ranked by internal links count.`,
    inputSchema: z.object({
      target: z.string().describe("Domain or URL to analyze"),
      mode: ModeSchema,
      limit: LimitSchema,
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const result = await makeApiRequest("site-explorer/best-by-internal-links", {
      target: params.target,
      mode: params.mode,
      limit: params.limit,
      select: "url,links,links_dofollow,links_nofollow",
    });
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: API Usage / Limits
// ============================================================================

server.registerTool(
  "ahrefs_api_usage",
  {
    title: "Check API Usage and Limits",
    description: `Check your Ahrefs API subscription usage and remaining limits.

Returns API units used, remaining, and subscription details.

Args: None required

Returns:
  API usage statistics and subscription information.`,
    inputSchema: z.object({}).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const result = await makeApiRequest("subscription-info/limits-and-usage", {});
    
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ============================================================================
// Server Start
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ahrefs MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
