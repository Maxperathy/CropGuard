interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function Progress({ value, max = 100, className = '', barClassName = '' }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full bg-zinc-100 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`bg-primary h-full rounded-full transition-all duration-500 ease-out ${barClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
