import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/50',
    danger: 'bg-red-50 text-red-700 border-red-200/50',
    info: 'bg-sky-50 text-sky-700 border-sky-200/50',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/50',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
