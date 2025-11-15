#!/bin/bash

# Direct Supabase Reset using CLI from dpm-web folder
# Run this from dpm-web-new directory

echo "🔄 Direct Supabase Reset using CLI"
echo "===================================="

# Navigate to original project with CLI
cd "/Users/zumiww/Documents/NE DPM V5/dpm-web"

echo "📍 Using CLI from: $(pwd)"

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
    echo "📝 Next steps:"
    echo "1. Go to Supabase Dashboard SQL Editor"
    echo "2. Copy and run the clean schema from:"
    echo "   /Users/zumiww/Documents/NE DPM V5/dpm-web-new/supabase/migrations/20241113_clean_schema.sql"
    echo ""
    echo "Or use the quick reset command:"
    echo "DROP TABLE IF EXISTS map_qr_nodes, floorplans, ar_campaigns, events, venues, profiles CASCADE;"
else
    echo "❌ Database reset failed"
    exit 1
fi