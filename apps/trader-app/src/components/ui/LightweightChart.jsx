import { useEffect, useRef, useMemo } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { useTradeStore } from '../../store/useTradeStore';

// Generate realistic candle data from a base price when backend has none
function generateFallbackCandles(basePrice, count = 120) {
  if (!basePrice || basePrice <= 0) return [];
  const candles = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = 3600; // 1hr candles
  let price = basePrice * (0.92 + Math.random() * 0.08); // Start slightly lower

  for (let i = count; i >= 0; i--) {
    const time = now - i * interval;
    const volatility = basePrice * (0.003 + Math.random() * 0.007);
    const open = price;
    const close = open + (Math.random() - 0.48) * volatility * 2;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    candles.push({
      time,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
    });
    price = close;
  }
  return candles;
}

export default function LightweightChart({ symbol, timeframe, isDark }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const priceLinesRef = useRef({});
  
  const { requestCandles, candles, instruments, positions, updatePositionSlTgt } = useTradeStore();
  
  const normalizedTf = timeframe.toLowerCase();
  const candleKey = `${symbol}_${normalizedTf}`;
  
  const historicalData = candles[candleKey];
  const instrument = instruments.find(i => i.symbol === symbol);
  const symbolPositions = positions.filter(p => p.symbol === symbol && p.status !== 'CLOSED');

  // Generate fallback data if backend returns nothing
  const fallbackCandles = useMemo(() => {
    const basePrice = instrument?.price || instrument?.last_price || 0;
    return generateFallbackCandles(basePrice);
  }, [instrument?.symbol]);

  // Choose best available data
  const chartData = (historicalData && historicalData.length > 0) ? historicalData : fallbackCandles;

  // 1. Initialize Chart
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
        mode: 1,
      }
    });
    
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
    seriesRef.current = candlestickSeries;

    window.addEventListener('resize', handleResize);

    // Request from backend (may or may not return data)
    requestCandles(symbol, normalizedTf);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, normalizedTf, isDark]);

  // 2. Set Chart Data (backend or fallback)
  useEffect(() => {
    if (seriesRef.current && chartData && chartData.length > 0) {
      const sorted = [...chartData].sort((a, b) => a.time - b.time);
      seriesRef.current.setData(sorted);
      chartRef.current?.timeScale().fitContent();
    }
  }, [chartData]);

  // 3. Update Live Tick
  useEffect(() => {
    if (!seriesRef.current || !instrument || !chartData || chartData.length === 0) return;
    
    const lastCandle = chartData[chartData.length - 1];
    const ltp = instrument.price || instrument.last_price;
    
    if (ltp) {
      seriesRef.current.update({
        time: lastCandle.time,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, ltp),
        low: Math.min(lastCandle.low, ltp),
        close: ltp,
      });
    }
  }, [instrument?.price, chartData]);

  // 4. Draw Position Overlays (Entry, SL, TGT)
  useEffect(() => {
    if (!seriesRef.current) return;
    
    const currentLines = priceLinesRef.current;
    
    Object.values(currentLines).forEach(line => {
      seriesRef.current.removePriceLine(line);
    });
    priceLinesRef.current = {};

    symbolPositions.forEach(pos => {
      if (pos.entryPrice) {
        const entryLine = seriesRef.current.createPriceLine({
          price: pos.entryPrice,
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `ENTRY ${pos.quantity}`,
        });
        priceLinesRef.current[`${pos.id}_entry`] = entryLine;
      }
      
      if (pos.stop_loss) {
        const slLine = seriesRef.current.createPriceLine({
          price: pos.stop_loss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: 1,
          axisLabelVisible: true,
          title: 'SL',
        });
        priceLinesRef.current[`${pos.id}_sl`] = slLine;
      }
      
      if (pos.target) {
        const tgtLine = seriesRef.current.createPriceLine({
          price: pos.target,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: 1,
          axisLabelVisible: true,
          title: 'TGT',
        });
        priceLinesRef.current[`${pos.id}_tgt`] = tgtLine;
      }
    });
    
  }, [symbolPositions]);

  // 5. Handle Dragging SL/TGT lines
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !chartContainerRef.current) return;
    const chart = chartRef.current;
    const container = chartContainerRef.current;
    
    let isDragging = false;
    let draggedLineId = null;
    let draggedLineType = null;
    let positionId = null;

    const startDrag = (clientY) => {
      const rect = container.getBoundingClientRect();
      const y = clientY - rect.top;
      const price = seriesRef.current.coordinateToPrice(y);
      if (!price) return;

      const priceTolerance = Math.abs(seriesRef.current.coordinateToPrice(y - 10) - price);

      let found = null;
      for (const pos of symbolPositions) {
        if (pos.stop_loss && Math.abs(pos.stop_loss - price) < priceTolerance) {
          found = { id: `${pos.id}_sl`, type: 'sl', posId: pos.id };
          break;
        }
        if (pos.target && Math.abs(pos.target - price) < priceTolerance) {
          found = { id: `${pos.id}_tgt`, type: 'tgt', posId: pos.id };
          break;
        }
      }

      if (found) {
        isDragging = true;
        draggedLineId = found.id;
        draggedLineType = found.type;
        positionId = found.posId;
        chart.applyOptions({ handleScroll: false, handleScale: false });
      }
    };

    const moveDrag = (clientY) => {
      if (!isDragging || !draggedLineId) return;
      const rect = container.getBoundingClientRect();
      const y = clientY - rect.top;
      const newPrice = seriesRef.current.coordinateToPrice(y);
      if (newPrice) {
        const line = priceLinesRef.current[draggedLineId];
        if (line) {
          line.applyOptions({ price: newPrice });
        }
      }
    };

    const endDrag = (clientY) => {
      if (isDragging && positionId) {
        const rect = container.getBoundingClientRect();
        const y = clientY - rect.top;
        const finalPrice = seriesRef.current.coordinateToPrice(y);
        
        const pos = symbolPositions.find(p => p.id === positionId);
        if (pos && finalPrice) {
          let sl = pos.stop_loss;
          let tgt = pos.target;
          if (draggedLineType === 'sl') sl = finalPrice;
          if (draggedLineType === 'tgt') tgt = finalPrice;
          updatePositionSlTgt(positionId, sl, tgt);
        }
      }
      isDragging = false;
      draggedLineId = null;
      draggedLineType = null;
      positionId = null;
      chart.applyOptions({ handleScroll: true, handleScale: true });
    };

    const handleMouseDown = (e) => startDrag(e.clientY);
    const handleMouseMove = (e) => moveDrag(e.clientY);
    const handleMouseUp = (e) => endDrag(e.clientY);
    const handleTouchStart = (e) => { if (e.touches.length > 0) startDrag(e.touches[0].clientY); };
    const handleTouchMove = (e) => { if (e.touches.length > 0) moveDrag(e.touches[0].clientY); };
    const handleTouchEnd = (e) => { if (e.changedTouches.length > 0) endDrag(e.changedTouches[0].clientY); };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [symbolPositions]);

  return <div ref={chartContainerRef} className="w-full h-full relative" />;
}
