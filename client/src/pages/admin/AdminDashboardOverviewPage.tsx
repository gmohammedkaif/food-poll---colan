import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Poll } from '../../types/index.js';
import { formatDate, formatTime } from '../../utils/formatters.js';
import { PollStatusBadge } from '../../components/poll/PollStatusBadge.js';
import { Button } from '../../components/ui/Button.js';
import {
  Users,
  Vote,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  Plus,
  Utensils,
  ArrowRight,
  CheckCircle2,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminDashboardOverviewPage: React.FC = () => {
  const { user } = useAuth();

  // 1. Fetch active polls
  const { data: activePollsData } = useQuery({
    queryKey: ['adminActivePolls'],
    queryFn: async () => {
      const res = await api.get('/polls?status=OPEN&limit=10');
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  // 2. Fetch recent polls for history preview
  const { data: recentPollsData } = useQuery({
    queryKey: ['adminRecentPolls'],
    queryFn: async () => {
      const res = await api.get('/polls?limit=6');
      return res.data.data;
    },
    refetchInterval: 20000,
  });

  // 3. Fetch employees total
  const { data: employeesData } = useQuery({
    queryKey: ['adminEmployeesStats'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=1');
      return res.data.data;
    },
  });

  const activePolls: Poll[] = activePollsData?.polls || [];
  const recentPolls: Poll[] = recentPollsData?.polls || [];
  const primaryActivePoll = activePolls[0] || recentPolls[0] || null;

  // Active Poll Results query
  const { data: activePollResults } = useQuery({
    queryKey: ['adminPollResults', primaryActivePoll?._id],
    queryFn: async () => {
      if (!primaryActivePoll?._id) return null;
      const res = await api.get(`/polls/${primaryActivePoll._id}/results`);
      return res.data.data;
    },
    enabled: !!primaryActivePoll?._id,
    refetchInterval: 15000,
  });

  const totalEmployees = employeesData?.pagination?.total ?? 0;
  const todayVotes = activePollResults?.totalVotes || 0;
  const participationRate = totalEmployees > 0 ? Math.round((todayVotes / totalEmployees) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const adminName = user?.name?.split(' ')[0] || 'Admin';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* 1. TOP OPERATIONAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Operations Center
            </span>
            <span className="text-xs text-slate-400">·</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            {greeting}, {adminName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Manage today's lunch poll, monitor catering numbers, and track team participation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/admin/polls/create">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Create New Poll
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. THREE OPERATIONAL METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Active Poll Context */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Poll
              </span>
              {primaryActivePoll && (
                <PollStatusBadge status={primaryActivePoll.status} size="sm" />
              )}
            </div>

            <h3 className="text-lg font-black text-slate-900 truncate font-display">
              {primaryActivePoll ? primaryActivePoll.title : 'No Active Poll'}
            </h3>

            {primaryActivePoll ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {formatTime(primaryActivePoll.startAt)} – {formatTime(primaryActivePoll.endAt)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">
                Create a poll to open voting for today's lunch.
              </p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            {primaryActivePoll ? (
              <Link
                to={`/polls/${primaryActivePoll._id}/results`}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Live Standings <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/admin/polls/create"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                + Set Up Poll <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Card 2: Today's Votes & Participation */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Participation
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {participationRate}% Turnout
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-display">
                {todayVotes}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                / {totalEmployees} employees
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, participationRate))}%` }}
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {totalEmployees - todayVotes > 0
                ? `${totalEmployees - todayVotes} yet to vote`
                : 'All votes recorded!'}
            </span>
            <Link
              to="/admin/employees"
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              View Roster →
            </Link>
          </div>
        </div>

        {/* Card 3: Catering Order Action */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Catering Order
              </span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-black text-slate-900 font-display">
              {activePollResults?.options?.filter((o: any) => o.voteCount > 0).length || 0} Dishes
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active quantities ready for kitchen and vendor preparation.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to={primaryActivePoll ? `/polls/${primaryActivePoll._id}/results` : '/admin/polls'}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Full Order Breakdown</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S LUNCH POLL — CLEAN OPERATIONAL BREAKDOWN (REPLACING PIE CHART & LEADING DISH) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-black text-slate-900 font-display">
                Today's Lunch Poll
              </h2>
              {primaryActivePoll && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {primaryActivePoll.title}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live catering vote counts and distribution for employee choices
            </p>
          </div>

          {primaryActivePoll && (
            <div className="flex items-center gap-3">
              <Link to={`/polls/${primaryActivePoll._id}/results`}>
                <Button variant="outline" size="sm">
                  View Voter Details
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Dish List */}
        {activePollResults && activePollResults.options.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {activePollResults.options.map((option: any) => {
              const isLeading =
                activePollResults.leadingOption?.optionId === option.optionId &&
                option.voteCount > 0;

              return (
                <div
                  key={option.optionId}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Food Image + Name */}
                  <div className="flex items-center gap-4 sm:w-1/3 shrink-0">
                    <img
                      src={option.foodImage}
                      alt={option.foodName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                      onError={(e) => { (e.target as any).style.display = 'none'; }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">
                          {option.foodName}
                        </h4>
                        {isLeading && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            Top Pick
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Clean Operational Progress Bar */}
                  <div className="flex-1 w-full flex items-center gap-4">
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isLeading ? 'bg-blue-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>

                    <div className="text-right shrink-0 min-w-[80px]">
                      <span className="text-sm font-black text-slate-900 block leading-tight">
                        {option.voteCount} {option.voteCount === 1 ? 'order' : 'orders'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 block">
                        {option.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No active lunch poll right now.</p>
            <Link to="/admin/polls/create" className="mt-3 inline-block">
              <Button variant="primary" size="xs">
                Create Today's Poll
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* 4. RECENT POLLS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 font-display">
              Recent Polls
            </h2>
            <p className="text-xs text-slate-500">History of past dining selections</p>
          </div>
          <Link
            to="/admin/polls"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            View All Polls →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Poll Title</th>
                <th className="py-3.5 px-6">Top Dish</th>
                <th className="py-3.5 px-6">Votes</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentPolls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No polls recorded yet.
                  </td>
                </tr>
              ) : (
                recentPolls.map((p) => {
                  const topOption = p.options?.[0];
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-semibold text-xs text-slate-600">
                        {formatDate(p.pollDate)}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900 text-xs">
                        <Link
                          to={`/polls/${p._id}/results`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          {topOption?.foodImageSnapshot && (
                            <img
                              src={topOption.foodImageSnapshot}
                              alt={topOption.foodNameSnapshot}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                            {topOption?.foodNameSnapshot || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-700">
                        {p.totalVotes || 0}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <PollStatusBadge status={p.status} size="sm" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
