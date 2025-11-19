const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixExistingUsers() {
  try {
    console.log('\n🔧 Creating profiles for existing auth users...\n');
    
    // Get all auth users
    const { data: userData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError.message);
      return;
    }

    console.log(`Found ${userData.users.length} user(s)\n`);

    for (const user of userData.users) {
      console.log(`Processing: ${user.email}`);
      
      // Check if profile exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existing) {
        console.log('  ✅ Profile already exists\n');
        continue;
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: 'admin'
        })
        .select();

      if (profileError) {
        console.log('  ❌ Error creating profile:', profileError.message);
      } else {
        console.log('  ✅ Profile created successfully!');
      }
      console.log('');
    }

    // Now create a new test user with password we know
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Creating new test user...\n');
    
    const { data: newUser, error: newUserError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        name: 'Admin User'
      }
    });

    if (newUserError) {
      console.log('❌ Could not create new user:', newUserError.message);
      console.log('\nYou can use the existing user instead:');
      console.log('Email:', userData.users[0].email);
      console.log('(Password: unknown - use password reset)\n');
    } else {
      console.log('✅ New user created!');
      console.log('\n🎉 You can now login with:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: admin@test.com');
      console.log('🔑 Password: admin123456');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

fixExistingUsers();
