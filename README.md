# SAO Auditor - Search & AI Optimization Analyzer

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)

A comprehensive website analysis tool that scores your site's readiness for modern SEO (GEO/AIO) using a **5-pillar scoring system**. Analyzes websites for content structure, brand ranking, technical performance, keyword visibility, and AI trust signals.

## 🌟 Features

- **5-Pillar Scoring System** (100 points) - Comprehensive SEO and AI optimization analysis
- **Multi-URL Analysis** - Analyze up to 30 URLs with competitor comparison
- **Multi-API Fallback** - Cascading API orchestration (Ahrefs → DataForSEO → Moz → Estimates)
- **Real-time Analysis** - Fast website scanning with detailed insights
- **Automated Recommendations** - Prioritized action items with detailed explanations
- **PDF Report Export** - Generate comprehensive analysis reports
- **Beautiful UI** - Modern, responsive interface with score visualizations
- **MCP Servers** - Python, R, and Ahrefs integration via Model Context Protocol

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Create database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 5-Pillar Scoring System

| Pillar | Points | Key Metrics |
|--------|--------|-------------|
| **Content Structure** | 25 | Schema markup, headings, tables, images, direct answers |
| **Brand Ranking** | 9 | Brand search rank, community sentiment |
| **Website Technical** | 17 | LCP, INP, CLS, SSL, mobile, LLMs.txt, sitemap |
| **Keyword Visibility** | 23 | Keywords count, average position, intent match |
| **AI Trust** | 22 | Backlinks, referring domains, E-E-A-T, sentiment |

## 🔌 API Integrations

- **Ahrefs** - Keywords, backlinks, domain metrics
- **DataForSEO** - SEO data and keyword analysis
- **Moz** - Backlinks and domain authority
- **Google PageSpeed** - Core Web Vitals analysis
- **Google Search Console** - Keyword positions
- **Google Gemini** - AI sentiment analysis
- **Common Crawl** - Web data access

## 📁 Project Structure

```
SAO Auditor/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── internal/          # Internal analysis dashboard
│   └── components/        # React components
├── lib/                    # Library code
│   └── modules/           # Analysis modules
├── prisma/                 # Database schema
├── docs/                   # Documentation
│   ├── fastpython-mcp-server/  # Python MCP server
│   ├── r-mcp-server/          # R MCP server
│   └── ahrefs-mcp-server/     # Ahrefs MCP server
└── scripts/               # Utility scripts
```

## 📖 Documentation

- **[Full Documentation](./docs/README.md)** - Complete guide with all features
- **[Deployment Guide](./DEPLOYMENT_QUICK_START.md)** - Deploy to Vercel
- **[Scoring Logic](./docs/SCORING_LOGIC.md)** - Detailed scoring system explanation
- **[Architecture](./HAS_Solution_Architecture.md)** - System architecture overview

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL (Supabase) / SQLite
- **ORM**: Prisma 5.22
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 🔐 Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-password"

# Optional API Keys
AHREFS_API_KEY="your-key"
MOZ_API_TOKEN="your-token"
GOOGLE_PAGESPEED_API_KEY="your-key"
GEMINI_API_KEY="your-key"
```

See [Deployment Guide](./DEPLOYMENT_QUICK_START.md) for complete list.

## 🧪 Testing

```bash
# Test free tier features
npm run test:free

# Test URL analysis
npm run test:url
```

## 📝 Recent Updates

- ✅ Created FastPython and R MCP servers
- ✅ Enhanced UI with improved text contrast
- ✅ Multi-URL analysis with competitor comparison
- ✅ 5-pillar scoring system implementation
- ✅ Multi-API fallback system

## 🚀 Deployment

Deploy to Vercel with one command:

```bash
vercel --prod
```

See [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) for detailed instructions.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**For detailed documentation, see [docs/README.md](./docs/README.md)**

