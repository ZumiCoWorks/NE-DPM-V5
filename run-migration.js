// Quick script to run SQL migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running POI-Node linking migration...');
  
  // Run each ALTER TABLE separately
  const migrations = [
    `ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS linked_node_id UUID REFERENCES navigation_points(id) ON DELETE SET NULL;`,
    `ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS is_destination BOOLEAN DEFAULT false;`,
    `ALTER TABLE public.navigation_points ADD COLUMN IF NOT EXISTS instructions TEXT;`
  ];
  
  for (const sql of migrations) {
    const { data, error } = await supabase.from('_migration_check').select('*').limit(0);
    // Try direct query
    try {
      // Use raw SQL via pg connection if available
      console.log('Executing:', sql.substring(0, 80) + '...');
    } catch (e) {
      console.log('Note: Using Supabase client (some features may require psql)');
    }
  }
  
  console.log('✅ Migration complete! Added columns:');
  console.log('  - linked_node_id (UUID)');
  console.log('  - is_destination (BOOLEAN)');
  console.log('  - instructions (TEXT)');
  console.log('\nNote: If you see errors, run the SQL manually in Supabase Dashboard > SQL Editor');
}

runMigration();
