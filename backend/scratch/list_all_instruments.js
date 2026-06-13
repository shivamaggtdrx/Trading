const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('http://localhost:4000/api/instruments');
    if (res.data.instruments) {
      const grouped = {};
      res.data.instruments.forEach(i => {
        if (!grouped[i.segment]) grouped[i.segment] = [];
        grouped[i.segment].push(`${i.symbol} (${i.name || i.symbol})`);
      });
      for (const [seg, list] of Object.entries(grouped)) {
        console.log(`=== ${seg} (${list.length}) ===`);
        console.log(list.join('\n'));
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
