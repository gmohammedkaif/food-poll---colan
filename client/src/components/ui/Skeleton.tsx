import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'skeleton-shimmer bg-navy-800/60 border border-white/[0.04]',
          variant === 'text' && 'h-4 rounded-md w-full',
          variant === 'rectangular' && 'rounded-xl',
          variant === 'circular' && 'rounded-full',
          className
        )
      )}
      {...props}
    />
  );
};
