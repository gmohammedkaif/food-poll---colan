import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useToast } from '../ui/Toast.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { DatePicker } from '../ui/DatePicker.js';
import { TimePicker } from '../ui/TimePicker.js';
import { PollStatusBadge } from './PollStatusBadge.js';
import { PollStatus, ResultsVisibility } from '../../types/index.js';
import {
  X,
  Edit2,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export interface EditablePoll {
  _id?: string;
  pollId?: string;
  title: string;
  description?: string;
  pollDate?: string;
  startAt: string;
  endAt: string;
  status: PollStatus;
  allowVoteChange?: boolean;
  resultsVisibility?: ResultsVisibility;
}

interface EditPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: EditablePoll | null;
}

export const EditPollModal: React.FC<EditPollModalProps> = ({
  isOpen,
  onClose,
  poll,
}) => {
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pollDate, setPollDate] = useState('');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:30');
  const [allowVoteChange, setAllowVoteChange] = useState(true);
  const [resultsVisibility, setResultsVisibility] = useState<ResultsVisibility>('VOTER_NAMES_VISIBLE');

  const getTodayLocal = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getNextFiveMinutes = () => {
    const now = new Date();
    const h = now.getHours();
    const m = Math.ceil(now.getMinutes() / 5) * 5;
    if (m >= 60) {
      return `${String((h + 1) % 24).padStart(2, '0')}:00`;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const todayLocal = getTodayLocal();
  const currentMinTime = getNextFiveMinutes();

  useEffect(() => {
    if (poll) {
      setTitle(poll.title);
      setDescription(poll.description || '');

      const rawDate = poll.pollDate || poll.startAt;
      const pd = new Date(rawDate);
      const y = pd.getFullYear();
      const m = String(pd.getMonth() + 1).padStart(2, '0');
      const d = String(pd.getDate()).padStart(2, '0');
      setPollDate(`${y}-${m}-${d}`);

      const s = new Date(poll.startAt);
      setStartTime(`${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`);

      const e = new Date(poll.endAt);
      setEndTime(`${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`);

      setAllowVoteChange(poll.allowVoteChange ?? true);
      setResultsVisibility(poll.resultsVisibility || 'VOTER_NAMES_VISIBLE');
    }
  }, [poll]);

  const handleExtendCutoff = (minutesToAdd: number) => {
    const [h, m] = endTime.split(':').map(Number);
    let totalM = h * 60 + m + minutesToAdd;
    if (totalM >= 24 * 60) {
      totalM = 23 * 60 + 55;
    }
    const newH = Math.floor(totalM / 60);
    const newM = totalM % 60;
    const newEndTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    setEndTime(newEndTime);
    info(
      'Cutoff Extended',
      `Cutoff time set to ${newH > 12 ? newH - 12 : newH === 0 ? 12 : newH}:${String(newM).padStart(2, '0')} ${newH >= 12 ? 'PM' : 'AM'}`
    );
  };

  const isToday = pollDate === todayLocal;
  const startPickerMinTime = isToday && poll?.status === 'SCHEDULED' ? currentMinTime : undefined;

  const endPickerMinTime = useMemo(() => {
    const [sh, sm] = startTime.split(':').map(Number);
    let nextM = sm + 5;
    let nextH = sh;
    if (nextM >= 60) {
      nextH = (nextH + 1) % 24;
      nextM -= 60;
    }
    return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
  }, [startTime]);

  const updatePollMutation = useMutation({
    mutationFn: async () => {
      const id = poll?._id || poll?.pollId;
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);

      const startAtDate = new Date(`${pollDate}T00:00:00`);
      startAtDate.setHours(sh, sm, 0, 0);

      const endAtDate = new Date(`${pollDate}T00:00:00`);
      endAtDate.setHours(eh, em, 0, 0);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        pollDate,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        allowVoteChange,
        resultsVisibility,
      };

      const res = await api.put(`/polls/${id}`, payload);
      return res.data;
    },
    onSuccess: (resData) => {
      success('Poll Updated', resData.message || 'Poll schedule and settings updated.');
      const id = poll?._id || poll?.pollId;
      queryClient.invalidateQueries({ queryKey: ['adminPolls'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivePolls'] });
      queryClient.invalidateQueries({ queryKey: ['pollResults', id] });
      queryClient.invalidateQueries({ queryKey: ['activePoll'] });
      onClose();
    },
    onError: (err: any) => {
      error('Update Failed', err.response?.data?.message || 'Could not update poll.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Validation Error', 'Poll title is required.');
      return;
    }
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      error('Invalid Schedule', 'Cutoff time must be strictly after the start time.');
      return;
    }
    updatePollMutation.mutate();
  };

  if (!isOpen || !poll) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl text-slate-900 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 font-display">Edit Poll</h2>
                <PollStatusBadge status={poll.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Update schedule, extend cutoff time, or adjust settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Poll Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Today's Lunch Preference"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Instructions / Subtitle
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Choose your meal preference for today's lunch catering."
              className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Schedule Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Schedule & Cutoff Time</span>
              </div>
              {/* Quick Extend Cutoff shortcuts */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1 font-semibold uppercase">Extend:</span>
                {[
                  { label: '+15m', mins: 15 },
                  { label: '+30m', mins: 30 },
                  { label: '+1h', mins: 60 },
                  { label: '+2h', mins: 120 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => handleExtendCutoff(btn.mins)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <DatePicker
                  value={pollDate}
                  onChange={setPollDate}
                  minDate={todayLocal}
                />
              </div>

              <TimePicker
                value={startTime}
                onChange={setStartTime}
                minTime={startPickerMinTime}
              />

              <TimePicker
                value={endTime}
                onChange={setEndTime}
                minTime={endPickerMinTime}
              />
            </div>
          </div>

          {/* Settings Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Allow Vote Changes
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Employees can modify their choice before cutoff
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowVoteChange}
                onChange={(e) => setAllowVoteChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Results Privacy & Visibility
              </label>
              <select
                value={resultsVisibility}
                onChange={(e) => setResultsVisibility(e.target.value as ResultsVisibility)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="VOTER_NAMES_VISIBLE">Voter Names Visible (Colleague lunch choices visible)</option>
                <option value="PUBLIC_RESULTS">Public Results (Counts and names open to all)</option>
                <option value="RESULTS_ONLY">Results Counts Only (Names hidden from employees)</option>
                <option value="ADMIN_ONLY">Admin Only (All stats hidden until poll concludes)</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={updatePollMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updatePollMutation.isPending}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
