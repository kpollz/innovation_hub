import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, AlertTriangle, Info, Edit2 } from 'lucide-react';
import { eventsApi } from '@/api/events';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

import { IntroductionTab } from './tabs/IntroductionTab';
import { TeamsTab } from './tabs/TeamsTab';
import { IdeasTab } from './tabs/ideas';
import { DashboardTab } from './tabs/DashboardTab';
import { FAQTab } from './tabs/FAQTab';
import { EditEventModal } from './tabs/EditEventModal';
import { EventIdeaDetailPage } from './tabs/ideas/EventIdeaDetailPage';
import type { EventObject, EventTeamObject } from '@/types';

const statusStyles: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  closed: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const EventDetailPage: React.FC = () => {
  const { id, ideaId } = useParams<{ id: string; ideaId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { showModal } = useUIStore();
  const isAdmin = user?.role === 'admin';

  const [event, setEvent] = useState<EventObject | null>(null);
  const [myTeam, setMyTeam] = useState<EventTeamObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const activeTab = searchParams.get('tab') || 'introduction';

  const fetchEvent = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const data = await eventsApi.getById(id);
      setEvent(data);
    } catch {
      setError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  // Fetch user's team for the event
  const fetchMyTeam = useCallback(async () => {
    if (!id) return;
    try {
      const result = await eventsApi.listTeams(id, 1, 100);
      for (const team of result.items) {
        // Check leader first
        const userStr = localStorage.getItem('auth-storage');
        const userId = userStr ? JSON.parse(userStr)?.state?.user?.id : null;
        if (team.leader_id === userId) {
          setMyTeam(team);
          return;
        }
        // Check membership
        try {
          const members = await eventsApi.listTeamMembers(id, team.id);
          const isMember = members.items.some(m => m.user_id === userId && m.status === 'active');
          if (isMember) {
            setMyTeam(team);
            return;
          }
        } catch { /* continue */ }
      }
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { if (event) fetchMyTeam(); }, [event, fetchMyTeam]);

  if (loading) {
    return (
      <div className="px-4 py-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600">{t('events.not_found')}</h3>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {t('events.back_to_events')}
          </button>
        </div>
      </div>
    );
  }

  // If ideaId is present, show the idea detail page
  if (ideaId) {
    return <EventIdeaDetailPage event={event} myTeam={myTeam} />;
  }

  const statusStyle = statusStyles[event.status] || statusStyles.draft;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Event Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
              {t(`events.status_${event.status}`)}
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={() => showModal({ type: 'editEvent' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
              {t('events.edit.button')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          {(event.start_date || event.end_date) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t('events.dates', {
                start: event.start_date ? new Date(event.start_date).toLocaleDateString() : '—',
                end: event.end_date ? new Date(event.end_date).toLocaleDateString() : '—',
              })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {t('events.team_count', { count: event.team_count })}
          </span>
          {event.creator && (
            <span>{t('common.author')}: {event.creator.full_name || event.creator.username}</span>
          )}
        </div>
      </div>

      {/* Status Notice */}
      {event.status === 'draft' && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          {t('events.draft_notice')}
        </div>
      )}
      {event.status === 'closed' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          {t('events.closed_notice')}
        </div>
      )}

      {/* Tab Content */}
      <div>
        {activeTab === 'introduction' && <IntroductionTab event={event} />}
        {activeTab === 'teams' && <TeamsTab event={event} />}
        {activeTab === 'ideas' && <IdeasTab event={event} />}
        {activeTab === 'dashboard' && <DashboardTab event={event} />}
        {activeTab === 'faq' && <FAQTab event={event} myTeam={myTeam} />}
      </div>

      {isAdmin && <EditEventModal event={event} onSaved={() => window.location.reload()} />}
    </div>
  );
};
