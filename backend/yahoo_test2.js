const yf = require('yahoo-finance2');
console.log('yf keys:', Object.keys(yf));
console.log('yf.default keys:', yf.default ? Object.keys(yf.default) : 'none');
if (yf.default && typeof yf.default === 'function') {
  console.log('yf.default is a class');
}
process.exit(0);
