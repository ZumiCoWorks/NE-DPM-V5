const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function applyRLSFix() {
  console.log('Applying RLS policies fix...\n');
  
  const sql = fs.readFileSync(path.join(__dirname, 'fix-rls-policies.sql'), 'utf8');
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (!statement.trim()) continue;
    
    console.log('Executing:', statement.substring(0, 50) + '...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('✅ Success');
    }
  }
  
  console.log('\n✅ RLS policies updated!');
  console.log('\nNow try refreshing your browser.');
  
  process.exit(0);
}

applyRLSFix();
