import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, AlertTriangle, Info, Edit2, FileText, HelpCircle, Lightbulb, LayoutDashboard } from 'lucide-react';
import { eventsApi } from '@/api/events';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

import { IntroductionTab } from './tabs/IntroductionTab';
import { TeamsTab } from './tabs/TeamsTab';
import { IdeasTab } from './tabs/ideas';
import { DashboardTab } from './tabs/DashboardTab';
import { FAQTab } from './tabs/FAQTab';
import { EditEventModal } from './tabs/EditEventModal';
import { EventIdeaDetailPage } from './tabs/ideas/EventIdeaDetailPage';
import type { EventObject, EventTeamObject } from '@/types';

const statusStyles: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-muted', text: 'text-foreground/70' },
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  closed: { bg: 'bg-red-100', text: 'text-red-700' },
};

const eventTabs = [
  { key: 'introduction', label: 'events.tabs.introduction', icon: FileText },
  { key: 'teams', label: 'events.tabs.teams', icon: Users },
  { key: 'ideas', label: 'events.tabs.ideas', icon: Lightbulb },
  { key: 'dashboard', label: 'events.tabs.dashboard', icon: LayoutDashboard },
  { key: 'faq', label: 'events.tabs.faq', icon: HelpCircle },
];

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

  const fetchEventCounter = useRef(0);
  const fetchMyTeamCounter = useRef(0);

  const fetchEvent = useCallback(async (silent = false) => {
    if (!id) return;
    const thisRequest = ++fetchEventCounter.current;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const data = await eventsApi.getById(id);
      if (thisRequest === fetchEventCounter.current) {
        setEvent(data);
      }
    } catch {
      if (thisRequest === fetchEventCounter.current) {
        setError(true);
      }
    } finally {
      if (thisRequest === fetchEventCounter.current && !silent) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  // Fetch user's team for the event
  const fetchMyTeam = useCallback(async () => {
    if (!id) return;
    const thisRequest = ++fetchMyTeamCounter.current;
    try {
      const result = await eventsApi.listTeams(id, 1, 100);
      if (thisRequest !== fetchMyTeamCounter.current) return;
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
          if (thisRequest !== fetchMyTeamCounter.current) return;
          const isMember = members.items.some(m => m.user_id === userId && m.status === 'active');
          if (isMember) {
            setMyTeam(team);
            return;
          }
        } catch { /* continue */ }
      }
      // No team found — user is not in any team
      setMyTeam(null);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { if (event) fetchMyTeam(); }, [event, fetchMyTeam]);

  const handleTeamChange = useCallback(async () => {
    await Promise.all([fetchEvent(true), fetchMyTeam()]);
  }, [fetchEvent, fetchMyTeam]);

  if (loading) {
    return (
      <div className="px-4 py-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-muted-foreground">{t('events.not_found')}</h3>
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
            <h1 className="text-section-heading font-bold text-foreground">{event.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
              {t(`events.status_${event.status}`)}
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={() => showModal({ type: 'editEvent' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground/70 bg-white border border-border rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
              {t('events.edit.button')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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

      {/* Event Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-3 flex-wrap">
        {eventTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(`/events/${event.id}?tab=${tab.key}`, { replace: true })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'introduction' && <IntroductionTab event={event} />}
        {activeTab === 'teams' && <TeamsTab event={event} onTeamChange={handleTeamChange} />}
        {activeTab === 'ideas' && <IdeasTab event={event} />}
        {activeTab === 'dashboard' && <DashboardTab event={event} isAdmin={isAdmin} />}
        {activeTab === 'faq' && <FAQTab event={event} myTeam={myTeam} />}
      </div>

      {isAdmin && <EditEventModal event={event} onSaved={async () => { await fetchEvent(true); }} />}
    </div>
  );
};
