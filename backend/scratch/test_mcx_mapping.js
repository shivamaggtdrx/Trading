/**
 * test_mcx_mapping.js
 */

const axios = require('axios');

async function loadMcxMappings() {
  console.log('Downloading Fyers MCX Symbol Master CSV...');
  const res = await axios.get('https://public.fyers.in/sym_details/MCX_COM.csv', { timeout: 15000 });
  const data = res.data;
  if (!data) throw new Error('Empty CSV data');

  const lines = data.split('\n');
  console.log(`Total lines in CSV: ${lines.length}`);

  const commodityContracts = {}; // baseSymbol -> list of contracts

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length < 14) continue;

    const fyersSymbol = parts[9]?.trim();  // e.g. MCX:GOLD26JUNFUT
    const expiryEpoch = parseInt(parts[8]?.trim()) || 0; // e.g. 1782324000
    const baseSymbol  = parts[13]?.trim(); // e.g. GOLD
    const segment     = parseInt(parts[11]?.trim()) || 0; // e.g. 20 (Futures)

    if (!fyersSymbol || !baseSymbol || !expiryEpoch) continue;

    // Filter to futures only (ends in FUT)
    if (!fyersSymbol.endsWith('FUT')) continue;

    if (!commodityContracts[baseSymbol]) {
      commodityContracts[baseSymbol] = [];
    }
    commodityContracts[baseSymbol].push({ fyersSymbol, expiryEpoch });
  }

  const nowEpoch = Math.floor(Date.now() / 1000);
  const activeMappings = {};

  for (const [baseSymbol, contracts] of Object.entries(commodityContracts)) {
    // Filter out expired contracts
    const activeContracts = contracts.filter(c => c.expiryEpoch >= nowEpoch - 86400); // allow 1 day grace
    if (activeContracts.length === 0) continue;

    // Sort by expiry epoch ascending to get the near-month contract
    activeContracts.sort((a, b) => a.expiryEpoch - b.expiryEpoch);

    // The near-month (active) contract is the first one
    activeMappings[baseSymbol] = activeContracts[0].fyersSymbol;
  }

  return activeMappings;
}

async function main() {
  try {
    const mappings = await loadMcxMappings();
    console.log('\n--- Active MCX Mappings (Near-Month Futures) ---');
    const testSymbols = ['GOLD', 'GOLDM', 'SILVER', 'SILVERM', 'SILVERMIC', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ALUMINIUM'];
    for (const sym of testSymbols) {
      console.log(`${sym} => ${mappings[sym] || 'NOT FOUND'}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
