import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export function Card({ children, className = '', hoverEffect = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 ${
        hoverEffect ? 'hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] hover:-translate-y-1' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3 className={`text-base font-bold text-zinc-950 font-sans tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({ children, className = '', ...props }: CardDescriptionProps) {
  return (
    <p className={`text-xs text-zinc-500 font-medium mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}
