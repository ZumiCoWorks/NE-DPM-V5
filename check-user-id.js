const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
);

async function checkUser() {
  // Check all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
  
  console.log('Profiles:');
  console.log(JSON.stringify(profiles, null, 2));
  
  // Find test user
  const testUser = profiles?.find(p => p.email === 'test+postman@example.com');
  console.log('\nTest user ID:', testUser?.id);
  
  // Check event organizer
  const eventOrganizerId = '0765b9da-a525-436b-b148-0b3171f7d1d3';
  console.log('Event organizer_id:', eventOrganizerId);
  console.log('Match:', testUser?.id === eventOrganizerId);
  
  process.exit(0);
}

checkUser();
