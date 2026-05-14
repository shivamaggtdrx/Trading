import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useTradeStore } from '../../store/useTradeStore';

export default function LightweightChart({ symbol, timeframe, isDark }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const priceLinesRef = useRef({}); // Store references to drawn price lines
  
  const { requestCandles, candles, instruments, positions, updatePositionSlTgt } = useTradeStore();
  
  // Convert standard TF to backend TF format if needed (e.g. 1M -> 1m)
  const normalizedTf = timeframe.toLowerCase();
  const candleKey = `${symbol}_${normalizedTf}`;
  
  const historicalData = candles[candleKey];
  const instrument = instruments.find(i => i.symbol === symbol);
  const symbolPositions = positions.filter(p => p.symbol === symbol && p.status !== 'CLOSED');

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
        mode: 1, // Magnet
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
    
    seriesRef.current = candlestickSeries;

    window.addEventListener('resize', handleResize);

    // Request initial data
    requestCandles(symbol, normalizedTf);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, normalizedTf, isDark]);

  // 2. Set Historical Data when loaded
  useEffect(() => {
    if (seriesRef.current && historicalData && historicalData.length > 0) {
      // Sort and deduplicate if necessary, lightweight-charts expects strict order
      const sorted = [...historicalData].sort((a, b) => a.time - b.time);
      seriesRef.current.setData(sorted);
      chartRef.current.timeScale().fitContent();
    }
  }, [historicalData]);

  // 3. Update Live Tick
  useEffect(() => {
    if (!seriesRef.current || !instrument || !historicalData || historicalData.length === 0) return;
    
    // Create/update the last candle
    const lastCandle = historicalData[historicalData.length - 1];
    const ltp = instrument.price || instrument.last_price;
    
    if (ltp) {
      // In a real scenario, you calculate if the tick belongs to current candle or new one.
      // Here we optimistically update the close of the last candle.
      seriesRef.current.update({
        time: lastCandle.time,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, ltp),
        low: Math.min(lastCandle.low, ltp),
        close: ltp,
      });
    }
  }, [instrument?.price, historicalData]);

  // 4. Draw Position Overlays (Entry, SL, TGT)
  useEffect(() => {
    if (!seriesRef.current) return;
    
    const currentLines = priceLinesRef.current;
    
    // Clear old lines
    Object.values(currentLines).forEach(line => {
      seriesRef.current.removePriceLine(line);
    });
    priceLinesRef.current = {};

    // Draw new lines
    symbolPositions.forEach(pos => {
      // Entry Line
      if (pos.entryPrice) {
        const entryLine = seriesRef.current.createPriceLine({
          price: pos.entryPrice,
          color: '#3b82f6', // Blue
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `ENTRY ${pos.quantity}`,
        });
        priceLinesRef.current[`${pos.id}_entry`] = entryLine;
      }
      
      // Stop Loss Line
      if (pos.stop_loss) {
        const slLine = seriesRef.current.createPriceLine({
          price: pos.stop_loss,
          color: '#ef4444', // Red
          lineWidth: 2,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: 'SL',
        });
        priceLinesRef.current[`${pos.id}_sl`] = slLine;
      }
      
      // Target Line
      if (pos.target) {
        const tgtLine = seriesRef.current.createPriceLine({
          price: pos.target,
          color: '#22c55e', // Green
          lineWidth: 2,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: 'TGT',
        });
        priceLinesRef.current[`${pos.id}_tgt`] = tgtLine;
      }
    });
    
  }, [symbolPositions]);

  // Handle Dragging / Double Clicks (Custom Drag Implementation)
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !chartContainerRef.current) return;
    const chart = chartRef.current;
    const container = chartContainerRef.current;
    
    let isDragging = false;
    let draggedLineId = null;
    let draggedLineType = null;
    let positionId = null;

    const handleMouseDown = (e) => {
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = seriesRef.current.coordinateToPrice(y);
      if (!price) return;

      // Find if we clicked near a line (tolerance of e.g. 10 pixels roughly converted to price)
      // We estimate price tolerance by checking price at y-10 and y+10
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
        chart.applyOptions({ handleScroll: false, handleScale: false }); // Disable chart scrolling while dragging
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !draggedLineId) return;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newPrice = seriesRef.current.coordinateToPrice(y);
      if (newPrice) {
        // Optimistically update the line position visually
        const line = priceLinesRef.current[draggedLineId];
        if (line) {
          line.applyOptions({ price: newPrice });
        }
      }
    };

    const handleMouseUp = (e) => {
      if (isDragging && positionId) {
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;
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
      chart.applyOptions({ handleScroll: true, handleScale: true }); // Re-enable scrolling
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [symbolPositions]);

  return <div ref={chartContainerRef} className="w-full h-full relative" />;
}
