import React, { useState } from 'react';
import { Check, Utensils } from 'lucide-react';
import { clsx } from 'clsx';
import { PollOption } from '../../types/index.js';

interface FoodCardProps {
  option: PollOption;
  isSelected?: boolean;
  onSelect?: (option: PollOption) => void;
  disabled?: boolean;
  votePercentage?: number;
  voteCount?: number;
  showStats?: boolean;
  rank?: number;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  option,
  isSelected = false,
  onSelect,
  disabled = false,
  votePercentage,
  voteCount,
  showStats = false,
  rank,
}) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (!disabled && onSelect) onSelect(option);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onSelect) {
      e.preventDefault();
      onSelect(option);
    }
  };

  const isLeading = rank === 1 && showStats && (voteCount ?? 0) > 0;

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        'group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 text-left select-none outline-none cursor-pointer',
        disabled && !showStats && 'opacity-60 cursor-not-allowed',
        !disabled && !showStats && 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isSelected
          ? 'bg-blue-50/50 border-2 border-blue-600 shadow-[0_8px_25px_-4px_rgba(37,99,235,0.2)] scale-[1.01]'
          : 'bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-card-hover shadow-card',
        showStats && 'cursor-default'
      )}
    >
      {/* Top Image Container */}
      <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden shrink-0">
        {!imageError && option.foodImageSnapshot ? (
          <img
            src={option.foodImageSnapshot}
            alt={option.foodNameSnapshot}
            onError={() => setImageError(true)}
            className={clsx(
              'w-full h-full object-cover transition-transform duration-500',
              !disabled && !showStats && 'group-hover:scale-105'
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
            <Utensils className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-xs font-medium">No photo available</span>
          </div>
        )}

        {/* Selected Badge Overlay */}
        {isSelected && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md animate-scale-in">
            <Check className="w-3 h-3 stroke-[3]" />
            Selected
          </div>
        )}

        {/* Leading Badge in Stats Mode */}
        {isLeading && !isSelected && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-sm">
            🏆 Leading
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="flex-1 p-3.5 flex flex-col justify-between">
        <div>
          <h3 className={clsx(
            'text-sm font-extrabold tracking-tight font-display transition-colors line-clamp-1',
            isSelected ? 'text-blue-950' : 'text-slate-900 group-hover:text-blue-600'
          )}>
            {option.foodNameSnapshot}
          </h3>

          {option.descriptionSnapshot && (
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
              {option.descriptionSnapshot}
            </p>
          )}
        </div>

        {/* Bottom Vote Trigger matching reference (○ Vote / ● Vote) */}
        {!showStats ? (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div
              className={clsx(
                'w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5',
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 border border-slate-200/80'
              )}
            >
              {isSelected ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full bg-white text-blue-600 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Vote</span>
                </>
              ) : (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 group-hover:border-blue-500" />
                  <span>Vote</span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Stats progress mode */
          votePercentage !== undefined && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>{votePercentage}%</span>
                <span className="text-slate-500 font-normal">{voteCount ?? 0} votes</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-700',
                    isLeading ? 'bg-amber-500' : 'bg-blue-600'
                  )}
                  style={{ width: `${votePercentage}%` }}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
