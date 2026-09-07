import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface TimePickerProps {
  label?: string;
  value: string; // Format: "HH:mm" (24-hour string, e.g. "11:00", "15:30")
  onChange: (time24: string) => void;
  minTime?: string; // Format: "HH:mm"
  align?: 'left' | 'right';
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Format 24-hour HH:mm to 12-hour "hh:mm A"
function format24To12Display(time24: string): string {
  if (!time24 || !time24.includes(':')) return '11:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr.padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
}

// Convert "HH:mm" to total minutes from midnight
function toMinutes(time24: string): number {
  if (!time24 || !time24.includes(':')) return 0;
  const [h, m] = time24.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Generate standard 15-minute time slots across the day (96 slots)
const TIME_SLOTS: { time24: string; label: string; minutes: number }[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    TIME_SLOTS.push({
      time24,
      label: format24To12Display(time24),
      minutes: h * 60 + m,
    });
  }
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES_5 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value = '11:00',
  onChange,
  minTime,
  align = 'left',
  disabled = false,
  required = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'custom'>('list');
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const minMinutes = useMemo(() => (minTime ? toMinutes(minTime) : null), [minTime]);
  const currentMinutes = useMemo(() => toMinutes(value), [value]);

  // Auto-correct if current value is earlier than minTime
  useEffect(() => {
    if (minMinutes !== null && currentMinutes < minMinutes) {
      const minH = Math.floor(minMinutes / 60);
      const minM = minMinutes % 60;
      const validTime = `${String(minH).padStart(2, '0')}:${String(minM).padStart(2, '0')}`;
      onChange(validTime);
    }
  }, [minMinutes, currentMinutes, onChange]);

  // Click outside and Escape key to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-scroll selected item into view when opened in list mode
  useEffect(() => {
    if (isOpen && mode === 'list' && activeItemRef.current) {
      // Small timeout to allow DOM layout
      const timer = setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  // Parse current 24h value to 12h parts for custom mode
  const { hour12, minute, period } = useMemo(() => {
    if (!value || !value.includes(':')) {
      return { hour12: 11, minute: '00', period: 'AM' as const };
    }
    const [hStr, mStr] = value.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr.padStart(2, '0');
    const p = h >= 12 ? ('PM' as const) : ('AM' as const);
    h = h % 12;
    if (h === 0) h = 12;
    return { hour12: h, minute: m, period: p };
  }, [value]);

  const handleCustomChange = (h12: number, mStr: string, p: 'AM' | 'PM') => {
    let h24 = h12;
    if (p === 'PM' && h24 < 12) h24 += 12;
    if (p === 'AM' && h24 === 12) h24 = 0;
    const time24 = `${String(h24).padStart(2, '0')}:${mStr}`;

    if (minMinutes !== null && h24 * 60 + parseInt(mStr, 10) < minMinutes) {
      return; // Disallow picking invalid past time
    }
    onChange(time24);
  };

  const displayTime = format24To12Display(value);

  // Check if current value exists in TIME_SLOTS; if not, inject it so it's visible
  const visibleSlots = useMemo(() => {
    const exists = TIME_SLOTS.some((s) => s.time24 === value);
    if (!exists && value) {
      const customSlot = {
        time24: value,
        label: displayTime,
        minutes: currentMinutes,
      };
      return [...TIME_SLOTS, customSlot].sort((a, b) => a.minutes - b.minutes);
    }
    return TIME_SLOTS;
  }, [value, displayTime, currentMinutes]);

  return (
    <div className={clsx('relative', isOpen && 'z-50', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Trigger Button: Clean, Sleek, Professional */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left bg-navy-900/70 backdrop-blur-md',
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.25)] text-white'
            : 'border-white/[0.1] hover:border-white/[0.18] text-slate-200 shadow-subtle',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-white font-semibold font-mono tracking-wide text-xs sm:text-sm">
            {displayTime}
          </span>
        </div>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-slate-400 transition-transform duration-150',
            isOpen && 'rotate-180 text-blue-400'
          )}
        />
      </button>

      {/* Small, Professional, Compact Time Dropdown */}
      {isOpen && (
        <div
          className={clsx(
            'absolute top-full mt-1.5 z-[100] w-52 bg-[#0D1527] rounded-xl border border-slate-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.85)] p-1.5 animate-fade-in select-none',
            align === 'right' ? 'right-0 left-auto' : 'left-0'
          )}
        >
          {/* Header Bar: Mode Switcher */}
          <div className="flex items-center justify-between px-1.5 py-1 mb-1 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {mode === 'list' ? 'Select Time' : 'Exact Time'}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === 'list' ? 'custom' : 'list')}
              className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors px-1 py-0.5 rounded hover:bg-slate-800"
            >
              {mode === 'list' ? 'Custom...' : 'Presets'}
            </button>
          </div>

          {/* MODE 1: Fast 1-Click Scrollable List */}
          {mode === 'list' ? (
            <div
              ref={listRef}
              className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
            >
              {visibleSlots.map((slot) => {
                const isSelected = slot.time24 === value;
                const isPast = minMinutes !== null && slot.minutes < minMinutes;

                return (
                  <button
                    key={slot.time24}
                    ref={isSelected ? activeItemRef : undefined}
                    type="button"
                    disabled={isPast}
                    onClick={() => {
                      if (isPast) return;
                      onChange(slot.time24);
                      setIsOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors text-left',
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : isPast
                        ? 'text-slate-600 opacity-30 cursor-not-allowed bg-transparent'
                        : 'text-slate-300 hover:bg-[#16233F] hover:text-white'
                    )}
                  >
                    <span>{slot.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            /* MODE 2: Compact 3-Column Roller (Hour, Minute, AM/PM) */
            <div className="py-1">
              <div className="grid grid-cols-3 gap-1 text-center">
                {/* Hours Column */}
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block mb-1">
                    Hour
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
                    {HOURS_12.map((h) => {
                      const isSel = h === hour12;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleCustomChange(h, minute, period)}
                          className={clsx(
                            'w-full py-1 text-xs font-mono font-medium rounded-md transition-colors',
                            isSel
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'text-slate-300 hover:bg-[#16233F] hover:text-white'
                          )}
                        >
                          {String(h).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minutes Column */}
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block mb-1">
                    Min
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
                    {MINUTES_5.map((m) => {
                      const isSel = m === minute;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleCustomChange(hour12, m, period)}
                          className={clsx(
                            'w-full py-1 text-xs font-mono font-medium rounded-md transition-colors',
                            isSel
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'text-slate-300 hover:bg-[#16233F] hover:text-white'
                          )}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Period Column */}
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block mb-1">
                    Period
                  </span>
                  <div className="space-y-1">
                    {(['AM', 'PM'] as const).map((p) => {
                      const isSel = p === period;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleCustomChange(hour12, minute, p)}
                          className={clsx(
                            'w-full py-1.5 text-xs font-bold rounded-md transition-colors',
                            isSel
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-300 hover:bg-[#16233F] hover:text-white bg-[#080E1A] border border-slate-800'
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full mt-4 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
