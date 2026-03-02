import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing insert on safety_alerts with anon key...');
    const { data, error } = await supabase.from('safety_alerts').insert({
        event_id: 'demo-event-001',
        user_id: 'E2ESOS',
        type: 'sos',
        status: 'new',
        gps_lat: null,
        gps_lng: null
    });

    if (error) {
        console.error('INSERT ERROR:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

testInsert();
