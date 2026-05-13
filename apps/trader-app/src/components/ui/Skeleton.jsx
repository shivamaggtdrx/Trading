import { cn } from '../../utils/helpers';

/**
 * Skeleton loading placeholder with shimmer animation
 */
export function Skeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'h-3 rounded',
    'text-lg': 'h-5 rounded-md',
    'text-xl': 'h-7 rounded-md',
    circle: 'rounded-full',
    rect: 'rounded-xl',
    card: 'rounded-2xl',
  };

  return (
    <div
      className={cn('animate-shimmer', variants[variant], className)}
      style={{ width, height }}
    />
  );
}

/**
 * Skeleton for a market list item
 */
export function MarketItemSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="rect" width={36} height={36} />
        <div className="space-y-2">
          <Skeleton width={80} height={12} />
          <Skeleton width={120} height={10} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width={50} height={24} />
        <Skeleton variant="rect" width={64} height={28} />
      </div>
    </div>
  );
}

/**
 * Skeleton for a position card
 */
export function PositionCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl card-shadow border border-border/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="rect" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton width={100} height={14} />
            <Skeleton width={140} height={10} />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton width={80} height={16} className="ml-auto" />
          <Skeleton width={50} height={10} className="ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton variant="rect" height={44} />
        <Skeleton variant="rect" height={44} />
        <Skeleton variant="rect" height={44} />
      </div>
    </div>
  );
}

/**
 * Skeleton for the wallet card
 */
export function WalletCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="rect" width={32} height={32} className="!bg-white/20" />
          <Skeleton width={100} height={12} className="!bg-white/20" />
        </div>
        <Skeleton variant="rect" width={80} height={24} className="!bg-white/20" />
      </div>
      <Skeleton width={160} height={28} className="!bg-white/20 mb-3" />
      <Skeleton width={120} height={14} className="!bg-white/20" />
    </div>
  );
}

export default Skeleton;
