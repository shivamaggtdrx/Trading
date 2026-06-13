const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('http://localhost:4000/api/instruments');
    console.log('Endpoint responded with status:', res.status);
    console.log('Count of instruments in response:', res.data.instruments?.length);
    if (res.data.instruments && res.data.instruments.length > 0) {
      console.log('First 3 instruments:', res.data.instruments.slice(0, 3));
      const segments = new Set(res.data.instruments.map(i => i.segment));
      console.log('Unique segments in response:', Array.from(segments));
    }
  } catch (err) {
    console.error('Error querying endpoint:', err.message);
  }
}

run();
