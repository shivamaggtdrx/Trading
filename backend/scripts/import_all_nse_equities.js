require('dotenv').config();
const axios = require('axios');
const zlib = require('zlib');
const { supabaseAdmin } = require('../src/config/supabase');

async function run() {
  try {
    console.log('1. Querying existing symbols from Supabase...');
    const existingSymbols = new Set();
    let page = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from('instruments')
        .select('symbol')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        data.forEach(d => existingSymbols.add(d.symbol.toUpperCase()));
        console.log(`Fetched page ${page + 1} (${data.length} symbols)`);
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }
    console.log(`Found ${existingSymbols.size} existing symbols in database.`);

    console.log('2. Downloading NSE master list from Upstox...');
    const response = await axios.get('https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz', {
      responseType: 'arraybuffer'
    });
    
    console.log('Decompressing and parsing...');
    const decompressed = zlib.gunzipSync(response.data);
    const instruments = JSON.parse(decompressed.toString('utf8'));
    
    console.log('Filtering clean liquid equities...');
    const rawEquities = instruments.filter(i => i.segment === 'NSE_EQ');
    
    // Ensure uniqueness in the source list
    const uniqueSourceStocks = new Map();
    rawEquities.forEach(i => {
      const sym = i.trading_symbol.toUpperCase();
      const name = i.name || '';
      
      // Symbol must be alphabetical (A-Z) only, no numbers, no special chars
      const isPureAlpha = /^[A-Z\-]+$/.test(sym);
      if (!isPureAlpha) return;
      
      // Filter out debt/bonds/SDLs/ETFs
      if (name.includes('SDL') || name.includes('GOI') || name.includes('GR ') || name.includes('GS ') || name.includes('BOND') || name.includes('DEBENTURE')) return;
      if (name.includes(' Gilt ') || name.includes(' Liquid ') || name.includes(' ETF ') || name.endsWith('ETF')) return;
      if (sym.endsWith('ETF') || sym.endsWith('BEES') || sym.endsWith('GILT') || sym.includes('GOLD')) return;
      if (sym.length > 10) return; // Stock symbols are short
      
      // Keep only one entry per unique symbol
      if (!uniqueSourceStocks.has(sym)) {
        uniqueSourceStocks.set(sym, i);
      }
    });

    console.log(`Found ${uniqueSourceStocks.size} unique clean equities in Upstox master.`);
    
    // Filter out already existing symbols
    const newStocksToInsert = Array.from(uniqueSourceStocks.values()).filter(s => !existingSymbols.has(s.trading_symbol.toUpperCase()));
    console.log(`Identified ${newStocksToInsert.length} new unique stocks to insert.`);

    if (newStocksToInsert.length === 0) {
      console.log('No new stocks to insert. Database is already up to date!');
      process.exit(0);
    }

    // Map to db format
    const rows = newStocksToInsert.map(s => ({
      symbol: s.trading_symbol.toUpperCase(),
      name: s.name,
      segment: 'nse_equity',
      instrument_type: 'spot',
      base_price: 100.0,
      last_price: 100.0,
      bid_price: 100.0,
      ask_price: 100.0,
      day_open: 100.0,
      day_high: 100.0,
      day_low: 100.0,
      prev_close: 100.0,
      change_amount: 0.0,
      change_percent: 0.0,
      volume: 0,
      lot_size: 1,
      tick_size: 0.05,
      margin_required: 20.0,
      max_leverage: 5.0,
      base_spread: 0.0,
      spread_multiplier: 1.0,
      circuit_upper_pct: 10.0,
      circuit_lower_pct: 10.0,
      is_active: true,
      trading_enabled: true,
      buy_enabled: true,
      sell_enabled: true,
      long_swap_rate: 0.0,
      short_swap_rate: 0.0,
      exchange: 'NSE',
      currency: 'INR'
    }));

    // Insert in batches of 100
    const BATCH_SIZE = 100;
    console.log(`Inserting ${rows.length} rows in batches of ${BATCH_SIZE}...`);
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabaseAdmin
        .from('instruments')
        .insert(batch);
        
      if (error) {
        console.error(`Error inserting batch starting at index ${i}:`, error.message);
      } else {
        console.log(`Successfully inserted batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(rows.length / BATCH_SIZE)} (${batch.length} stocks)`);
      }
    }
    
    console.log('NSE Equities import completed successfully!');
  } catch (err) {
    console.error('Import failed with exception:', err);
  }
  process.exit(0);
}

run();
