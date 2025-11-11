const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './dpm-web/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing. Make sure to set them in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const seedUser = async () => {
  const email = 'admin@naveaze.com';
  const password = 'password';

  // Check if user already exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log('Test user already exists. Skipping creation.');
    // Optionally, you could update the user's password here if needed
    // const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    //   existingUser.id,
    //   { password: password }
    // );
    // if (updateError) {
    //   console.error('Error updating user password:', updateError);
    // } else {
    //   console.log('Test user password updated.');
    // }
    return;
  }

  // Create user
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm email
  });

  if (createError) {
    console.error('Error creating user:', createError);
    return;
  }

  if (!user) {
    console.error('User object was not returned after creation.');
    return;
  }

  console.log('Successfully created user:', user.email);

  // Insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      role: 'admin' // Default role
    });

  if (profileError) {
    console.error('Error creating profile for user:', profileError);
  } else {
    console.log('Successfully created profile for user:', user.email);
  }
};

seedUser();
