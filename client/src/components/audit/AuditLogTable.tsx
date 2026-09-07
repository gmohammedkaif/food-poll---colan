import React from 'react';
import { Trash2 } from 'lucide-react';
import { AuditLog } from '../../types/index.js';
import { formatDateTime } from '../../utils/formatters.js';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  onSelectLog?: (log: AuditLog) => void;
  onDeleteLog?: (logId: string) => void;
  isDeletingLogId?: string | null;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  isLoading = false,
  onSelectLog,
  onDeleteLog,
  isDeletingLogId,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2 px-3">Timestamp</th>
              <th className="py-2 px-3">Action</th>
              <th className="py-2 px-3">Actor</th>
              <th className="py-2 px-3">Details</th>
              <th className="py-2 px-3">IP</th>
              {onDeleteLog && <th className="py-2 px-3 w-8"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[11px]">
            {isLoading ? (
              <tr>
                <td colSpan={onDeleteLog ? 6 : 5} className="py-6 text-center text-slate-400 text-xs">
                  Loading audit records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={onDeleteLog ? 6 : 5} className="py-6 text-center text-slate-400 text-xs">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log._id}
                  onClick={() => onSelectLog && onSelectLog(log)}
                  className={`transition-colors ${
                    onSelectLog ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {log.actorUserId?.name || log.actorEmployeeId || 'System'}
                  </td>
                  <td className="py-2 px-3 text-slate-500 max-w-[200px] truncate">
                    {log.previousOptionName
                      ? `${log.previousOptionName} → ${log.newOptionName}`
                      : log.reason || (log.metadata ? JSON.stringify(log.metadata) : '—')}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">
                    {log.ipAddress || '—'}
                  </td>
                  {onDeleteLog && (
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLog(log._id);
                        }}
                        disabled={isDeletingLogId === log._id}
                        className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Delete record"
                        aria-label="Delete log record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
