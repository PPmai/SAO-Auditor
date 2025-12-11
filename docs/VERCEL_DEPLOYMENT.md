# Vercel Deployment Guide

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Deploy via Vercel Dashboard

### Option A: Import from GitHub (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? (press Enter for default)
# - Directory? ./
# - Override settings? No
```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**, add:

### Required (Minimum for Basic Functionality)

```env
# Admin Login (Simple Auth)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here

# Database (Optional - app works without it)
DATABASE_URL=your-postgresql-connection-string
```

### Optional API Keys (Add as needed)

```env
# Google PageSpeed Insights
GOOGLE_PAGESPEED_API_KEY=your-google-api-key

# Google Custom Search
GOOGLE_CUSTOM_SEARCH_API_KEY=your-google-api-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-search-engine-id

# Moz API
MOZ_API_TOKEN=your-moz-api-token

# DataForSEO
DATAFORSEO_LOGIN=your-username
DATAFORSEO_PASSWORD=your-password

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Supabase (Optional - only if using Supabase auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Environment Variable Setup Tips

1. **For Production**: Set variables in **Production** environment
2. **For Preview**: Set variables in **Preview** environment (optional)
3. **For Development**: Set variables in **Development** environment (optional)

## Step 4: Configure Build Settings

Vercel will auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `prisma generate && next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install --legacy-peer-deps` (if needed)

## Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails: "Prisma Client not generated"

**Solution**: The `vercel.json` already includes `prisma generate` in build command. If it still fails:

1. Check that `DATABASE_URL` is set (even if using SQLite locally)
2. Verify `prisma/schema.prisma` exists
3. Check build logs for specific errors

### Build Fails: "Module not found"

**Solution**: 
1. Ensure all dependencies are in `package.json`
2. Check that `node_modules` is not in `.gitignore` (it shouldn't be)
3. Try clearing Vercel cache: **Settings** → **General** → **Clear Build Cache**

### Runtime Error: "Environment variable not found"

**Solution**:
1. Verify all required env vars are set in Vercel dashboard
2. Make sure you're setting them for the correct environment (Production/Preview)
3. Redeploy after adding new variables

### API Routes Timeout

**Solution**: 
- The `vercel.json` already sets `maxDuration: 120` for scan routes
- For longer operations, consider using Vercel Edge Functions or background jobs

## Post-Deployment Checklist

- [ ] Test login with admin credentials
- [ ] Test URL scanning functionality
- [ ] Verify API integrations work (if configured)
- [ ] Check that environment variables are loaded correctly
- [ ] Test on mobile devices
- [ ] Set up monitoring/alerts (optional)

## Updating Your Deployment

After making changes:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Create a new deployment
3. Run build
4. Deploy to preview URL
5. (If on main branch) Deploy to production after build succeeds

## Rollback

If something goes wrong:

1. Go to **Deployments** tab in Vercel
2. Find the last working deployment
3. Click **"..."** → **"Promote to Production"**

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

