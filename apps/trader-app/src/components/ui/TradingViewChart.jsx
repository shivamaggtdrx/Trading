import { useEffect, useRef, memo } from 'react';

// ── Symbol Mapping: Internal → TradingView ──
function toTradingViewSymbol(symbol) {
  if (!symbol) return 'NSE:NIFTY';

  // Crypto (Binance)
  if (symbol.endsWith('USDT')) return `BINANCE:${symbol}`;

  // Forex pairs
  const forexMap = {
    'EURUSD': 'FX:EURUSD', 'GBPUSD': 'FX:GBPUSD', 'USDJPY': 'FX:USDJPY',
    'AUDUSD': 'FX:AUDUSD', 'USDCAD': 'FX:USDCAD', 'USDCHF': 'FX:USDCHF',
    'NZDUSD': 'FX:NZDUSD', 'EURGBP': 'FX:EURGBP', 'EURJPY': 'FX:EURJPY',
    'GBPJPY': 'FX:GBPJPY', 'USDINR': 'FX:USDINR',
  };
  if (forexMap[symbol]) return forexMap[symbol];

  // US Stocks
  const usMap = {
    'AAPL': 'NASDAQ:AAPL', 'MSFT': 'NASDAQ:MSFT', 'GOOGL': 'NASDAQ:GOOGL',
    'AMZN': 'NASDAQ:AMZN', 'TSLA': 'NASDAQ:TSLA', 'META': 'NASDAQ:META',
    'NVDA': 'NASDAQ:NVDA', 'NFLX': 'NASDAQ:NFLX',
  };
  if (usMap[symbol]) return usMap[symbol];

  // Indices
  const indexMap = {
    'NIFTY50': 'NSE:NIFTY', 'NIFTY': 'NSE:NIFTY',
    'BANKNIFTY': 'NSE:BANKNIFTY',
  };
  if (indexMap[symbol]) return indexMap[symbol];

  // MCX Commodities
  const mcxMap = {
    'GOLD': 'MCX:GOLD1!', 'SILVER': 'MCX:SILVER1!',
    'CRUDEOIL': 'MCX:CRUDEOIL1!', 'NATURALGAS': 'MCX:NATURALGAS1!',
    'COPPER': 'MCX:COPPER1!',
  };
  if (mcxMap[symbol]) return mcxMap[symbol];

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
