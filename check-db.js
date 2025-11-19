const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  try {
    console.log('\n🔍 Checking database structure...\n');
    
    // Check profiles table structure
    console.log('1. Checking profiles table columns...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('   Sample structure:', profiles[0] || 'No rows');
    }

    // Check auth users (requires service role)
    console.log('\n2. Checking auth users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Auth users error:', usersError.message);
    } else {
      console.log('✅ Auth accessible');
      console.log('   Total users:', users.users.length);
      if (users.users.length > 0) {
        console.log('   Sample user:', users.users[0].email);
      }
    }

    // Try to get table schema info
    console.log('\n3. Trying to create a simple profile...');
    const testId = '00000000-0000-0000-0000-000000000001';
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .upsert({
        id: testId,
        email: 'test@example.com',
        role: 'admin'
      }, {
        onConflict: 'id'
      })
      .select();
    
    if (testError) {
      console.log('❌ Profile insert error:', testError.message);
      console.log('   Details:', testError);
    } else {
      console.log('✅ Profile insert works!');
      console.log('   Data:', testProfile);
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
    }

  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

checkDatabase();
