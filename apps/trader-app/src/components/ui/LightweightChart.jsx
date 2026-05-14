import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

function generateOHLC(basePrice, count, timeframeStr) {
  const data = [];
  let currentPrice = basePrice || 100;
  const now = new Date();
  
  let timeStep = 60000;
  if (timeframeStr === '1m' || timeframeStr === '1M') timeStep = 60000;
  else if (timeframeStr === '5m' || timeframeStr === '5M') timeStep = 5 * 60000;
  else if (timeframeStr === '15m' || timeframeStr === '15M') timeStep = 15 * 60000;
  else if (timeframeStr === '30m' || timeframeStr === '30M') timeStep = 30 * 60000;
  else if (timeframeStr === '1H') timeStep = 60 * 60000;
  else if (timeframeStr === '4H') timeStep = 4 * 60 * 60000;
  else if (timeframeStr === '1D' || timeframeStr === 'D') timeStep = 24 * 60 * 60000;
  else if (timeframeStr === '1W' || timeframeStr === 'W') timeStep = 7 * 24 * 60 * 60000;

  // We start backwards from now
  let time = now.getTime() - (count * timeStep);

  for (let i = 0; i < count; i++) {
    const volatility = currentPrice * 0.003;
    const open = currentPrice + (Math.random() - 0.5) * volatility;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    
    // lightweight charts time: Unix timestamp in seconds
    const timestamp = Math.floor(time / 1000);
    
    data.push({
      time: timestamp,
      open,
      high,
      low,
      close,
    });
    
    currentPrice = close;
    time += timeStep;
  }
  
  // Ensure ascending order without duplicate timestamps
  data.sort((a, b) => a.time - b.time);
  for (let i = 1; i < data.length; i++) {
    if (data[i].time <= data[i-1].time) {
      data[i].time = data[i-1].time + 1;
    }
  }

  return data;
}

export default function LightweightChart({ symbol, timeframe, basePrice, isDark }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: isDark ? '#0b0e14' : '#ffffff' },
        textColor: isDark ? '#94a3b8' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
        horzLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Magnet mode
      }
    });
    
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Generate mock OHLC Data for the requested timeframe
    const data = generateOHLC(basePrice, 300, timeframe);
    candlestickSeries.setData(data);

    // Fit content
    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, timeframe, isDark, basePrice]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
