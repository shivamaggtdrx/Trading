import { cn } from '../../utils/helpers';

const variants = {
  primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 shadow-sm shadow-blue-500/20',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 shadow-sm shadow-emerald-500/20',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-sm shadow-red-500/20',
  outline: 'border border-border text-text-primary hover:bg-surface active:bg-surface-2',
  ghost: 'text-text-secondary hover:bg-surface active:bg-surface-2',
  'outline-primary': 'border border-primary/30 text-primary hover:bg-blue-50 active:bg-blue-100',
  'outline-danger': 'border border-danger/30 text-danger hover:bg-red-50 active:bg-red-100',
};

const sizes = {
  xs: 'px-2.5 py-1 text-[11px]',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
  xl: 'px-6 py-3.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 btn-ripple select-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-40 cursor-not-allowed saturate-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
