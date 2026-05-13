import { cn } from '../../utils/helpers';

export default function Card({ children, className = '', padding = 'p-3.5', onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface rounded-lg border border-border/80',
        padding,
        onClick && 'cursor-pointer active:scale-[0.99] transition-transform duration-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
