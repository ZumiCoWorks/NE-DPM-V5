const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
);

async function checkAccountDetails() {
  const userId = '0765b9da-a525-436b-b148-0b3171f7d1d3';
  
  // Get auth user details
  const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Auth User Details:');
    console.log('Email:', authUser.user.email);
    console.log('Created at:', authUser.user.created_at);
    console.log('Email confirmed:', authUser.user.email_confirmed_at ? 'Yes' : 'No');
    console.log('Last sign in:', authUser.user.last_sign_in_at || 'Never');
    console.log('\nUser metadata:', authUser.user.user_metadata);
  }
  
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  console.log('\nProfile created at:', profile?.created_at);

  process.exit(0);
}

checkAccountDetails();
