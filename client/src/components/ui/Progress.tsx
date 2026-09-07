import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  barClassName?: string;
  variant?: 'saffron' | 'emerald' | 'charcoal';
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  barClassName,
  variant = 'saffron'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColors = {
    saffron: 'bg-saffron-500',
    emerald: 'bg-emerald-500',
    charcoal: 'bg-charcoal-700'
  };

  return (
    <div
      className={twMerge(
        clsx('w-full bg-charcoal-100/90 rounded-full h-2.5 overflow-hidden', className)
      )}
    >
      <div
        className={twMerge(
          clsx('h-full rounded-full transition-all duration-500 ease-out', variantColors[variant], barClassName)
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
