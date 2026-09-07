import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PollResults } from '../../types/index.js';
import { clsx } from 'clsx';

interface ResultsViewProps {
  results: PollResults;
  myVotedOptionId?: string | null;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, myVotedOptionId }) => {
  const leading = results.leadingOption;

  return (
    <div className="space-y-6">
      {/* Main Results Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 font-display">
              Dish Vote Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Real-time distribution of employee choices
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {results.totalVotes} total {results.totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {results.options.map((option) => {
            const isMyVote = myVotedOptionId === option.optionId;
            const isLeader = leading?.optionId === option.optionId && option.voteCount > 0;

            return (
              <div
                key={option.optionId}
                className={clsx(
                  'px-4 py-3 sm:py-2.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3',
                  isLeader ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'
                )}
              >
                {/* Food Image + Title */}
                <div className="flex items-center gap-2.5 w-full sm:w-2/5 shrink-0 min-w-0">
                  <img
                    src={option.foodImage}
                    alt={option.foodName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {option.foodName}
                      </h4>
                      {isMyVote && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                          You
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Numbers */}
                <div className="w-full sm:flex-1 flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-700',
                        isLeader ? 'bg-amber-500' : 'bg-blue-600'
                      )}
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                  <div className="text-right shrink-0 min-w-[55px]">
                    <span className="text-sm font-black text-slate-900 block leading-tight">
                      {option.percentage}%
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
