import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Need service role for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('🔧 Applying RLS policy fixes...\n');

const sql = readFileSync('./fix-navigation-rls.sql', 'utf-8');

// Split by statement (simple approach)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  if (!statement) continue;
  
  console.log('Executing:', statement.substring(0, 80) + '...');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
  
  if (error) {
    // Try direct approach
    const { error: err2 } = await supabase.from('_sql').select().limit(0);
    console.log('⚠️  Note: May need to run SQL in Supabase Dashboard');
  }
}

console.log('\n✅ SQL ready to apply!');
console.log('\n📋 Next steps:');
console.log('1. Go to: https://supabase.com/dashboard/project/uzhfjyoztmirybnyifnu/sql/new');
console.log('2. Copy the contents of fix-navigation-rls.sql');
console.log('3. Paste and run in the SQL Editor');
console.log('4. Test the mobile app again');
