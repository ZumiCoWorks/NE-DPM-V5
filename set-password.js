const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setPassword() {
  try {
    const userId = '448166fb-39fe-4dc9-b4fd-db2f12d34a3c';
    
    console.log('Setting password for user:', userId);
    
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: 'test123456' }
    );
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Password updated!');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 You can now login with:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: test+postman@example.com');
      console.log('🔑 Password: test123456');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setPassword();
