import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useToast } from '../../components/ui/Toast.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { SecurityAlertCard } from '../../components/audit/SecurityAlertCard.js';
import { AuditLogTable } from '../../components/audit/AuditLogTable.js';
import { SecurityAlert, AuditLog } from '../../types/index.js';

import {
  ShieldAlert,
  Activity,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

export const AdminAuditSecurityPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [category, setCategory] = useState<'alerts' | 'audit'>('alerts');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [page] = useState(1);

  // 1. Fetch Security Alerts
  const { data: alertsData } = useQuery({
    queryKey: ['allSecurityAlerts'],
    queryFn: async () => {
      const res = await api.get('/audit/alerts');
      const data = res.data.data;
      if (Array.isArray(data)) return data as SecurityAlert[];
      if (data?.alerts && Array.isArray(data.alerts)) return data.alerts as SecurityAlert[];
      return [] as SecurityAlert[];
    },
    refetchInterval: 20000,
  });

  // 2. Fetch Immutable Audit Stream
  const { data: auditData, isLoading: logsLoading } = useQuery({
    queryKey: ['auditLogs', employeeSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employeeSearch) params.append('employeeId', employeeSearch);
      params.append('page', page.toString());
      params.append('limit', '25');

      const res = await api.get(`/audit/logs?${params.toString()}`);
      return res.data.data;
    },
  });

  const alerts: SecurityAlert[] = Array.isArray(alertsData)
    ? alertsData
    : Array.isArray((alertsData as any)?.alerts)
    ? (alertsData as any).alerts
    : [];
  const logs: AuditLog[] = auditData?.logs || [];

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return (await api.post(`/audit/alerts/${alertId}/resolve`)).data;
    },
    onSuccess: () => {
      success('Alert Marked Reviewed', 'Incident status updated in audit stream.');
      queryClient.invalidateQueries({ queryKey: ['allSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['securityOverview'] });
    },
    onError: (err: any) => {
      error('Error', err.response?.data?.message || 'Failed to update alert status.');
    },
  });

  // Delete individual alert with instant optimistic UI update
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return (await api.delete(`/audit/alerts/${alertId}`)).data;
    },
    onMutate: async (alertId: string) => {
      await queryClient.cancelQueries({ queryKey: ['allSecurityAlerts'] });
      queryClient.setQueriesData({ queryKey: ['allSecurityAlerts'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.filter((a: any) => a._id !== alertId);
        if (old.alerts && Array.isArray(old.alerts)) {
          return { ...old, alerts: old.alerts.filter((a: any) => a._id !== alertId) };
        }
        return old;
      });
    },
    onSuccess: () => {
      success('Alert Deleted', 'Security alert permanently removed from database.');
      queryClient.invalidateQueries({ queryKey: ['allSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['securityOverview'] });
    },
    onError: (err: any) => {
      error('Delete Failed', err.response?.data?.message || 'Could not delete alert.');
      queryClient.invalidateQueries({ queryKey: ['allSecurityAlerts'] });
    },
  });

  // Clear alerts (resolved or all) with instant optimistic UI update
  const clearAlertsMutation = useMutation({
    mutationFn: async (resolvedOnly: boolean = false) => {
      return (await api.delete(`/audit/alerts?resolvedOnly=${resolvedOnly}`)).data;
    },
    onMutate: async (resolvedOnly: boolean = false) => {
      await queryClient.cancelQueries({ queryKey: ['allSecurityAlerts'] });
      queryClient.setQueriesData({ queryKey: ['allSecurityAlerts'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return resolvedOnly ? old.filter((a: any) => !a.resolved) : [];
        }
        if (old.alerts && Array.isArray(old.alerts)) {
          return {
            ...old,
            alerts: resolvedOnly ? old.alerts.filter((a: any) => !a.resolved) : [],
          };
        }
        return old;
      });
    },
    onSuccess: (data: any) => {
      success('Alerts Removed', data.message || 'Security alerts removed from database.');
      queryClient.invalidateQueries({ queryKey: ['allSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['securityOverview'] });
    },
    onError: (err: any) => {
      error('Clear Failed', err.response?.data?.message || 'Could not clear alerts.');
      queryClient.invalidateQueries({ queryKey: ['allSecurityAlerts'] });
    },
  });

  // Delete individual audit log with instant optimistic UI update
  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      return (await api.delete(`/audit/logs/${logId}`)).data;
    },
    onMutate: async (logId: string) => {
      await queryClient.cancelQueries({ queryKey: ['auditLogs'] });
      queryClient.setQueriesData({ queryKey: ['auditLogs'] }, (old: any) => {
        if (!old) return old;
        if (old.logs && Array.isArray(old.logs)) {
          return { ...old, logs: old.logs.filter((l: any) => l._id !== logId) };
        }
        return old;
      });
    },
    onSuccess: () => {
      success('Record Deleted', 'Audit record permanently removed from database.');
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['securityOverview'] });
    },
    onError: (err: any) => {
      error('Delete Failed', err.response?.data?.message || 'Could not delete audit record.');
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  // Clear all audit logs with instant optimistic UI update
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      return (await api.delete('/audit/logs')).data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['auditLogs'] });
      queryClient.setQueriesData({ queryKey: ['auditLogs'] }, (old: any) => {
        if (!old) return old;
        return { ...old, logs: [] };
      });
    },
    onSuccess: (data: any) => {
      success('Logs Cleared', data.message || 'Audit logs removed from database.');
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['securityOverview'] });
    },
    onError: (err: any) => {
      error('Clear Failed', err.response?.data?.message || 'Could not clear audit records.');
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* Header Row — compact */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight font-display">
            Audit & Security
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Event timeline, vote shifts & credential audit trail
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {category === 'alerts' && resolvedAlerts.length > 0 && (
            <button
              onClick={() => clearAlertsMutation.mutate(true)}
              disabled={clearAlertsMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Clear Resolved ({resolvedAlerts.length})
            </button>
          )}

          {category === 'alerts' && alerts.length > 0 && (
            <button
              onClick={() => clearAlertsMutation.mutate(false)}
              disabled={clearAlertsMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Delete All
            </button>
          )}

          {category === 'audit' && logs.length > 0 && (
            <button
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}

          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['allSecurityAlerts'] });
              queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
              queryClient.invalidateQueries({ queryKey: ['securityOverview'] });
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Compact KPI + Tab row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Mini KPI pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Unresolved</span>
            <span className="text-sm font-black text-slate-900 ml-0.5">{unresolvedAlerts.length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Events</span>
            <span className="text-sm font-black text-slate-900 ml-0.5">{logs.length}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg ml-auto">
          <button
            onClick={() => setCategory('alerts')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              category === 'alerts'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setCategory('audit')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              category === 'audit'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* Category Content */}
      {category === 'alerts' ? (
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
              <ShieldAlert className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
              <h3 className="text-sm font-extrabold text-slate-900">No Security Anomalies</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All clear — no anomalous activity detected.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <SecurityAlertCard
                key={alert._id}
                alert={alert}
                onResolve={(id) => resolveAlertMutation.mutate(id)}
                isResolving={resolveAlertMutation.isPending}
                onDelete={(id) => deleteAlertMutation.mutate(id)}
                isDeleting={deleteAlertMutation.isPending && deleteAlertMutation.variables === alert._id}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="max-w-[220px]">
            <Input
              placeholder="Search by Employee ID..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            />
          </div>
          <AuditLogTable
            logs={logs}
            isLoading={logsLoading}
            onDeleteLog={(id) => deleteLogMutation.mutate(id)}
            isDeletingLogId={deleteLogMutation.isPending ? (deleteLogMutation.variables as string) : null}
          />
        </div>
      )}
    </div>
  );
};
