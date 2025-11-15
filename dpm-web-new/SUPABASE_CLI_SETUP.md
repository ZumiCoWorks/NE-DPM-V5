# Supabase CLI Setup Guide for dpm-web-new

## ✅ Supabase CLI Installed Successfully!

The Supabase CLI is now installed locally in your project. Here's how to use it:

## 🚀 Quick Start Commands

### 1. Link Your Project (One-time setup)
```bash
# Link to your existing Supabase project
npm run supabase:link

# Or use the interactive script
./link-project.sh
```

### 2. Reset Database
```bash
# Safe reset with confirmation
npm run supabase:reset

# Or use the direct script
./reset-local.sh
```

### 3. Apply Migrations
```bash
# Push your clean schema
npm run supabase:push
```

### 4. Check Status
```bash
npm run supabase:status
```

## 📋 Step-by-Step Database Reset

### Method 1: Using Scripts (Recommended)
```bash
# 1. Link your project (if not already linked)
npm run supabase:link

# 2. Reset database
npm run supabase:reset

# 3. Apply clean schema
npm run supabase:push
```

### Method 2: Using SQL Editor (Alternative)
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Copy and run: `supabase/migrations/20241113_quick_reset.sql`
5. Then run: `supabase/migrations/20241113_clean_schema.sql`

### Method 3: Direct CLI Commands
```bash
# Reset database
npx supabase db reset

# Apply migrations
npx supabase db push

# Check what's applied
npx supabase migration list
```

## 🔗 Linking Your Project

When you run `npm run supabase:link`, you'll need:

1. **Project Reference ID**: Found in your Supabase dashboard URL
   - Example: `app.supabase.com/project/[THIS-IS-YOUR-REFERENCE]`
   
2. **Database Password**: Found in Settings → Database

3. **Project Name**: Your project's name in Supabase

## 📁 Migration Files

Your project includes these migration files:

- `20241113_clean_schema.sql` - Clean database schema
- `20241113_seed_data.sql` - Development seed data
- `20241113_quick_reset.sql` - Quick reset script
- `20241113_reset_project.sql` - Complete reset script

## 🧪 Testing After Reset

After resetting and applying your schema:

```bash
# Test backend
npm run dev:server

# In another terminal, test API
cd server && npm run smoke-test

# Or test manually
curl http://localhost:3002/api/health
```

## 🚨 Important Notes

1. **Backup First**: Always backup important data before resetting
2. **Development Only**: These scripts are for development environments
3. **Production**: Use proper migration strategies for production
4. **CLI vs SQL**: CLI method is cleaner, SQL method is faster for quick resets

## 🛠️ Troubleshooting

### If linking fails:
```bash
# Check if already linked
npx supabase status

# Force re-link
npx supabase link --project-ref YOUR_PROJECT_REF
```

### If reset fails:
```bash
# Try SQL Editor method instead
# Copy contents of quick_reset.sql to Supabase SQL Editor
```

### If migrations fail:
```bash
# Check migration status
npx supabase migration list

# Apply specific migration
npx supabase migration up 20241113_clean_schema
```

## 📚 Available Scripts

```bash
npm run supabase:init     # Initialize Supabase (already done)
npm run supabase:link     # Link to project
npm run supabase:reset    # Reset database
npm run supabase:push     # Apply migrations
npm run supabase:status   # Check status
```

**Your Supabase CLI is ready to use! Start with linking your project, then you can reset and apply your clean schema.** 🎉