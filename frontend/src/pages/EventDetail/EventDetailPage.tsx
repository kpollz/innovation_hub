import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Users, AlertTriangle, Info } from 'lucide-react';
import { eventsApi } from '@/api/events';
import { EVENT_TABS } from '@/utils/constants';
import { IntroductionTab } from './tabs/IntroductionTab';
import { TeamsTab } from './tabs/TeamsTab';
import { IdeasTab } from './tabs/ideas';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const [event, setEvent] = useState<EventObject | null>(null);
  const [myTeam, setMyTeam] = useState<EventTeamObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const activeTab = searchParams.get('tab') || 'introduction';

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await eventsApi.getById(id);
        setEvent(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

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

  const handleTabChange = (tabKey: string) => {
    setSearchParams({ tab: tabKey });
  };

  if (loading) {
    return (
      <div className="px-4 py-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-md w-24" />
          ))}
        </div>
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
    <div className="px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('events.back_to_events')}
      </button>

      {/* Event Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            {t(`events.status_${event.status}`)}
          </span>
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
        <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          {t('events.draft_notice')}
        </div>
      )}
      {event.status === 'closed' && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          {t('events.closed_notice')}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0">
          {EVENT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'introduction' && <IntroductionTab event={event} />}
        {activeTab === 'teams' && <TeamsTab event={event} />}
        {activeTab === 'ideas' && <IdeasTab event={event} />}
        {activeTab !== 'introduction' && activeTab !== 'teams' && activeTab !== 'ideas' && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🚧</div>
            <h3 className="text-lg font-medium text-gray-500">{t('events.tabs.coming_soon')}</h3>
          </div>
        )}
      </div>
    </div>
  );
};
