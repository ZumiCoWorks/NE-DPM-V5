#!/bin/bash

# Link Supabase Project Script
# This connects your local project to your remote Supabase instance

echo "🔗 Linking Supabase Project"
echo "============================"

echo "📋 You'll need:"
echo "1. Your Supabase project reference ID"
echo "2. Your database password"
echo ""
echo "To find these:"
echo "- Go to https://app.supabase.com"
echo "- Select your project"
echo "- Project reference is in the URL: app.supabase.com/project/[REFERENCE_ID]"
echo "- Database password is in Settings → Database"
echo ""

echo "Proceed with linking? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Linking cancelled"
    exit 0
fi

echo ""
echo "🔄 Running: npx supabase link"
npx supabase link

if [ $? -eq 0 ]; then
    echo "✅ Project linked successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Apply migrations: npx supabase db push"
    echo "2. Reset if needed: ./reset-local.sh"
    echo "3. Test your API endpoints"
else
    echo "❌ Linking failed"
    echo "💡 Make sure you have the correct project reference and password"
fi