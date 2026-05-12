import { cn } from '../../utils/helpers';

export default function Tabs({ tabs, activeTab, onChange, className = '', compact = false }) {
  return (
    <div className={cn(
      'flex bg-surface-2/80 rounded-lg p-0.5 gap-0.5',
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex-1 py-2 px-2 font-semibold rounded-md transition-all duration-200 select-none',
            compact ? 'text-base' : 'text-sm',
            activeTab === tab.key
              ? 'bg-white text-text-primary card-shadow'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
