#!/bin/bash

# Local Supabase CLI Reset Script for dpm-web-new
# Uses the locally installed Supabase CLI

echo "🔄 Supabase Reset using Local CLI"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Supabase not initialized. Run 'npx supabase init' first."
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "🔧 Using local Supabase CLI"

echo ""
echo "⚠️  WARNING: This will completely reset your Supabase database!"
echo "All data will be permanently lost. Continue? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 0
fi

echo ""
echo "🗑️  Resetting database..."
npx supabase db reset

if [ $? -eq 0 ]; then
    echo "✅ Database reset successful!"
    echo ""
    echo "📋 Next steps:"
    echo ""
    echo "Option A: Use Supabase Dashboard (Recommended)"
    echo "1. Go to https://app.supabase.com"
    echo "2. Select your project"
    echo "3. Go to SQL Editor"
    echo "4. Copy and paste: supabase/migrations/20241113_clean_schema.sql"
    echo "5. Run the query"
    echo ""
    echo "Option B: Quick SQL Reset"
    echo "Copy this into SQL Editor:"
    echo ""
    cat supabase/migrations/20241113_quick_reset.sql
    echo ""
    echo "Option C: Link and Push (if project is linked)"
    echo "1. Link project: npx supabase link"
    echo "2. Push migrations: npx supabase db push"
    echo ""
    echo "✨ Reset complete! Your database is now clean."
else
    echo "❌ Database reset failed"
    echo "💡 Try using the SQL Editor method instead"
    exit 1
fi