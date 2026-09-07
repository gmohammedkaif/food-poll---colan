import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeClasses = {
  xs: 'h-7 text-xs font-semibold px-2.5 rounded-lg gap-1.5 whitespace-nowrap',
  sm: 'h-8 text-xs font-semibold px-3 rounded-xl gap-1.5 whitespace-nowrap',
  md: 'h-10 text-sm font-semibold px-4 rounded-xl gap-2 whitespace-nowrap',
  lg: 'h-11 text-sm font-bold px-5 rounded-xl gap-2 whitespace-nowrap',
  xl: 'h-12 text-base font-bold px-6 rounded-xl gap-2.5 whitespace-nowrap',
};

const variantClasses = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow focus-visible:ring-blue-500 disabled:bg-blue-300 disabled:shadow-none',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200/80 shadow-xs focus-visible:ring-slate-300 disabled:opacity-50',
  outline:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 shadow-xs focus-visible:ring-blue-500/20 disabled:opacity-50',
  ghost:
    'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200/60 focus-visible:ring-slate-200 disabled:opacity-40',
  danger:
    'bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100 active:bg-rose-200/80 shadow-xs focus-visible:ring-rose-500/30 disabled:opacity-40',
  success:
    'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 active:bg-emerald-200/80 shadow-xs focus-visible:ring-emerald-500/30 disabled:opacity-40',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'outline',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-150 shrink-0 select-none font-sans',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 w-4 h-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-2">Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
