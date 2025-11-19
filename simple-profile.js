const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createSimpleProfile() {
  try {
    // Get the existing user
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData.users[0];
    
    console.log('Creating simple profile for:', user.email);
    console.log('User ID:', user.id);
    
    // Try with minimal fields
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        role: 'admin'
      })
      .select();
    
    if (error) {
      console.log('❌ Error:', error.message);
      console.log('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Profile created!');
      console.log('Data:', data);
      console.log('\n🎉 You can now login with:');
      console.log('Email:', user.email);
      console.log('(Use Supabase dashboard to reset password)\n');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSimpleProfile();
