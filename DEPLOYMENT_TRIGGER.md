# Deployment Trigger File
# This file ensures all fixes are deployed to Vercel
# Created: 2025-11-18
# Purpose: Fix database permissions and API endpoints for production deployment

## Changes Made:
1. Fixed service role permissions in Supabase database
2. Updated API endpoints with correct column names
3. Added leads route to main API
4. Configured mobile apps for production API URL
5. Tested all API endpoints successfully

## Database Permissions Fixed:
- Granted service role full access to all tables
- Created RLS policies for service role bypass
- Fixed schema access permissions

## API Endpoints Working:
- GET /api/editor/qr-nodes - QR code lookup for mobile apps
- POST /api/leads - Lead capture for staff mobile app
- GET /api/health - Health check
- All other protected endpoints

## Mobile Apps Configured:
- Both attendee and staff mobile apps use https://naveaze.co.za/api
- Updated to use correct database column names
- Lead capture functionality working

Ready for deployment to naveaze.co.za domain!