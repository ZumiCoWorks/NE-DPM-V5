// supabase/functions/ping-location/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("ping-location function initialized");

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure the request is a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the poiId from the request body.
    const { poiId } = await req.json();

    // Validate that poiId was provided.
    if (!poiId) {
      return new Response(JSON.stringify({ error: 'poiId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the user's authentication context.
    // The user must be authenticated to call this function.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Update the specific POI in the database.
    const { data, error } = await supabaseClient
      .from('pois')
      .update({
        is_active: true,
        last_pinged_at: new Date().toISOString(),
      })
      .eq('id', poiId)
      .select()
      .single();

    if (error) {
      console.error('Supabase DB error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Since this is for F's Uniforms, let's add a special log.
    console.log(`Successfully pinged POI: ${poiId}. Location is now active for a vendor.`);

    // Return a success response.
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
