# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Project Name**: `has-scorecard` (or any name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is perfect for MVP
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

## Step 2: Get Your Database Connection String

1. In your Supabase project dashboard, go to:
   - **Settings** (gear icon) → **Database** → **Connection String**
2. Select **URI** tab
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abc123xyz.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Update Your .env File

1. Create/update `.env` file in project root:
   ```bash
   DATABASE_URL="your-supabase-connection-string-here"
   ```

2. Replace the example with your actual Supabase connection string

## Step 4: Push Database Schema

Run these commands:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase
npx prisma db push
```

## Step 5: Verify Connection

You should see:
```
✅ Database synced successfully
✅ Prisma Client generated
```

## Step 6: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Troubleshooting

### Connection Error
- Check your DATABASE_URL is correct
- Verify your Supabase project is active
- Make sure you replaced [YOUR-PASSWORD] with actual password

### SSL Error
Add `?sslmode=require` to the end of your DATABASE_URL:
```
DATABASE_URL="postgresql://...postgres?sslmode=require"
```

### Table Already Exists
If you get errors about tables already existing:
```bash
npx prisma migrate reset --skip-seed
npx prisma db push
```

## Viewing Your Database

You can view/edit your database data directly in Supabase:
1. Go to your project dashboard
2. Click **Table Editor** in the sidebar
3. You'll see: User, Scan, Competitor, Recommendation tables

Or use Prisma Studio locally:
```bash
npx prisma studio
```

