// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL from .env:", supabaseUrl);
console.log("Supabase Anon Key from .env (first 10 chars):", supabaseAnonKey ? supabaseAnonKey.substring(0, 10) : 'N/A');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key are not loaded. Check your .env file and VITE_ prefixes.");
  alert("Supabase configuration missing. Check console for details.");
}

// Ensure the apikey header is always sent; some environments strip headers unexpectedly.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function getPublicUrl(imagePath) {
  // Remove any leading 'public/' if present
  const cleanedPath = imagePath.replace(/^public\//, '');
  // Do NOT remove 'floorplans/' if it's part of your bucket structure!
  const { data } = supabase.storage.from('floorplans').getPublicUrl(cleanedPath);
  return data.publicUrl;
}