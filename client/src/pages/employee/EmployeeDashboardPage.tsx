import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useSocket } from '../../context/SocketContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { useAuth } from '../../context/AuthContext.js';
import { PollOption, ActivePollResponse } from '../../types/index.js';
import { formatTime } from '../../utils/formatters.js';
import { clsx } from 'clsx';

import { PollStatusBadge } from '../../components/poll/PollStatusBadge.js';
import { PollCountdown } from '../../components/poll/PollCountdown.js';
import { FoodGrid } from '../../components/food/FoodGrid.js';
import { Button } from '../../components/ui/Button.js';
import { NotificationPromptBanner } from '../../components/notifications/NotificationPromptBanner.js';

import {
  UtensilsCrossed,
  BarChart3,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Check,
  RotateCcw,
} from 'lucide-react';

export const EmployeeDashboardPage: React.FC = () => {
  const { id: routePollId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryClient = useQueryClient();
  const { socket, joinPollRoom, leavePollRoom } = useSocket();
  const { success, error, info } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const activePollId = routePollId || searchParams.get('pollId');

  const [selectedOption, setSelectedOption] = useState<PollOption | null>(null);

  // Fetch active poll(s)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activePoll', activePollId],
    queryFn: async () => {
      const url = activePollId ? `/polls/active?pollId=${activePollId}` : '/polls/active';
      const res = await api.get(url);
      return res.data.data as ActivePollResponse;
    },
    refetchInterval: 20000,
  });

  const poll = data?.poll;
  const allPolls = data?.polls || (data?.poll ? [data.poll] : []);
  const myVote = data?.myVote;

  // Auto-select option whenever active poll or myVote changes
  useEffect(() => {
    if (poll && myVote) {
      const match = poll.options.find((opt) => opt._id === myVote.selectedOptionId);
      setSelectedOption(match || null);
    } else {
      setSelectedOption(null);
    }
  }, [poll?._id, myVote?.selectedOptionId]);

  // Real-time socket sync
  useEffect(() => {
    if (!poll?._id) return;
    joinPollRoom(poll._id);

    if (socket) {
      socket.on('vote_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['activePoll'] });
      });
      socket.on('poll_status_changed', (payload: any) => {
        if (payload.pollId === poll._id) {
          info('Poll Status Updated', `Poll status is now ${payload.status}`);
          queryClient.invalidateQueries({ queryKey: ['activePoll'] });
        }
      });
    }

    return () => {
      leavePollRoom(poll._id);
      if (socket) {
        socket.off('vote_updated');
        socket.off('poll_status_changed');
      }
    };
  }, [poll?._id, socket, joinPollRoom, leavePollRoom, queryClient, info]);

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const res = await api.post(`/polls/${poll!._id}/vote`, { selectedOptionId: optionId });
      return res.data;
    },
    onSuccess: (resData) => {
      success('Vote Recorded', resData.message || 'Your choice has been submitted.');
      queryClient.invalidateQueries({ queryKey: ['activePoll'] });
      queryClient.invalidateQueries({ queryKey: ['voteHistory'] });
      if (poll?._id) {
        navigate(`/polls/${poll._id}/results`);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to submit vote. Please try again.';
      error('Voting Error', msg);
    },
  });

  const handleOptionSelect = (option: PollOption) => {
    if (poll?.status !== 'OPEN') return;
    setSelectedOption(option);
  };

  const handleSubmitVote = () => {
    if (!selectedOption) return;
    voteMutation.mutate(selectedOption._id);
  };

  const handleSelectPoll = (pollId: string) => {
    if (routePollId) {
      window.location.href = `/polls/${pollId}`;
    } else {
      setSearchParams({ pollId });
    }
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-pulse">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="h-4 w-32 bg-slate-100 rounded-lg" />
          <div className="h-10 w-80 bg-slate-100 rounded-xl" />
          <div className="h-4 w-56 bg-slate-100 rounded-md" />
        </div>
        <FoodGrid options={[]} isLoading={true} />
      </div>
    );
  }

  // No Active Poll State
  if (!poll) {
    return (
      <div className="py-20 px-4 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-sm">
          <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3 inline-block">
          Colan PollHub
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
          No Dining Poll Active Right Now
        </h1>

        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Today's menu hasn't been published yet. Daily dining voting will appear here as soon as polls open.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const isPollOpen = poll.status === 'OPEN';
  const hasVoted = !!myVote;
  const isSelectedDifferent = selectedOption?._id !== myVote?.selectedOptionId;
  const previousOption = myVote ? poll.options.find((o) => o._id === myVote.selectedOptionId) : null;
  const currentChosenOption = selectedOption || previousOption;

  const totalVotesCount = poll.totalVotes || 0;
  const formattedTodayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });


  // ==========================================
  // MAIN SCREEN
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* MULTIPLE ACTIVE POLLS SELECTOR (If multiple exist) */}
      {allPolls.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Multiple Polls Active
            </h2>
            <p className="text-xs text-slate-500">Select a meal poll to cast your vote</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {allPolls.map((p) => {
              const isSelected = p._id === poll._id;
              return (
                <button
                  key={p._id}
                  onClick={() => handleSelectPoll(p._id)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  <span>{p.title}</span>
                  <PollStatusBadge status={p.status} size="sm" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* NOTIFICATION PERMISSION PROMPT BANNER */}
      <NotificationPromptBanner />

      {/* 1. COMPACT HERO + COUNTDOWN */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Heading */}
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 font-display">
            TODAY'S LUNCH POLL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            What's on <span className="text-blue-600">your plate today?</span>
          </h1>
          <p className="text-xs text-slate-500">
            {poll.description || 'Choose your meal preference for today\'s lunch catering.'}
          </p>
        </div>

        {/* Right: Compact Countdown */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-card shrink-0 lg:min-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{formattedTodayDate}</span>
            </div>
            <PollStatusBadge status={poll.status} size="sm" />
          </div>

          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            {poll.status === 'SCHEDULED' ? 'Voting starts in' : 'Voting closes in'}
          </span>

          <div className="py-1.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-center mb-2">
            <PollCountdown
              status={poll.status}
              startAt={poll.startAt}
              endAt={poll.endAt}
              variant="digits"
              onExpire={() => queryClient.invalidateQueries({ queryKey: ['activePoll'] })}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>{totalVotesCount} votes cast</span>
            <span className="text-blue-600">
              {poll.status === 'SCHEDULED'
                ? 'Starts soon'
                : poll.status === 'OPEN'
                ? totalVotesCount > 0 ? 'Active' : 'Awaiting votes'
                : 'Concluded'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. COMPACT VOTE RECORDED BANNER */}
      {hasVoted && previousOption && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold text-slate-900">
                You voted for {previousOption.foodNameSnapshot}
              </span>
              {isPollOpen && poll.allowVoteChange && (
                <span className="text-[11px] text-slate-500 ml-1">· Select another to change</span>
              )}
            </div>
          </div>
          <Link to={`/polls/${poll._id}/results`}>
            <Button variant="ghost" size="sm" className="text-emerald-800 hover:bg-emerald-100/80 text-xs shrink-0">
              Results →
            </Button>
          </Link>
        </div>
      )}

      {/* 3. FOOD OPTIONS GRID */}
      <div>
        <FoodGrid
          options={poll.options}
          selectedOptionId={selectedOption?._id}
          onSelectOption={handleOptionSelect}
          disabled={!isPollOpen}
        />
      </div>

      {/* 4. SUBMIT BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto min-w-[220px] text-sm py-3 shadow-lg shadow-blue-600/20"
          disabled={!isPollOpen || !selectedOption || (hasVoted && !isSelectedDifferent)}
          onClick={handleSubmitVote}
          isLoading={voteMutation.isPending}
          rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
        >
          {!isPollOpen
            ? 'Voting Closed'
            : hasVoted
            ? isSelectedDifferent
              ? 'Update Vote →'
              : 'Vote Submitted ✓'
            : 'Submit Vote →'}
        </Button>

        <Link to={`/polls/${poll._id}/results`}>
          <Button variant="outline" size="md" className="w-full sm:w-auto" leftIcon={<BarChart3 className="w-4 h-4 text-blue-600" />}>
            View Results
          </Button>
        </Link>
      </div>
    </div>
  );
};
