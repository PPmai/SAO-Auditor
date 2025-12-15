# SAO Auditor - Search & AI Optimization Analyzer

A comprehensive website analysis tool that scores your site's readiness for modern SEO (GEO/AIO) using a 5-pillar scoring system. Analyzes websites for content structure, brand ranking, technical performance, keyword visibility, and AI trust signals.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- PostgreSQL/Supabase (for production) or SQLite (for development)
- Python 3.x (optional, for MCP server)
- R (optional, for MCP server)

### Installation Steps

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Generate Prisma client
npx prisma generate

# 3. Create database
npx prisma db push

# 4. Start development server
npm run dev

# 5. Open browser at http://localhost:3000
```

## ✨ Features

### ✅ Core Features
- **5-Pillar Scoring System** (100 points total):
  - **Content Structure** (25 pts): Schema markup, headings, tables, multimedia, direct answers
  - **Brand Ranking** (9 pts): Brand search rank, community sentiment
  - **Website Technical** (17 pts): Core Web Vitals (LCP, INP, CLS), SSL, mobile, LLMs.txt, sitemap
  - **Keyword Visibility** (23 pts): Organic keywords, average position, search intent match
  - **AI Trust** (22 pts): Backlinks, referring domains, E-E-A-T signals, sentiment, local/GEO
- **Multi-URL Analysis** - Analyze up to 30 URLs with competitor comparison (up to 4 competitors)
- **Multi-API Fallback System** - Cascading API orchestration (Ahrefs → DataForSEO → Moz → Estimates)
- **Google PageSpeed Integration** - Core Web Vitals analysis
- **Automated Recommendations** - Prioritized action items with detailed insights
- **Beautiful UI** - Modern interface with score visualization and detailed breakdowns
- **Database Storage** - Saves scan history with Prisma ORM
- **PDF Report Export** - Generate comprehensive reports
- **User Authentication** - Admin and user login systems

### 🔧 MCP Servers (Model Context Protocol)
- **Ahrefs MCP Server** - SEO data analysis via MCP
- **FastPython MCP Server** - Execute Python code through AI assistants
- **R MCP Server** - Execute R code for statistical analysis

## 📊 Scoring System

### Direct 100-Point System

| Pillar | Points | Key Metrics |
|--------|--------|-------------|
| Content Structure | 25 | Schema markup, headings, tables, images, direct answers |
| Brand Ranking | 9 | Brand search rank, community sentiment |
| Website Technical | 17 | LCP, INP, CLS, SSL, mobile, LLMs.txt, sitemap |
| Keyword Visibility | 23 | Keywords count, average position, intent match |
| AI Trust | 22 | Backlinks, referring domains, E-E-A-T, sentiment |

### Score Interpretation

| Score | Label | Description |
|-------|-------|-------------|
| 90-100 | Excellent | Well-optimized for modern search and AI |
| 70-89 | Good | Performing well with room for improvement |
| 50-69 | Needs Improvement | Several areas need attention |
| 0-49 | Poor | Significant optimization needed |

## 🏗️ Architecture

```
/app
  /api
    /scan          - Main analysis endpoint (POST)
    /v1/scan       - Multi-URL analysis endpoint
    /auth          - Authentication endpoints
    /admin         - Admin endpoints
  /dashboard       - User dashboard
  /internal        - Internal multi-URL analysis dashboard
  /admin           - Admin panel
  page.tsx         - Home page with single URL analysis

/lib
  /modules
    api-manager.ts      - Cascading API fallback system
    scraper.ts          - HTML scraping & content analysis
    pagespeed.ts        - Google PageSpeed API integration
    scoring.ts          - 5-pillar scoring engine
    ahrefs.ts           - Ahrefs API integration
    dataforseo.ts       - DataForSEO API integration
    moz.ts              - Moz API integration
    gemini.ts           - Google Gemini AI integration
    google-search-console.ts - GSC integration
  db.ts            - Prisma client singleton

/prisma
  schema.prisma    - Database schema (PostgreSQL/SQLite)

/docs
  /fastpython-mcp-server  - Python MCP server
  /r-mcp-server          - R MCP server
  /ahrefs-mcp-server     - Ahrefs MCP server
```

## 🔌 API Integration

### Supported APIs

| API | Purpose | Status | Fallback |
|-----|---------|--------|----------|
| **Ahrefs** | Keywords, backlinks, domain metrics | ✅ Configured | DataForSEO/Moz |
| **DataForSEO** | SEO data, keywords, backlinks | ✅ Available | Moz/Estimates |
| **Moz** | Backlinks, domain authority | ✅ Available | Estimates |
| **Google PageSpeed** | Core Web Vitals | ✅ Free tier | Estimates |
| **Google Search Console** | Keyword positions | ✅ Available | Estimates |
| **Google Gemini** | Sentiment analysis | ✅ Available | Estimates |
| **Common Crawl** | Web data | ✅ Available | Limited |

### API Fallback Chain
1. **Ahrefs** (if available)
2. **DataForSEO** (if Ahrefs unavailable)
3. **Moz** (if DataForSEO unavailable)
4. **Estimates** (conservative fallback)

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

See `DEPLOYMENT_QUICK_START.md` for detailed instructions.

### Environment Variables

Required:
```env
DATABASE_URL="postgresql://..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-password"
```

Optional API Keys:
```env
AHREFS_API_KEY="your-key"
MOZ_API_TOKEN="your-token"
GOOGLE_PAGESPEED_API_KEY="your-key"
GEMINI_API_KEY="your-key"
GOOGLE_CUSTOM_SEARCH_API_KEY="your-key"
GOOGLE_CUSTOM_SEARCH_ENGINE_ID="your-engine-id"
DATAFORSEO_LOGIN="your-username"
DATAFORSEO_PASSWORD="your-password"
```

## 📖 Documentation

- **Deployment**: `DEPLOYMENT_QUICK_START.md`, `DEPLOYMENT_CHECKLIST.md`
- **Scoring Logic**: `SCORING_LOGIC.md`
- **API Setup**: 
  - `MOZ_API_SETUP.md`
  - `GOOGLE_CUSTOM_SEARCH_SETUP.md`
  - `AHREFS_MCP_GUIDE.md`
- **MCP Servers**:
  - `fastpython-mcp-server/README.md`
  - `r-mcp-server/README.md`
  - `ahrefs-mcp-server/README.md`
- **Architecture**: `HAS_Solution_Architecture.md`

## 🧪 Testing

```bash
# Test free tier features
npm run test:free

# Test URL analysis
npm run test:url

# Test all features
node scripts/test-all-features.ts
```

## 🔒 Security Considerations

- API keys stored in environment variables
- User authentication with JWT tokens
- Admin access control
- Rate limiting on API calls
- Input validation and sanitization

## 🐛 Troubleshooting

### PageSpeed API rate limit (429 error)
- Normal for free tier after many requests
- System automatically uses estimated scores
- Wait 24 hours for quota reset or add API key

### Database connection error
```bash
# Reset database
rm prisma/dev.db
npx prisma db push
```

### Build errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

## 📝 Recent Updates

### December 2025
- ✅ Created FastPython and R MCP servers
- ✅ Updated UI with improved text contrast
- ✅ Enhanced recommendations with detailed insights
- ✅ Multi-URL analysis with competitor comparison
- ✅ 5-pillar scoring system implementation
- ✅ Multi-API fallback system

## 🎯 Roadmap

- [ ] Fix TypeScript compilation issues in MCP servers
- [ ] Add more API integrations
- [ ] Implement caching layer
- [ ] Add monitoring and alerting
- [ ] Enhance security with sandboxing
- [ ] Add more visualization options

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Last Updated**: December 15, 2025

For more information, see the [Architecture Documentation](./HAS_Solution_Architecture.md) or [Deployment Guide](./DEPLOYMENT_QUICK_START.md).
