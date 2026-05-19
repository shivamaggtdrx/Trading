require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function test() {
  try {
    console.log('Querying instruments...');
    const { data, error } = await supabaseAdmin
      .from('instruments')
      .select('symbol')
      .eq('is_active', true);
    
    if (error) {
      console.error('Query Error:', error);
    } else {
      console.log(`Success! Found ${data ? data.length : 0} active instruments.`);
      if (data && data.length > 0) {
        console.log('All symbols:', data.map(d => d.symbol));
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
  process.exit(0);
}

test();
