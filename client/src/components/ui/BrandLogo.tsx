import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import logoImg from '../../assets/logo.png';
import { clsx } from 'clsx';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  badge?: string;
  linkTo?: string;
  className?: string;
  imgClassName?: string;
  darkVariant?: boolean; // For dark backgrounds like the Admin Sidebar
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-9 h-9',
  xl: 'w-11 h-11',
};

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  badge,
  linkTo,
  className,
  imgClassName,
  darkVariant = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const { data: branding } = useQuery({
    queryKey: ['brandingLogo'],
    queryFn: async () => {
      try {
        const res = await api.get('/settings/branding');
        return res.data?.data as { logoUrl?: string; brandName?: string };
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const resolvedSrc = !imgError && branding?.logoUrl ? branding.logoUrl : logoImg;

  const content = (
    <div className={clsx('flex items-center gap-2.5 select-none shrink-0', className)}>
      <img
        src={resolvedSrc}
        alt="Colan PollHub"
        onError={() => setImgError(true)}
        className={clsx(
          sizeMap[size],
          'object-contain shrink-0',
          imgClassName
        )}
        loading="eager"
        decoding="async"
      />
      {showText && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={clsx(
                'font-extrabold tracking-tight font-display',
                darkVariant ? 'text-white' : 'text-slate-900',
                textSizeMap[size]
              )}
            >
              Colan
            </span>
            <span className={clsx('font-light text-xs', darkVariant ? 'text-slate-500' : 'text-slate-300')}>|</span>
            <span
              className={clsx(
                'font-semibold tracking-tight font-display',
                darkVariant ? 'text-blue-400' : 'text-blue-600',
                textSizeMap[size]
              )}
            >
              PollHub
            </span>
          </div>
          {badge && (
            <span
              className={clsx(
                'text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase border',
                darkVariant
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                  : 'bg-blue-50 text-blue-600 border-blue-200/80'
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center group">
        {content}
      </Link>
    );
  }

  return content;
};
