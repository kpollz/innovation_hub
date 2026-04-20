import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Plus, Calendar, Users, Lightbulb, ChevronRight } from 'lucide-react';
import { eventsApi } from '@/api/events';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { CreateEventModal } from './CreateEventModal';
import type { EventObject, EventStatus } from '@/types';

type FilterStatus = EventStatus | 'all';

const statusColors: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

export const EventsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showModal } = useUIStore();
  const [events, setEvents] = useState<EventObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const isAdmin = user?.role === 'admin';

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result = await eventsApi.list(
        filter === 'all' ? {} : { status: filter as EventStatus, limit: 100 }
      );
      setEvents(result.items);
    } catch {
      // error handled silently, empty state shown
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: t('common.all_statuses', 'All') },
    { key: 'active', label: t('events.status_active') },
    { key: 'draft', label: t('events.status_draft') },
    { key: 'closed', label: t('events.status_closed') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-section-heading font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary-600" />
            {t('events.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('events.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => showModal({ type: 'createEvent' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            {t('events.create_event')}
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="text-center py-16">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600">{t('events.no_events')}</h3>
          <p className="text-gray-400 mt-1">{t('events.no_events_desc')}</p>
        </div>
      )}

      {/* Event Cards */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                  {event.title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[event.status]}`}>
                  {t(`events.status_${event.status}`)}
                </span>
              </div>

              {/* Dates */}
              {(event.start_date || event.end_date) && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {t('events.dates', {
                      start: event.start_date ? new Date(event.start_date).toLocaleDateString() : '—',
                      end: event.end_date ? new Date(event.end_date).toLocaleDateString() : '—',
                    })}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {t('events.team_count', { count: event.team_count })}
                </span>
                <span className="flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  {t('events.idea_count', { count: event.idea_count })}
                </span>
              </div>

              {/* Arrow */}
              <div className="flex justify-end mt-3">
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateEventModal onSuccess={() => window.location.reload()} />
    </div>
  );
};
