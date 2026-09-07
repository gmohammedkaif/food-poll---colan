import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useSocket } from '../../context/SocketContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { PollResults, VoterItem } from '../../types/index.js';
import { formatTime } from '../../utils/formatters.js';

import { ResultsView } from '../../components/poll/ResultsView.js';
import { VoterListTable } from '../../components/poll/VoterListTable.js';
import { PollStatusBadge } from '../../components/poll/PollStatusBadge.js';
import { EditPollModal } from '../../components/poll/EditPollModal.js';
import { Button } from '../../components/ui/Button.js';
import { ArrowLeft, RefreshCw, Lock, Edit2, Vote } from 'lucide-react';

export const PollResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { socket, joinPollRoom, leavePollRoom } = useSocket();
  const { isAdmin } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch results from real MongoDB backend
  const { data: results, isLoading: resultsLoading, refetch: refetchResults } = useQuery({
    queryKey: ['pollResults', id],
    queryFn: async () => {
      const res = await api.get(`/polls/${id}/results`);
      return res.data.data as PollResults;
    },
    enabled: !!id,
    refetchInterval: 15000,
  });

  const canViewVoters =
    isAdmin ||
    results?.resultsVisibility === 'PUBLIC_RESULTS' ||
    results?.resultsVisibility === 'VOTER_NAMES_VISIBLE';

  const { data: voters = [], isLoading: votersLoading, refetch: refetchVoters } = useQuery({
    queryKey: ['pollVoters', id],
    queryFn: async () => {
      const res = await api.get(`/polls/${id}/voters`);
      return res.data.data as VoterItem[];
    },
    enabled: !!id && canViewVoters,
    refetchInterval: 15000,
  });

  // Real-time socket sync
  useEffect(() => {
    if (!id) return;
    joinPollRoom(id);

    if (socket) {
      socket.on('vote_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['pollResults', id] });
        queryClient.invalidateQueries({ queryKey: ['pollVoters', id] });
      });
    }

    return () => {
      leavePollRoom(id);
      if (socket) {
        socket.off('vote_updated');
      }
    };
  }, [id, socket, joinPollRoom, leavePollRoom, queryClient]);

  if (resultsLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200 shadow-card" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-slate-900 font-display">Poll results not found</h3>
        <p className="text-xs text-slate-500 mt-1">This poll may have been archived or removed.</p>
        <Link to="/dashboard" className="mt-6 inline-block">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to={isAdmin && window.location.pathname.startsWith('/admin') ? '/admin/polls' : '/dashboard'}
            className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Today's Poll Results
              </span>
              <span className="text-slate-400">·</span>
              <PollStatusBadge status={results.status} size="sm" />
              <span className="text-xs text-slate-500">
                Closes {formatTime(results.endAt)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display mt-0.5">
              {results.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Here's what everyone chose.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(true)}
              leftIcon={<Edit2 className="w-3.5 h-3.5 text-blue-600" />}
            >
              Edit Poll
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchResults();
              if (canViewVoters) refetchVoters();
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          {results.status === 'OPEN' && (
            <Link to="/dashboard">
              <Button variant="primary" size="sm" leftIcon={<Vote className="w-3.5 h-3.5" />}>
                Cast / Change Vote
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Results View */}
      <ResultsView results={results} />

      {/* Edit Poll Modal for Admin */}
      <EditPollModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          refetchResults();
        }}
        poll={results}
      />

      {/* Voter List Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 font-display">
              Who Chose What
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {canViewVoters
                ? `Real-time colleague lunch preferences for today's catering order.`
                : 'Aggregated totals are visible; individual names are private per poll settings.'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {voters.length} votes recorded
          </span>
        </div>

        {canViewVoters ? (
          <VoterListTable voters={voters} isAdmin={isAdmin} isLoading={votersLoading} />
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 shadow-card">
            <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-extrabold text-slate-900">
              Voter Details Restricted
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              This poll is configured with anonymous voter details. Percentages and totals above reflect all recorded votes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
