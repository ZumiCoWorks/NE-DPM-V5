// /supabase/functions/vendor-signup/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Interface for the expected request body from the DPM
interface VendorSignupPayload {
  email: string;
  event_id: string; // The UUID of the event the vendor is associated with
  vendor_name: string;
}

console.log("vendor-signup function initialized");

Deno.serve(async (req) => {
  // This is needed for the browser to make a CORS request.
  // The preflight request will be handled here.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate environment variables for the NE App project
    const neAppSupabaseUrl = Deno.env.get('NE_APP_SUPABASE_URL');
    const neAppServiceRoleKey = Deno.env.get('NE_APP_SERVICE_ROLE_KEY');

    if (!neAppSupabaseUrl || !neAppServiceRoleKey) {
      throw new Error('Missing required environment variables for NavEaze App connection.');
    }

    // 2. Extract and validate the POST body
    const payload: VendorSignupPayload = await req.json();
    const { email, event_id, vendor_name } = payload;

    if (!email || !event_id || !vendor_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, event_id, and vendor_name are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. Create a Supabase admin client to interact with the NE App's database
    const supabaseAdmin = createClient(
      neAppSupabaseUrl,
      neAppServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. Invite the user to the NE App. This creates an auth user and generates a link.
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            // This metadata will be attached to the user in the NE App's auth schema
            role: 'vendor',
            full_name: vendor_name,
            // We pre-associate the user with an event and a vendor name.
            // The NE App will use this data to create a 'profiles' entry on first login.
            event_id: event_id,
            vendor_name: vendor_name
          }
        }
    );

    if (inviteError) {
      console.error('Error inviting user:', inviteError);
      // Check for a specific error if the user already exists
      if (inviteError.message.includes('User already registered')) {
         return new Response(JSON.stringify({ error: 'A user with this email already exists.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409, // 409 Conflict is appropriate here
        });
      }
      throw inviteError; // For other errors, let the generic handler catch it
    }

    console.log(`Successfully invited vendor: ${email}`);
    
    // Note: The magic link is sent via email by Supabase Auth automatically.
    // The response to the DPM confirms the action was successful.
    return new Response(JSON.stringify({
      message: `Successfully sent sign-up invitation to ${email}.`,
      user_id: inviteData.user.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});