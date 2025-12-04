# HAS Digital Scorecard - Commercial Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"

# Semrush API (Pro/Agency tiers)
SEMRUSH_API_KEY="your-semrush-api-key"

# Google PageSpeed (Optional - works without)
GOOGLE_PAGESPEED_API_KEY=""

# Stripe (For payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# App
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and anon key
3. Go to Settings > Database to get the connection string
4. Enable Email/Password and Google OAuth in Authentication > Providers

## Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push
```

## Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create products and prices:
   - Pro: $29/month
   - Agency: $99/month
3. Set up webhooks for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Semrush Setup

1. Get a Semrush Business account ($499.95/month)
2. Enable API access in your account settings
3. Copy your API key to `.env`

## Running Locally

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## Project Structure

```
app/
├── (auth)/
│   ├── login/page.tsx       # Login page
│   └── signup/page.tsx      # Signup page
├── auth/callback/route.ts   # OAuth callback
├── api/
│   └── scan/route.ts        # Main analysis API
├── dashboard/page.tsx       # User dashboard
├── pricing/page.tsx         # Pricing page
└── page.tsx                 # Landing page

lib/
├── modules/
│   ├── scraper.ts           # HTML scraping
│   ├── pagespeed.ts         # PageSpeed API
│   ├── semrush.ts           # Semrush API
│   └── scoring.ts           # Scoring engine
├── supabase/
│   ├── client.ts            # Browser client
│   ├── server.ts            # Server client
│   └── middleware.ts        # Auth middleware
└── db.ts                    # Prisma client

prisma/
└── schema.prisma            # Database schema
```

## Feature Status

| Feature | Status |
|---------|--------|
| URL Scraping | ✅ Complete |
| PageSpeed API | ✅ Complete |
| Semrush Integration | ✅ Complete |
| 4-Pillar Scoring | ✅ Complete |
| Competitor Comparison | ✅ Complete |
| User Authentication | ✅ Complete |
| Dashboard | ✅ Complete |
| Landing Page | ✅ Complete |
| Pricing Page | ✅ Complete |
| PDF Export | 🚧 Pending |
| Historical Tracking | 🚧 Pending |
| Public API | 🚧 Pending |
| Stripe Integration | 🚧 Pending |

## Monthly Costs

| Service | Cost |
|---------|------|
| Semrush Business | $500/mo |
| Supabase Pro | $25/mo |
| Vercel Pro | $20/mo |
| **Total** | ~$545/mo |

## Support

For questions or issues, contact Conductor support.

