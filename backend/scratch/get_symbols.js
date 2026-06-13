const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('http://localhost:4000/api/instruments');
    if (res.data.instruments) {
      const grouped = {};
      res.data.instruments.forEach(i => {
        if (!grouped[i.segment]) grouped[i.segment] = [];
        grouped[i.segment].push(i.symbol);
      });
      console.log('Grouped symbols in DB:');
      for (const [seg, syms] of Object.entries(grouped)) {
        console.log(`- ${seg} (${syms.length}): ${syms.slice(0, 10).join(', ')}...`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
