#!/bin/bash

# Reset Supabase Project using CLI from dpm-web folder
# This script uses the Supabase CLI installed in the original project

echo "🔄 Resetting Supabase Project using CLI from dpm-web folder"
echo "==========================================================="

# Navigate to the folder with Supabase CLI
ORIGINAL_DIR="/Users/zumiww/Documents/NE DPM V5/dpm-web"
NEW_DIR="/Users/zumiww/Documents/NE DPM V5/dpm-web-new"

echo "📍 Using Supabase CLI from: $ORIGINAL_DIR"
echo "📁 New project location: $NEW_DIR"

# Check if Supabase CLI is available in original folder
if [ ! -f "$ORIGINAL_DIR/supabase/config.toml" ]; then
    echo "❌ Supabase not initialized in $ORIGINAL_DIR"
    echo "Please run 'npx supabase init' in $ORIGINAL_DIR first"
    exit 1
fi

echo ""
echo "⚠️  WARNING: This will reset your Supabase database!"
echo "All data will be lost. Continue? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 0
fi

echo ""
echo "Step 1: Resetting database..."
cd "$ORIGINAL_DIR"
npx supabase db reset

if [ $? -ne 0 ]; then
    echo "❌ Database reset failed"
    exit 1
fi

echo "✅ Database reset successful"

echo ""
echo "Step 2: Copying migrations to new project..."
cd "$NEW_DIR"

# Ensure supabase directory exists
mkdir -p supabase/migrations

echo "✅ Ready to apply clean schema"

echo ""
echo "Step 3: Instructions for applying your clean schema:"
echo ""
echo "Option A: Use Supabase Dashboard"
echo "1. Go to https://app.supabase.com"
echo "2. Select your project"
echo "3. Go to SQL Editor"
echo "4. Copy and paste the contents of:"
echo "   - $NEW_DIR/supabase/migrations/20241113_clean_schema.sql"
echo "   - $NEW_DIR/supabase/migrations/20241113_seed_data.sql"
echo "5. Run each file in order"
echo ""
echo "Option B: Use Supabase CLI (if linked)"
echo "1. Link your project: npx supabase link"
echo "2. Push migrations: npx supabase db push"
echo ""
echo "Option C: Quick SQL Reset (if you want to start fresh)"
echo "Run this in SQL Editor:"
echo "DROP TABLE IF EXISTS map_qr_nodes, floorplans, ar_campaigns, events, venues, profiles CASCADE;"
echo ""
echo "✨ Reset process initiated! Choose your preferred method to apply the clean schema."