require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

async function run() {
  try {
    const { data: allData, error: allErr } = await supabaseAdmin
      .from('instruments')
      .select('id', { count: 'exact', head: true });
    
    if (allErr) {
      console.error('Error fetching total count:', allErr);
    } else {
      console.log('Total instruments in DB:', allData);
    }

    const { data: activeData, error: activeErr } = await supabaseAdmin
      .from('instruments')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
      
    if (activeErr) {
      console.error('Error fetching active count:', activeErr);
    } else {
      console.log('Active instruments in DB:', activeData);
    }

    const { data: samples, error: sampleErr } = await supabaseAdmin
      .from('instruments')
      .select('*')
      .limit(5);

    if (sampleErr) {
      console.error('Error fetching sample instruments:', sampleErr);
    } else {
      console.log('Sample instruments:', samples);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
