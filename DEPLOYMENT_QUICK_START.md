# Quick Deployment Guide to Vercel

## ✅ Pre-Deployment Checklist

- [x] Build passes locally (`npm run build`)
- [x] TypeScript errors fixed
- [x] `vercel.json` configured
- [x] Environment variables documented

## 🚀 Deploy Steps

### Option 1: Via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add these **minimum required** variables:
     ```
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=your-secure-password
     ```
   - Add optional API keys as needed (see full list below)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes
   - Your app will be live!

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then set environment variables in dashboard
```

## 📋 Environment Variables

### Required (Minimum)
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
```

### Optional API Keys (Add as needed)
```env
# Google PageSpeed Insights
GOOGLE_PAGESPEED_API_KEY=your-key

# Google Custom Search
GOOGLE_CUSTOM_SEARCH_API_KEY=your-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-engine-id

# Moz API
MOZ_API_TOKEN=your-token

# DataForSEO
DATAFORSEO_LOGIN=your-username
DATAFORSEO_PASSWORD=your-password

# Gemini AI
GEMINI_API_KEY=your-key

# Database (Optional - app works without it)
DATABASE_URL=postgresql://...

# Supabase (Optional - only if using Supabase auth)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

## 🔧 Build Configuration

The `vercel.json` file is already configured with:
- ✅ Build command: `prisma generate && next build`
- ✅ Install command: `npm install --legacy-peer-deps`
- ✅ Function timeout: 120s for scan routes

## 📝 Post-Deployment

1. **Test Login**
   - Visit `https://your-project.vercel.app/login`
   - Use your `ADMIN_USERNAME` and `ADMIN_PASSWORD`

2. **Test URL Scanning**
   - Try scanning a URL to verify functionality

3. **Check Logs**
   - Vercel Dashboard → Deployments → View Function Logs

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify `DATABASE_URL` is set (even if not using database)

### Runtime Errors
- Check environment variables are set correctly
- Verify they're set for the right environment (Production/Preview)
- Check function logs in Vercel dashboard

### API Timeouts
- Scan routes already configured for 120s timeout
- For longer operations, consider background jobs

## 📚 Full Documentation

See `docs/VERCEL_DEPLOYMENT.md` for detailed instructions.

## 🎉 Success!

Once deployed, your app will be available at:
- Production: `https://your-project.vercel.app`
- Preview: `https://your-project-git-branch.vercel.app`




