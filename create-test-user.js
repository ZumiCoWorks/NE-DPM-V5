const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM';

console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', serviceRoleKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('\n1. Creating auth user...');
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@admin.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin',
        name: 'Test Admin'
      }
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError.message);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Manually create profile
    console.log('\n2. Creating profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: 'test@admin.com',
        full_name: 'Test Admin',
        name: 'Test Admin',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('❌ Profile creation error:', profileError.message);
    } else {
      console.log('✅ Profile created successfully!');
    }

    console.log('\n✅ Test user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: test@admin.com');
    console.log('🔑 Password: test123456');
    console.log('👤 User ID:', authData.user.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

createTestUser();
