import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 select-none';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-light disabled:bg-zinc-200 disabled:text-zinc-400 active:scale-98 shadow-sm',
    secondary: 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:bg-zinc-50 disabled:text-zinc-400 active:scale-98 shadow-sm',
    text: 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50',
    danger: 'bg-danger text-white hover:bg-red-600 active:scale-98 shadow-sm',
    ghost: 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2 text-xs h-10',
    lg: 'px-6 py-3 text-sm h-12',
    icon: 'w-10 h-10 p-0',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
