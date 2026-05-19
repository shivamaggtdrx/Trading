const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function run() {
  try {
    console.log('Fetching RELIANCE.NS details from Yahoo Finance...');
    const result = await yahooFinance.quote('RELIANCE.NS');
    console.log('Quote values:', {
      symbol: result.symbol,
      shortName: result.shortName,
      isin: result.isin || result.ISIN || 'Not found'
    });
    
    // Let's also check quoteSummary
    const summary = await yahooFinance.quoteSummary('RELIANCE.NS', { modules: ['financialData', 'price', 'summaryDetail'] });
    console.log('Summary price keys:', Object.keys(summary.price || {}));
  } catch (err) {
    console.error('Yahoo Finance failed:', err.message);
  }
  process.exit(0);
}

run();
