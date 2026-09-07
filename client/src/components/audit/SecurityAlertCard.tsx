import React from 'react';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { SecurityAlert } from '../../types/index.js';
import { formatDateTime } from '../../utils/formatters.js';

interface SecurityAlertCardProps {
  alert: SecurityAlert;
  onResolve?: (alertId: string) => void;
  isResolving?: boolean;
  onDelete?: (alertId: string) => void;
  isDeleting?: boolean;
}

export const SecurityAlertCard: React.FC<SecurityAlertCardProps> = ({
  alert,
  onResolve,
  isResolving = false,
  onDelete,
  isDeleting = false,
}) => {
  return (
    <div
      className={`border rounded-xl transition-all px-3.5 py-2.5 ${
        alert.resolved
          ? 'border-slate-200 bg-slate-50/80 opacity-60'
          : alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
          ? 'border-rose-200 bg-rose-50/40'
          : 'border-amber-200 bg-amber-50/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon + Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              alert.resolved
                ? 'bg-emerald-100 text-emerald-600'
                : alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                ? 'bg-rose-100 text-rose-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {alert.resolved ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${
                alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {alert.severity}
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
                {alert.type.replace(/_/g, ' ')}
              </span>
              {alert.resolved && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 leading-none">
                  RESOLVED
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
              {alert.description}
            </p>
          </div>
        </div>

        {/* Right: timestamp + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 hidden sm:block whitespace-nowrap">
            {formatDateTime(alert.createdAt)}
          </span>

          {!alert.resolved && onResolve && (
            <button
              type="button"
              onClick={() => onResolve(alert._id)}
              disabled={isResolving}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              Resolve
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(alert._id);
              }}
              disabled={isDeleting}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
              title="Delete alert"
              aria-label="Delete alert"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Compact details row */}
      {alert.details && !alert.resolved && (
        <div className="mt-1.5 ml-8 flex items-center gap-3 text-[10px] font-mono text-slate-500">
          {alert.details.originalOption && alert.details.newOption && (
            <span>
              <span className="text-slate-700">{alert.details.originalOption}</span>
              {' → '}
              <span className="text-blue-600">{alert.details.newOption}</span>
            </span>
          )}
          {alert.details.originalIP && (
            <span>
              IP: {alert.details.originalIP} → {alert.details.newIP}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
