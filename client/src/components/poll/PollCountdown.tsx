import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { calculateRemainingTime } from '../../utils/formatters.js';

interface PollCountdownProps {
  endAt?: string | Date;
  startAt?: string | Date;
  status: 'OPEN' | 'SCHEDULED' | 'CLOSED' | 'DRAFT' | 'ARCHIVED';
  onExpire?: () => void;
  variant?: 'inline' | 'digits';
}

export const PollCountdown: React.FC<PollCountdownProps> = ({
  endAt,
  startAt,
  status,
  onExpire,
  variant = 'digits',
}) => {
  const targetTime = status === 'SCHEDULED' ? startAt : endAt;
  const [time, setTime] = useState(() => calculateRemainingTime(targetTime));

  useEffect(() => {
    if (status !== 'OPEN' && status !== 'SCHEDULED') return;

    const timer = setInterval(() => {
      const remaining = calculateRemainingTime(targetTime);
      setTime(remaining);

      if (remaining.isExpired) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, status, onExpire]);

  if (status === 'CLOSED' || status === 'ARCHIVED' || (status === 'OPEN' && time.isExpired)) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Voting Concluded</span>
      </div>
    );
  }

  if (variant === 'digits') {
    return (
      <div>
        <div className="flex items-center justify-center gap-2 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {time.hours}
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400 mt-1 font-sans">
              Hours
            </span>
          </div>
          <span className="text-lg font-black text-slate-300 -mt-3">:</span>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {time.minutes}
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400 mt-1 font-sans">
              Minutes
            </span>
          </div>
          <span className="text-lg font-black text-slate-300 -mt-3">:</span>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight leading-none">
              {time.seconds}
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400 mt-1 font-sans">
              Seconds
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/80 font-mono">
      <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
      <span>
        {time.hours}:{time.minutes}:{time.seconds}
      </span>
    </div>
  );
};
