import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface DatePickerProps {
  label?: string;
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: string; // Format: YYYY-MM-DD
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  minDate,
  disabled = false,
  required = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to today
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const selectedDate = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState(() => (selectedDate ? new Date(selectedDate) : new Date()));

  // Sync viewDate when value changes from outside
  useEffect(() => {
    if (value) {
      setViewDate(parseDate(value));
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const newDateStr = `${currentYear}-${monthStr}-${dayStr}`;
    onChange(newDateStr);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    onChange(todayStr);
    setViewDate(new Date());
    setIsOpen(false);
  };

  // Calendar matrix calculation
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  // Format display text
  const formatDisplay = (dStr: string) => {
    if (!dStr) return 'Select date';
    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between px-3.5 py-2.5 rounded-input border text-sm font-medium transition-all text-left bg-navy-900/70 backdrop-blur-md',
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.2)] text-white'
            : 'border-white/[0.1] hover:border-white/[0.18] text-slate-200 shadow-subtle',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        <span className={value ? 'text-white font-semibold' : 'text-slate-500'}>
          {formatDisplay(value)}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {/* Popover Calendar: 100% Solid Opaque Professional Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[100] w-[290px] bg-[#0D1527] rounded-2xl border border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-3.5 animate-fade-in select-none">
          {/* Calendar Header: Month/Year navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <span className="text-sm font-bold text-white">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1 text-center my-2">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous month leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <span
                key={`prev-${i}`}
                className="w-8 h-8 flex items-center justify-center text-xs text-slate-600 pointer-events-none mx-auto"
              >
                {daysInPrevMonth - firstDayIndex + i + 1}
              </span>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === currentYear &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getDate() === day;

              const isToday = isCurrentMonthToday && today.getDate() === day;
              const monthStr = String(currentMonth + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dayDateStr = `${currentYear}-${monthStr}-${dayStr}`;
              const isPastMin = minDate ? dayDateStr < minDate : false;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPastMin}
                  onClick={() => !isPastMin && handleSelectDay(day)}
                  className={clsx(
                    'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all mx-auto',
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                      : isToday
                      ? 'bg-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/30'
                      : isPastMin
                      ? 'text-slate-600 opacity-25 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
