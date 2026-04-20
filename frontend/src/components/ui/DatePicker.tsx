import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover } from '@/components/ui/Popover';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DAY_NAMES_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const DAY_NAMES_VI = ['T2','T3','T4','T5','T6','T7','CN'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
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
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 h-10 w-full px-3 text-sm border rounded-standard bg-background transition-colors',
          'hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value ? 'text-foreground border-input' : 'text-muted-foreground border-input',
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{value ? formatDisplay(value, lang) : (placeholder || 'Select date')}</span>
      </button>

      <Popover
        triggerRef={triggerRef}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        align={align}
        className="w-[280px] bg-card rounded-feature shadow-clay border border-border p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={goToPrevMonth} className="p-1 hover:bg-secondary rounded-standard transition-colors">
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">
            {monthNames[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={goToNextMonth} className="p-1 hover:bg-secondary rounded-standard transition-colors">
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div key={i} className="flex items-center justify-center">
              {day ? (
                <button
                  type="button"
                  onClick={() => !isDisabled(day) && handleDayClick(day)}
                  disabled={isDisabled(day)}
                  className={cn(
                    'w-8 h-8 rounded-standard text-sm transition-colors',
                    isSelected(day)
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : isToday(day)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-secondary',
                    isDisabled(day) && 'text-muted-foreground cursor-not-allowed hover:bg-transparent',
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
      </Popover>
    </div>
  );
};
