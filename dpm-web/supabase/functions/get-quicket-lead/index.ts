// Supabase Edge Function: get-quicket-lead
// Fetches lead information from Quicket API using stored API key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { ticket_id, event_id } = await req.json()
    
    if (!ticket_id) {
      return new Response(
        JSON.stringify({ error: 'ticket_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Quicket API key from settings
    // Note: In production, store this in a secure settings table linked to the event/organization
    const quicketApiKey = Deno.env.get('QUICKET_API_KEY') || ''
    
    // Alternative: Retrieve from sessionStorage (passed as parameter) or database
    // For now, we'll accept it as an optional parameter
    const apiKeyFromRequest = req.headers.get('X-Quicket-Api-Key')
    const apiKey = apiKeyFromRequest || quicketApiKey

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Quicket API key not configured. Please set it in Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make request to Quicket API
    // Note: Adjust the endpoint based on actual Quicket API documentation
    const quicketResponse = await fetch(`https://api.quicket.co.za/api/tickets/${ticket_id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!quicketResponse.ok) {
      console.error('Quicket API error:', await quicketResponse.text())
      return new Response(
        JSON.stringify({ error: 'Failed to fetch ticket data from Quicket' }),
        { status: quicketResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ticketData = await quicketResponse.json()

    // Extract name and email from Quicket response
    // Note: Adjust field names based on actual Quicket API response structure
    const leadName = ticketData.attendee?.name || ticketData.buyer_name || 'Unknown'
    const leadEmail = ticketData.attendee?.email || ticketData.buyer_email || ''

    return new Response(
      JSON.stringify({
        name: leadName,
        email: leadEmail,
        ticket_id: ticket_id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-quicket-lead function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
