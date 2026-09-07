import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useToast } from '../../components/ui/Toast.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal.js';
import { PollStatusBadge } from '../../components/poll/PollStatusBadge.js';
import { EditPollModal } from '../../components/poll/EditPollModal.js';
import { Poll } from '../../types/index.js';
import { formatTime, formatDate } from '../../utils/formatters.js';

import {
  PlusCircle,
  Search,
  BarChart3,
  Edit2,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';

export const AdminPollsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pollToEdit, setPollToEdit] = useState<Poll | null>(null);

  const { data: pollsData, isLoading } = useQuery({
    queryKey: ['adminPolls', statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/polls?${params.toString()}`);
      return res.data.data;
    },
  });

  const polls: Poll[] = pollsData?.polls || [];

  const closePollMutation = useMutation({
    mutationFn: async (pollId: string) => {
      const res = await api.post(`/polls/${pollId}/close`);
      return res.data;
    },
    onSuccess: () => {
      success('Poll Closed', 'Poll closed successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminPolls'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivePolls'] });
      queryClient.invalidateQueries({ queryKey: ['activePoll'] });
      queryClient.invalidateQueries({ queryKey: ['pollResults'] });
    },
    onError: (err: any) => {
      error('Close Error', err.response?.data?.message || 'Failed to close poll.');
    },
  });

  // Database DELETE mutation
  const deletePollMutation = useMutation({
    mutationFn: async (pollId: string) => {
      const res = await api.delete(`/polls/${pollId}`);
      return res.data;
    },
    onSuccess: (resData) => {
      setDeleteModalOpen(false);
      setPollToDelete(null);
      success('Poll Deleted', resData.message || 'Poll removed from database.');
      queryClient.invalidateQueries({ queryKey: ['adminPolls'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivePolls'] });
      queryClient.invalidateQueries({ queryKey: ['activePoll'] });
    },
    onError: (err: any) => {
      error('Deletion Failed', err.response?.data?.message || 'Could not delete poll.');
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Polls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage workplace dining polls, schedules, and active voting.
          </p>
        </div>

        <Link to="/admin/polls/create" className="self-start sm:self-auto">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Poll
          </Button>
        </Link>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Search polls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto w-full sm:w-auto">
          {[
            { key: '', label: 'All' },
            { key: 'OPEN', label: 'Live' },
            { key: 'SCHEDULED', label: 'Scheduled' },
            { key: 'CLOSED', label: 'Ended' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st.key
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Polls Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 shadow-card animate-pulse" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-card p-8">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 font-display">No Polls Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {search ? 'Try adjusting your search criteria.' : 'Create your first daily meal poll to begin.'}
          </p>
          {!search && (
            <Link to="/admin/polls/create" className="mt-4 inline-block">
              <Button variant="primary" size="sm">Create First Poll</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div
              key={poll._id}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
            >
              {/* Left Column: Poll Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <PollStatusBadge status={poll.status} size="sm" />
                  <span className="text-xs font-semibold text-slate-400">
                    {formatDate(poll.pollDate)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-mono text-slate-500">
                    {formatTime(poll.startAt)} – {formatTime(poll.endAt)}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 font-display truncate">
                  {poll.title}
                </h3>

                {/* Food Thumbnails Preview */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 flex-wrap">
                  {poll.options?.slice(0, 5).map((opt, idx) => (
                    <div
                      key={`${opt._id || opt.foodNameSnapshot}-${idx}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 max-w-full"
                    >
                      {opt.foodImageSnapshot && (
                        <img
                          src={opt.foodImageSnapshot}
                          alt={opt.foodNameSnapshot}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-md object-cover shrink-0"
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                        />
                      )}
                      <span className="truncate">{opt.foodNameSnapshot}</span>
                    </div>
                  ))}
                  {poll.options && poll.options.length > 5 && (
                    <span className="text-xs text-slate-400 font-bold">
                      +{poll.options.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Votes Count & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <div className="text-left md:text-right mr-1 sm:mr-3">
                  <div className="flex items-baseline md:justify-end gap-1">
                    <span className="text-lg sm:text-2xl font-black text-slate-900 font-display leading-none">
                      {poll.totalVotes ?? 0}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 md:hidden">
                      {(poll.totalVotes ?? 0) === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden md:block mt-0.5">
                    {(poll.totalVotes ?? 0) === 1 ? 'Vote Cast' : 'Votes Cast'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to={`/polls/${poll._id}/results`}>
                    <Button variant="outline" size="sm" leftIcon={<BarChart3 className="w-3.5 h-3.5 text-blue-600" />}>
                      Results
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    aria-label="Edit poll"
                    onClick={() => {
                      setPollToEdit(poll);
                      setEditModalOpen(true);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  </Button>

                  {poll.status === 'OPEN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => closePollMutation.mutate(poll._id)}
                      disabled={closePollMutation.isPending}
                    >
                      Close
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setPollToDelete(poll);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    aria-label="Delete poll"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Poll Modal */}
      {pollToEdit && (
        <EditPollModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setPollToEdit(null);
            queryClient.invalidateQueries({ queryKey: ['adminPolls'] });
          }}
          poll={pollToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPollToDelete(null);
        }}
        onConfirm={() => pollToDelete && deletePollMutation.mutate(pollToDelete._id)}
        title="Delete Poll"
        description={`Are you sure you want to permanently delete "${pollToDelete?.title}"? All associated votes will be removed.`}
        isLoading={deletePollMutation.isPending}
      />
    </div>
  );
};
