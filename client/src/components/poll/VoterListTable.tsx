import React, { useState } from 'react';
import { Laptop } from 'lucide-react';
import { VoterItem } from '../../types/index.js';
import { formatTime } from '../../utils/formatters.js';

interface VoterListTableProps {
  voters: VoterItem[];
  isAdmin?: boolean;
  isLoading?: boolean;
}

export const VoterListTable: React.FC<VoterListTableProps> = ({
  voters,
  isAdmin = false,
  isLoading = false,
}) => {
  const [showSecurityMeta, setShowSecurityMeta] = useState(false);

  const filtered = voters;

  return (
    <div className="space-y-4">
      {/* Admin Inspection Toggle */}
      {isAdmin && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowSecurityMeta(!showSecurityMeta)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
          >
            <Laptop className="w-3.5 h-3.5 text-blue-600" />
            <span>{showSecurityMeta ? 'Hide Audit Signals' : 'Inspect Audit Signals (Admin)'}</span>
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Choice</th>
                <th className="py-3.5 px-6">Time</th>
                {isAdmin && showSecurityMeta && (
                  <>
                    <th className="py-3.5 px-6">IP Address</th>
                    <th className="py-3.5 px-6">Device</th>
                    <th className="py-3.5 px-6">Session</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isAdmin && showSecurityMeta ? 6 : 3}
                    className="py-12 text-center text-slate-400 animate-pulse"
                  >
                    Loading voter roster...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin && showSecurityMeta ? 6 : 3}
                    className="py-12 text-center text-slate-400"
                  >
                    No matching voters found.
                  </td>
                </tr>
              ) : (
                filtered.map((voter, idx) => (
                  <tr key={`${voter.employeeId}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {voter.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {voter.employeeId}
                      </div>
                    </td>

                    {/* Choice */}
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {voter.selectedOptionName}
                      </span>
                    </td>

                    {/* Submission Time */}
                    <td className="py-3.5 px-6 text-xs text-slate-500 font-mono">
                      {formatTime(voter.updatedAt || voter.submittedAt)}
                    </td>

                    {/* Admin Only Audit Signals */}
                    {isAdmin && showSecurityMeta && (
                      <>
                        <td className="py-3.5 px-6 text-xs font-mono text-slate-500">
                          {voter.ipAddress || 'unknown'}
                        </td>
                        <td className="py-3.5 px-6 text-xs font-mono text-slate-500 max-w-xs truncate">
                          {voter.deviceIdentifier || 'unknown'}
                        </td>
                        <td className="py-3.5 px-6 text-xs font-mono text-slate-500">
                          {voter.sessionId ? `${voter.sessionId.substring(0, 10)}...` : 'unknown'}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-2.5">
        {isLoading ? (
          <div className="py-8 text-center text-slate-400 animate-pulse">Loading roster...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No matching voters found.
          </div>
        ) : (
          filtered.map((voter, idx) => (
            <div
              key={`${voter.employeeId}-${idx}`}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-card space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{voter.employeeName}</div>
                  <div className="text-xs text-slate-500 font-mono">{voter.employeeId}</div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{formatTime(voter.updatedAt || voter.submittedAt)}</span>
              </div>
              <div className="pt-1">
                <span className="inline-block px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {voter.selectedOptionName}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
