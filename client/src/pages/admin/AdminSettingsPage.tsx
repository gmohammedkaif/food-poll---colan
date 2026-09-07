import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useToast } from '../../components/ui/Toast.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Clock, Globe, Save, Shield } from 'lucide-react';
import { ResultsVisibility } from '../../types/index.js';

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:30');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [allowVoteChange, setAllowVoteChange] = useState(true);
  const [resultsVisibility, setResultsVisibility] = useState<ResultsVisibility>('VOTER_NAMES_VISIBLE');
  const [autoFlag, setAutoFlag] = useState(true);
  const [maxSessions, setMaxSessions] = useState(3);

  const { data: settingsData } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      const schedule = settingsData.defaultVotingSchedule;
      const start = schedule?.startTime || settingsData.defaultStartTime || '11:00';
      const end = schedule?.endTime || settingsData.defaultEndTime || '12:30';
      const tz = schedule?.timezone || settingsData.timezone || 'Asia/Kolkata';
      setStartTime(start);
      setEndTime(end);
      setTimezone(tz);

      if (settingsData.votingRules) {
        setAllowVoteChange(settingsData.votingRules.allowVoteChange ?? true);
        setResultsVisibility(settingsData.votingRules.resultsVisibility || 'VOTER_NAMES_VISIBLE');
      } else if (settingsData.allowVoteChangeDefault !== undefined) {
        setAllowVoteChange(settingsData.allowVoteChangeDefault);
        setResultsVisibility(settingsData.defaultResultVisibility || 'VOTER_NAMES_VISIBLE');
      }

      if (settingsData.securityRules) {
        setAutoFlag(settingsData.securityRules.autoFlagSuspiciousActivity ?? true);
        setMaxSessions(settingsData.securityRules.maxConcurrentSessionsPerUser || 3);
      } else if (settingsData.autoFlagSuspiciousVotes !== undefined) {
        setAutoFlag(settingsData.autoFlagSuspiciousVotes);
        setMaxSessions(settingsData.maxActiveSessionsPerEmployee || 3);
      }
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        defaultVotingSchedule: { startTime, endTime, timezone },
        votingRules: { allowVoteChange, resultsVisibility },
        securityRules: {
          autoFlagSuspiciousActivity: autoFlag,
          maxConcurrentSessionsPerUser: maxSessions,
        },
      };
      return (await api.put('/settings', payload)).data;
    },
    onSuccess: () => {
      success('Settings Saved', 'Platform defaults updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
    onError: (err: any) => {
      error('Save Error', err.response?.data?.message || 'Failed to update system settings.');
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure default voting schedules, result visibility, and platform rules.
        </p>
      </div>

      <div className="space-y-6">
        {/* CARD 1: Default Voting Schedule */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Default Daily Voting Schedule
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Opening Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Cutoff Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Timezone
              </label>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* CARD 2: Voting & Results Policy */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Voting Policy
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowVoteChange}
                onChange={(e) => setAllowVoteChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Allow Employees to Update Vote
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Employees can modify their dish preference while the poll is active.
                </span>
              </div>
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Results Visibility
              </label>
              <select
                value={resultsVisibility}
                onChange={(e) => setResultsVisibility(e.target.value as ResultsVisibility)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="VOTER_NAMES_VISIBLE">Voter Names Visible</option>
                <option value="PUBLIC_RESULTS">Public Results</option>
                <option value="RESULTS_ONLY">Results Counts Only</option>
                <option value="ADMIN_ONLY">Admin Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
