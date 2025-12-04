# Digital Performance Scorecard (HAS) - MVP

A comprehensive website analysis tool that scores your site's readiness for modern SEO (GEO/AIO) using 4 pillars: Content Structure, Brand Ranking, Keyword Visibility, and AI Trust.

## Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- SQLite (included) or PostgreSQL/Supabase (optional)

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

## MVP Features

### ✅ Working Features
- **URL Analysis** - Scrapes and analyzes any public website
- **4-Pillar Scoring System** (100 points total):
  - Content Structure (30 pts): Schema, headings, tables, multimedia
  - Brand Ranking (30 pts): Core Web Vitals, SSL, mobile-friendliness
  - Keyword Visibility (20 pts): Placeholder for Semrush integration
  - AI Trust (20 pts): E-E-A-T signals, external citations
- **Google PageSpeed Integration** - Core Web Vitals (LCP, FID, CLS)
- **Automated Recommendations** - Prioritized action items
- **Beautiful UI** - Score visualization with detailed breakdowns
- **Database Storage** - Saves scan history (SQLite by default)

### 🚧 Future Features (Require API Keys)
- Semrush API integration for real keyword data
- Claude API for sentiment analysis
- Competitor comparison (up to 4 competitors)
- PDF report export
- User authentication
- Historical tracking

## MVP Limitations

The MVP works **without paid API keys** by using:
- Free Google PageSpeed Insights API (25,000 queries/day)
- HTML scraping for content analysis
- Estimated scores when APIs are unavailable

**Rate Limit Handling**: When PageSpeed API hits rate limits, the system uses conservative estimated scores and marks them accordingly.

For full functionality, you'll need:
- Semrush Business Plan (~$500/mo) - keyword visibility
- Claude API (~$5-10/mo) - sentiment analysis

## Architecture

```
/app
  /api/scan        - Main analysis endpoint (POST)
  page.tsx         - Frontend interface
  layout.tsx       - Root layout
  globals.css      - Tailwind styles

/lib
  /modules
    scraper.ts     - HTML scraping & content analysis
    pagespeed.ts   - Google PageSpeed API integration
    scoring.ts     - 4-pillar scoring engine
  db.ts            - Prisma client singleton

/prisma
  schema.prisma    - Database schema (SQLite)

/docs
  README.md        - This file
  SUPABASE_SETUP.md - Supabase configuration guide
```

## API Usage

### POST /api/scan

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response:**
```json
{
  "success": true,
  "scanId": "abc123",
  "url": "https://example.com",
  "score": 65,
  "scoreLabel": { "label": "Good", "color": "blue" },
  "scores": {
    "total": 65,
    "contentStructure": 20,
    "brandRanking": 22,
    "keywordVisibility": 9,
    "aiTrust": 14,
    "breakdown": { ... }
  },
  "recommendations": [ ... ]
}
```

## Database Options

### SQLite (Default - No Setup Required)
The MVP uses SQLite by default. Database file is created at `prisma/dev.db`.

### Supabase (Production)
See `docs/SUPABASE_SETUP.md` for Supabase configuration.

## Troubleshooting

### PageSpeed API rate limit (429 error)
- Normal for free tier after many requests
- System automatically uses estimated scores
- Wait 24 hours for quota reset or add API key

### Site scraping fails
- Some sites block scrapers (returns empty data)
- Try with different URLs
- Check console for specific error

### Database connection error
```bash
# Reset database
rm prisma/dev.db
npx prisma db push
```

## Score Interpretation

| Score | Label | Description |
|-------|-------|-------------|
| 90-100 | Excellent | Well-optimized for modern search and AI |
| 70-89 | Good | Performing well with room for improvement |
| 50-69 | Needs Improvement | Several areas need attention |
| 0-49 | Poor | Significant optimization needed |

## Next Steps

1. ✅ Test MVP with various URLs
2. Connect Supabase for production database
3. Add Semrush API for keyword visibility
4. Add Claude API for sentiment analysis
5. Implement competitor comparison
6. Build PDF export feature
7. Deploy to Vercel

