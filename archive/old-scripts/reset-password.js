const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function resetPassword() {
  const userId = '0765b9da-a525-436b-b148-0b3171f7d1d3';
  const email = 'tlotlo@zcollabworks.co.za';
  const newPassword = 'Password123!';

  console.log('Resetting password for:', email);
  console.log('User ID:', userId);

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n✅ Password reset successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('========================\n');
  }

  process.exit(0);
}

resetPassword();
