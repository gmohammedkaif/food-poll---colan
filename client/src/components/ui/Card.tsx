import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  padded = true,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-navy-900/70 backdrop-blur-xl border border-white/[0.08] rounded-card shadow-glass transition-all duration-200',
          padded && 'p-5 sm:p-6',
          hoverable && 'hover:shadow-glass-lg hover:border-white/[0.18]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
