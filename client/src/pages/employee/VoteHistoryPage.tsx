import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { Button } from '../../components/ui/Button.js';
import { formatDate } from '../../utils/formatters.js';
import { History, ArrowLeft, Utensils, Check, ChevronRight } from 'lucide-react';

export const VoteHistoryPage: React.FC = () => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['voteHistory'],
    queryFn: async () => {
      const res = await api.get('/votes/history');
      return res.data.data as Array<{
        voteId: string;
        pollId: string;
        pollTitle: string;
        pollDate: string;
        selectedOptionName: string;
        selectedOptionImage: string;
        submittedAt: string;
        updatedAt: string;
      }>;
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header matching Reference Panel 6 */}
      <div className="flex items-center gap-3.5">
        <Link
          to="/dashboard"
          className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            My Votes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track your recent lunch choices
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 shadow-card animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-card p-8">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 font-display">No Past Votes Recorded</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            You haven't participated in any dining polls yet.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button variant="primary" size="sm">Vote in Today's Poll</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {history.map((item) => (
            <Link
              key={item.voteId}
              to={`/polls/${item.pollId}/results`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200/90 shadow-card p-4 hover:border-blue-300 hover:shadow-card-hover transition-all group block"
            >
              {/* Food Photo Thumbnail */}
              <div className="shrink-0">
                {item.selectedOptionImage ? (
                  <img
                    src={item.selectedOptionImage}
                    alt={item.selectedOptionName}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition-transform"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                    <Utensils className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Details matching Reference Panel 6 */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-400 block">
                  {formatDate(item.pollDate)}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 truncate leading-snug group-hover:text-blue-600 transition-colors">
                  {item.selectedOptionName}
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {item.pollTitle}
                </p>
              </div>

              {/* Green Voted Pill matching Reference Panel 6 */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 stroke-[3]" />
                  Voted
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
          ))}

          {/* Bottom Brand Quote matching Reference Panel 6 */}
          <div className="pt-8 pb-4 text-center">
            <p className="text-sm font-handwriting italic text-slate-600 font-serif">
              “Good Food, Better People”
            </p>
            <span className="text-xs font-bold text-slate-400 mt-0.5 block">
              — Colan
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
