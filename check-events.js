const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
);

async function checkEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(10);
  
  console.log('Events data:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nError:', error);
  
  if (data && data.length > 0) {
    console.log('\nFirst event organizer_id:', data[0].organizer_id);
  }
  
  process.exit(0);
}

checkEvents();
