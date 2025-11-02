import { createClient } from '@supabase/supabase-js';

// Supabase client wrapper for the scaffold web app.
// Reads URL/KEY from env (REACT_APP_* for Vite/CRA or SUPABASE_* for other runners).
const URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || '';
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(URL, KEY);

export async function uploadFloorplan(file) {
  if (!file) throw new Error('No file provided');
  if (!URL || !KEY) throw new Error('Supabase not configured (no URL/KEY)');

  const fileExt = (file.name || 'img').split('.').pop();
  const fileName = `floorplan_${Date.now()}_${Math.random().toString(36).slice(2,9)}.${fileExt}`;

  const { data, error } = await supabase.storage.from('floorplans').upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from('floorplans').getPublicUrl(data.path);
  if (!publicUrlData || !publicUrlData.publicUrl) throw new Error('Failed to get public URL from Supabase');
  return publicUrlData.publicUrl;
}

export default supabase;
