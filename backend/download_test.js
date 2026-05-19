const axios = require('axios');
const fs = require('fs');

async function run() {
  try {
    console.log('Downloading NSE instruments from Upstox...');
    const response = await axios.get('https://api.upstox.com/v2/instruments/NSE', {
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream('nse_instruments.csv');
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log('Download complete! Reading first 5 lines...');
      const lines = fs.readFileSync('nse_instruments.csv', 'utf8').split('\n').slice(0, 5);
      console.log(lines.join('\n'));
      process.exit(0);
    });
  } catch (err) {
    console.error('Download failed:', err.message);
    process.exit(1);
  }
}

run();
