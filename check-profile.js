const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
);

async function checkProfile() {
  const userId = '0765b9da-a525-436b-b148-0b3171f7d1d3';
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  console.log('Profile data:');
  console.log('first_name:', profile?.first_name);
  console.log('last_name:', profile?.last_name);
  
  process.exit(0);
}

checkProfile();
