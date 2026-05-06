export function formatCurrency(value, currency = 'INR') {
  if (currency === 'INR') {
    return '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
}

export function formatPrice(value) {
  if (value >= 100) {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toFixed(4);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
