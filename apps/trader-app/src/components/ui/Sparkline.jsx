import { useMemo } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Mini sparkline chart for market list items
 * Renders a compact SVG line chart from price data points
 */
export default function Sparkline({ data = [], positive = true, width = 60, height = 28, className = '' }) {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + chartH - ((val - min) / range) * chartH;
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }, [data, width, height]);

  const gradientId = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  const areaPath = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + chartH - ((val - min) / range) * chartH;
      return `${x},${y}`;
    });

    return `M${points.join(' L')} L${width - padding},${height - padding} L${padding},${height - padding} Z`;
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  const color = positive ? '#10b981' : '#ef4444';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
