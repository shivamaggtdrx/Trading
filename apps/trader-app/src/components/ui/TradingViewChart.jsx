import { useEffect, useRef, memo } from 'react';

// ── Symbol Mapping: Internal → TradingView ──
function toTradingViewSymbol(symbol) {
  if (!symbol) return 'NSE:NIFTY';

  // Crypto (Binance) — symbols ending in USDT
  if (symbol.endsWith('USDT')) return `BINANCE:${symbol}`;

  // ── Direct lookup table (highest priority) ──
  const directMap = {
    // Indian Indices
    'NIFTY50': 'NSE:NIFTY',
    'NIFTY': 'NSE:NIFTY',
    'BANKNIFTY': 'NSE:NIFTYBANK',

    // Forex pairs
    'EURUSD': 'OANDA:EURUSD', 'GBPUSD': 'OANDA:GBPUSD', 'USDJPY': 'OANDA:USDJPY',
    'AUDUSD': 'OANDA:AUDUSD', 'USDCAD': 'OANDA:USDCAD', 'USDCHF': 'OANDA:USDCHF',
    'NZDUSD': 'OANDA:NZDUSD', 'EURGBP': 'OANDA:EURGBP', 'EURJPY': 'OANDA:EURJPY',
    'GBPJPY': 'OANDA:GBPJPY', 'USDINR': 'OANDA:USDINR',

    // Commodities / Metals
    'XAUUSD': 'OANDA:XAUUSD',    // Gold
    'XAGUSD': 'OANDA:XAGUSD',    // Silver
    'GOLD': 'OANDA:XAUUSD',
    'SILVER': 'OANDA:XAGUSD',
    'CRUDEOIL': 'TVC:USOIL',
    'NATURALGAS': 'TVC:NATURALGAS',
    'COPPER': 'COMEX:HG1!',

    // US Stocks — NASDAQ
    'AAPL': 'NASDAQ:AAPL', 'MSFT': 'NASDAQ:MSFT', 'GOOGL': 'NASDAQ:GOOGL',
    'AMZN': 'NASDAQ:AMZN', 'TSLA': 'NASDAQ:TSLA', 'META': 'NASDAQ:META',
    'NVDA': 'NASDAQ:NVDA', 'NFLX': 'NASDAQ:NFLX', 'AMD': 'NASDAQ:AMD',
    'INTC': 'NASDAQ:INTC', 'CSCO': 'NASDAQ:CSCO', 'PEP': 'NASDAQ:PEP',
    'PYPL': 'NASDAQ:PYPL', 'ADBE': 'NASDAQ:ADBE', 'AVGO': 'NASDAQ:AVGO',
    'COST': 'NASDAQ:COST', 'ABNB': 'NASDAQ:ABNB', 'COIN': 'NASDAQ:COIN',
    'RIVN': 'NASDAQ:RIVN', 'SOFI': 'NASDAQ:SOFI', 'MRNA': 'NASDAQ:MRNA',
    'SBUX': 'NASDAQ:SBUX', 'QCOM': 'NASDAQ:QCOM',
    // US Stocks — NYSE
    'JPM': 'NYSE:JPM', 'V': 'NYSE:V', 'WMT': 'NYSE:WMT',
    'DIS': 'NYSE:DIS', 'BA': 'NYSE:BA', 'PFE': 'NYSE:PFE',
    'KO': 'NYSE:KO', 'NKE': 'NYSE:NKE', 'UBER': 'NYSE:UBER',
    'CRM': 'NYSE:CRM', 'ORCL': 'NYSE:ORCL', 'SQ': 'NYSE:SQ',
    'SNAP': 'NYSE:SNAP', 'SHOP': 'NYSE:SHOP', 'PLTR': 'NYSE:PLTR',
    'JNJ': 'NYSE:JNJ', 'XOM': 'NYSE:XOM', 'CVX': 'NYSE:CVX',
    'HD': 'NYSE:HD', 'MA': 'NYSE:MA', 'UNH': 'NYSE:UNH',
    'BAC': 'NYSE:BAC', 'ABBV': 'NYSE:ABBV', 'MCD': 'NYSE:MCD',
    'LLY': 'NYSE:LLY', 'GS': 'NYSE:GS', 'MS': 'NYSE:MS',

    // Global Indices
    'DJI': 'TVC:DJI', 'SPX': 'TVC:SPX', 'IXIC': 'NASDAQ:NDX',
  };

  if (directMap[symbol]) return directMap[symbol];

  // F&O Futures (e.g., NIFTY25JUNFUT → use index chart)
  if (symbol.includes('FUT')) {
    if (symbol.startsWith('NIFTY')) return 'NSE:NIFTY';
    if (symbol.startsWith('BANKNIFTY')) return 'NSE:NIFTYBANK';
    // For stock futures, strip the FUT suffix and use NSE equity
    const base = symbol.replace(/\d{2}[A-Z]{3}FUT$/, '');
    if (base) return `NSE:${base}`;
  }

  // Default: NSE equity
  return `NSE:${symbol}`;
}

// ── Timeframe Mapping ──
function toTradingViewInterval(tf) {
  if (!tf) return '5';
  const map = {
    '1m': '1', '1M': '1',
    '5m': '5', '5M': '5',
    '15m': '15', '15M': '15',
    '30m': '30', '30M': '30',
    '1h': '60', '1H': '60',
    '4h': '240', '4H': '240',
    '1d': 'D', '1D': 'D', 'D': 'D',
    '1w': 'W', '1W': 'W', 'W': 'W',
    '1M': 'M', 'M': 'M',
  };
  return map[tf] || '5';
}

const TradingViewChart = memo(function TradingViewChart({ symbol, timeframe, isDark = true }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous widget
    if (containerRef.current.firstChild) {
      containerRef.current.innerHTML = '';
    }

    const tvSymbol = toTradingViewSymbol(symbol);
    const tvInterval = toTradingViewInterval(timeframe);

    // Create the TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!containerRef.current) return;
      try {
        widgetRef.current = new window.TradingView.widget({
          container_id: containerRef.current.id,
          symbol: tvSymbol,
          interval: tvInterval,
          timezone: 'Asia/Kolkata',
          theme: isDark ? 'dark' : 'light',
          style: '1', // Candlestick
          locale: 'en',
          toolbar_bg: isDark ? '#0b0e14' : '#ffffff',
          enable_publishing: false,
          hide_top_toolbar: true,
          hide_legend: true,
          save_image: false,
          withdateranges: false,
          allow_symbol_change: false,
          autosize: true,
          studies: [],
          overrides: {
            'paneProperties.background': isDark ? '#0b0e14' : '#ffffff',
            'paneProperties.backgroundType': 'solid',
            'mainSeriesProperties.candleStyle.upColor': '#26a69a',
            'mainSeriesProperties.candleStyle.downColor': '#ef5350',
            'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
            'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
          },
          loading_screen: { backgroundColor: isDark ? '#0b0e14' : '#ffffff' },
        });
      } catch (err) {
        console.error('TradingView widget error:', err);
      }
    };

    // Check if TradingView is already loaded
    if (window.TradingView) {
      script.onload();
    } else {
      document.head.appendChild(script);
    }

    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove?.(); } catch {}
        widgetRef.current = null;
      }
    };
  }, [symbol, timeframe, isDark]);

  return (
    <div
      id={`tv-chart-${symbol || 'default'}`}
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '300px' }}
    />
  );
});

export default TradingViewChart;
