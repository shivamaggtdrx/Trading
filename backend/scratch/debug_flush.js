const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config({ path: 'c:/Users/HP/Desktop/Trading Company Project/backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const { loadFromDatabase: loadSymbolMap, getInstrumentDetails, getActiveSymbols } = require('../src/services/symbolMap');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Loading symbol map from DB...');
  await loadSymbolMap();
  
  const symbols = getActiveSymbols();
  console.log(`Loaded ${symbols.length} symbols.`);
  
  let nullNamesCount = 0;
  let undefinedNamesCount = 0;
  
  for (const symbol of symbols) {
    const details = getInstrumentDetails(symbol);
    const name = details?.name || symbol;
    const segment = details?.segment || 'nse_equity';
    
    if (name === null) {
      nullNamesCount++;
      console.log(`Null name for symbol: ${symbol}`, details);
    }
    if (name === undefined) {
      undefinedNamesCount++;
      console.log(`Undefined name for symbol: ${symbol}`, details);
    }
  }
  
  console.log(`Results: Null names: ${nullNamesCount}, Undefined names: ${undefinedNamesCount}`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
