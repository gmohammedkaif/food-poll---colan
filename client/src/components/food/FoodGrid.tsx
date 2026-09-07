import React from 'react';
import { FoodCard } from './FoodCard.js';
import { Skeleton } from '../ui/Skeleton.js';
import { PollOption, OptionResult } from '../../types/index.js';
import { clsx } from 'clsx';

interface FoodGridProps {
  options: PollOption[];
  selectedOptionId?: string | null;
  onSelectOption?: (option: PollOption) => void;
  disabled?: boolean;
  results?: OptionResult[];
  showStats?: boolean;
  isLoading?: boolean;
}

export const FoodGrid: React.FC<FoodGridProps> = ({
  options,
  selectedOptionId,
  onSelectOption,
  disabled = false,
  results,
  showStats = false,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
            <Skeleton className="w-full aspect-[16/10] rounded-none bg-slate-100" />
            <div className="p-3 space-y-2">
              <Skeleton variant="text" className="h-4 w-3/4 bg-slate-200" />
              <Skeleton variant="text" className="h-3 w-full bg-slate-100" />
              <Skeleton variant="text" className="h-7 w-full rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!options || options.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-xs">
        <p className="text-sm font-semibold text-slate-500">No food options configured for this poll.</p>
      </div>
    );
  }

  // Build result map with ranking by vote count
  const resultMap = new Map<string, OptionResult & { rank?: number }>();
  if (results) {
    const sorted = [...results].sort((a, b) => b.voteCount - a.voteCount);
    sorted.forEach((r, i) => resultMap.set(r.optionId, { ...r, rank: i + 1 }));
  }

  const gridColsClass =
    options.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
      : options.length === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={clsx('grid gap-4 sm:gap-5', gridColsClass)}>
      {options.map((option) => {
        const optionIdStr = option._id?.toString();
        const isSelected = selectedOptionId === optionIdStr;
        const res = optionIdStr ? resultMap.get(optionIdStr) : undefined;

        return (
          <FoodCard
            key={optionIdStr || option.foodNameSnapshot}
            option={option}
            isSelected={isSelected}
            onSelect={onSelectOption}
            disabled={disabled}
            votePercentage={res?.percentage}
            voteCount={res?.voteCount}
            showStats={showStats}
            rank={res?.rank}
          />
        );
      })}
    </div>
  );
};
