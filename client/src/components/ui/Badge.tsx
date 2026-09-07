import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'saffron' | 'emerald' | 'charcoal' | 'ruby' | 'amber' | 'blue' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'charcoal',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-bold'
  };

  const variantStyles = {
    saffron: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    charcoal: 'bg-slate-100 text-slate-700 border border-slate-200',
    ruby: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
  };

  const dotColors = {
    saffron: 'bg-blue-600 animate-pulse',
    emerald: 'bg-emerald-500 animate-pulse',
    charcoal: 'bg-slate-400',
    ruby: 'bg-rose-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full select-none tracking-wide font-sans',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      <span>{children}</span>
    </span>
  );
};
