const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
);

async function checkRLS() {
  console.log('Checking RLS policies on profiles table...\n');
  
  // Check with service role (should work)
  const { data: serviceData, error: serviceError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '0765b9da-a525-436b-b148-0b3171f7d1d3')
    .single();
  
  console.log('Service role query:');
  console.log('Data:', serviceData ? 'SUCCESS' : 'FAILED');
  console.log('Error:', serviceError);
  
  // Check if RLS is enabled
  const { data: policies } = await supabase.rpc('exec', {
    query: `
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'profiles' AND schemaname = 'public'
    `
  }).single();
  
  console.log('\nRLS status:', policies);
  
  process.exit(0);
}

checkRLS();
