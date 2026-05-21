export function formatCurrency(value, currency = 'INR') {
  const num = Number(value) || 0;
  if (currency === 'INR') {
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '+0.00%';
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
}

export function formatPrice(value, includeCurrency = false) {
  if (!value || isNaN(value)) return '0.00';
  const num = Number(value);
  const formatted = num >= 100 
    ? num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toFixed(num < 1 ? 5 : 4);
  
  if (includeCurrency) {
    return '₹' + formatted;
  }
  return formatted;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
