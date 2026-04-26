import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import type { EventObject } from '@/types';

interface UpcomingDeadlinesProps {
  events: EventObject[];
}

const EVENT_COLORS = [
  'from-purple-600 to-blue-600',
  'from-green-600 to-cyan-600',
  'from-red-500 to-amber-500',
  'from-indigo-600 to-purple-600',
  'from-teal-500 to-blue-500',
];

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ events }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sortedEvents = [...events]
    .sort((a, b) => {
      const aDate = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const bDate = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return aDate - bDate;
    })
    .slice(0, 5);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('userDashboard.currently_events')}</h2>
      {sortedEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('userDashboard.no_events')}</p>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event, idx) => {
            let timeText: string;
            if (event.end_date) {
              const end = new Date(event.end_date);
              const now = new Date();
              const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              timeText = days > 0
                ? t('userDashboard.days_remaining', { count: days })
                : t('userDashboard.ending_today');
            } else {
              timeText = t('userDashboard.active_now', 'Active now');
            }
            return (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${EVENT_COLORS[idx % EVENT_COLORS.length]} flex items-center justify-center text-white flex-shrink-0`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">{event.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {timeText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
