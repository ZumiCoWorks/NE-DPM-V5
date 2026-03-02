import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWaitlist() {
  console.log('Testing waitlist insert...');
  const { data, error } = await supabase
    .from('waitlist')
    .insert([
      {
        full_name: 'Test Mobile Bug',
        email: 'testmobile' + Date.now() + '@example.com',
      }
    ]);
  
  if (error) {
    console.error('INSERT ERROR:', error);
  } else {
    console.log('INSERT SUCCESS:', data);
  }
}

testWaitlist();
