import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { classNames } from '@/utils/helpers';

interface DatePickerProps {
  value: string;            // YYYY-MM-DD or ''
  onChange: (date: string) => void;
  placeholder?: string;
  min?: string;             // YYYY-MM-DD
  max?: string;             // YYYY-MM-DD
  className?: string;
  align?: 'left' | 'right'; // dropdown alignment
}

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DAY_NAMES_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const DAY_NAMES_VI = ['T2','T3','T4','T5','T6','T7','CN'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, we want Mon=0
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDisplay(dateStr: string, lang: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = lang.startsWith('vi') ? MONTH_NAMES_VI : MONTH_NAMES_EN;
  if (lang.startsWith('vi')) {
    return `${d} ${months[m - 1]}, ${y}`;
  }
  return `${months[m - 1]} ${d}, ${y}`;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder,
  min,
  max,
  className,
  align = 'left',
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isVi = lang.startsWith('vi');
  const monthNames = isVi ? MONTH_NAMES_VI : MONTH_NAMES_EN;
  const dayNames = isVi ? DAY_NAMES_VI : DAY_NAMES_EN;

  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value ? parseInt(value.split('-')[0]) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? parseInt(value.split('-')[1]) - 1 : today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const isDisabled = (day: number) => {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return value === `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
  };

  const isToday = (day: number) => {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={containerRef} className={classNames('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          'flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg bg-white transition-colors w-full',
          'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          value ? 'text-gray-700 border-gray-200' : 'text-gray-400 border-gray-200',
        )}
      >
        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="truncate">{value ? formatDisplay(value, lang) : (placeholder || 'Select date')}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={classNames('absolute top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-[280px]', align === 'right' ? 'right-0' : 'left-0')}>
          {/* Month/Year nav */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => !isDisabled(day) && handleDayClick(day)}
                    disabled={isDisabled(day)}
                    className={classNames(
                      'w-8 h-8 rounded-lg text-sm transition-colors',
                      isSelected(day)
                        ? 'bg-primary-600 text-white font-semibold'
                        : isToday(day)
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100',
                      isDisabled(day) && 'text-gray-300 cursor-not-allowed hover:bg-transparent',
                    )}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
