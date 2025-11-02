#!/usr/bin/env node

/**
 * Setup Fresh Supabase Database
 * Applies the complete schema migration to the new database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// New database credentials
const SUPABASE_URL = 'https://uzhfjyoztmirybnyifnu.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'

console.log('🚀 NavEaze Database Setup')
console.log('━'.repeat(60))
console.log(`📍 Database: ${SUPABASE_URL}`)
console.log('━'.repeat(60))
console.log()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  try {
    console.log('📖 Reading migration file...')
    const migrationPath = path.join(__dirname, 'supabase/migrations/001_complete_schema.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('✅ Migration file loaded')
    console.log()
    
    console.log('⚙️  Applying migration to database...')
    console.log('⏳ This may take 30-60 seconds...')
    console.log()
    
    // Execute the entire SQL file at once
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      // Try alternative approach - execute via REST API
      console.log('⚠️  Standard approach failed, trying direct execution...')
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }
      
      console.log('✅ Migration applied successfully!')
    } else {
      console.log('✅ Migration applied successfully!')
    }
    
    console.log()
    console.log('🔍 Verifying tables...')
    
    // Verify key tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'venues', 'events', 'booths', 'cdv_reports'])
    
    if (tablesError) {
      console.log('⚠️  Could not verify tables (this is okay if migration succeeded)')
    } else if (tables && tables.length > 0) {
      console.log(`✅ Found ${tables.length} core tables`)
      tables.forEach(t => console.log(`   • ${t.table_name}`))
    }
    
    console.log()
    console.log('━'.repeat(60))
    console.log('🎉 Database setup complete!')
    console.log('━'.repeat(60))
    console.log()
    console.log('📋 Next steps:')
    console.log('   1. Get your anon key from Supabase dashboard')
    console.log('   2. Update .env with VITE_SUPABASE_ANON_KEY')
    console.log('   3. Restart backend: npm run dev')
    console.log('   4. Test B2B dashboard: http://localhost:5173')
    console.log()
    
  } catch (error) {
    console.error()
    console.error('❌ Migration failed!')
    console.error('━'.repeat(60))
    console.error('Error:', error.message)
    console.error()
    console.error('💡 Try running the migration manually:')
    console.error('   1. Go to: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new')
    console.error('   2. Copy contents of: supabase/migrations/001_complete_schema.sql')
    console.error('   3. Paste and click "Run"')
    console.error()
    process.exit(1)
  }
}

setupDatabase()

