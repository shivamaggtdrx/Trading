import { cn } from '../../utils/helpers';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface text-text-secondary',
    success: 'bg-success-bg text-success',
    danger: 'bg-danger-bg text-danger',
    primary: 'bg-blue-50 text-primary',
    warning: 'bg-amber-50 text-amber-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
