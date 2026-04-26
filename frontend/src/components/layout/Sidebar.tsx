import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  AlertCircle,
  Lightbulb,
  LayoutDashboard,
  BarChart3,
  Users,
  Trophy,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { eventsApi } from '@/api/events';
import type { EventObject } from '@/types';

const navItems = [
  { path: '/', label: 'nav.home', icon: Home },
  { path: '/dashboard', label: 'nav.user_dashboard', icon: LayoutDashboard },
  { path: '/problems', label: 'nav.problem_feed', icon: AlertCircle },
  { path: '/rooms', label: 'nav.idea_lab', icon: Lightbulb },
  { path: '/help', label: 'nav.help', icon: HelpCircle },
];

const adminNavItems = [
  { path: '/admin', label: 'nav.analytics', icon: BarChart3 },
  { path: '/admin/users', label: 'nav.user_management', icon: Users },
];

const statusDot: Record<string, string> = {
  active: 'bg-green-500',
  draft: 'bg-gray-400',
  closed: 'bg-red-400',
};

const tabItems = [
  { key: 'introduction', label: 'events.tabs.introduction', icon: FileText },
  { key: 'teams', label: 'events.tabs.teams', icon: Users },
  { key: 'ideas', label: 'events.tabs.ideas', icon: Lightbulb },
  { key: 'dashboard', label: 'events.tabs.dashboard', icon: LayoutDashboard },
  { key: 'faq', label: 'events.tabs.faq', icon: HelpCircle },
];

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const [eventsOpen, setEventsOpen] = useState(false);
  const [events, setEvents] = useState<EventObject[]>([]);

  const isEventsActive = location.pathname.startsWith('/events');
  const eventPathMatch = location.pathname.match(/^\/events\/([^/]+)/);
  const currentEventId = eventPathMatch ? eventPathMatch[1] : null;
  const urlSearchParams = new URLSearchParams(location.search);
  const currentTab = urlSearchParams.get('tab') || 'introduction';
  const isIdeaDetail = location.pathname.includes('/ideas/');
  const effectiveTab = isIdeaDetail ? 'ideas' : currentTab;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await eventsApi.list({ limit: 50 });
        setEvents(result.items);
      } catch {
        // silent
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (isEventsActive && !eventsOpen) {
      setEventsOpen(true);
    }
  }, [isEventsActive]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'bg-card border-r border-border shadow-clay-sm',
          'transform transition-all duration-300 ease-in-out',
          'lg:transform-none',
          'flex flex-col',
          sidebarCollapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header — hidden when collapsed on desktop */}
        <div className={cn(
          'items-center justify-between h-16 px-4 border-b border-border lg:hidden flex-shrink-0',
          sidebarCollapsed ? 'hidden lg:hidden' : 'flex'
        )}>
          <span className="text-feature-title font-semibold text-foreground">{t('common.menu')}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-secondary rounded-standard transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Collapse toggle button (desktop only) */}
        <div className={cn(
          'hidden lg:flex items-center px-3 h-14 border-b border-border flex-shrink-0',
          sidebarCollapsed ? 'justify-center' : 'justify-end'
        )}>
          <button
            onClick={toggleSidebarCollapse}
            className={cn(
              'p-2 rounded-full transition-all duration-200',
              'hover:bg-secondary text-muted-foreground hover:text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/30'
            )}
            title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className={cn(
          'flex-1 py-2 overflow-y-auto',
          sidebarCollapsed ? 'px-1' : 'p-4 space-y-1'
        )}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            if (sidebarCollapsed) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center justify-center w-full p-3 rounded-standard transition-all duration-150 group relative',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                  title={t(item.label)}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-standard text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {t(item.label)}
              </NavLink>
            );
          })}

          {/* Events Nav Item */}
          {sidebarCollapsed ? (
            <NavLink
              to="/events"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center justify-center w-full p-3 rounded-standard transition-all duration-150',
                isEventsActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title={t('nav.events')}
            >
              <Trophy className={cn('h-5 w-5', isEventsActive ? 'text-primary' : 'text-muted-foreground')} />
            </NavLink>
          ) : (
            <div>
              <div className="flex items-center">
                <NavLink
                  to="/events"
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-4 py-3 rounded-l-standard text-sm font-medium transition-all duration-150',
                    isEventsActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Trophy className={cn('h-5 w-5', isEventsActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span>{t('nav.events')}</span>
                </NavLink>
                <button
                  onClick={() => setEventsOpen(!eventsOpen)}
                  className={cn(
                    'flex items-center px-2 rounded-r-standard transition-colors min-h-[44px]',
                    isEventsActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  {eventsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>

              {eventsOpen && events.length > 0 && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {events.map((event) => {
                    const isCurrentEvent = currentEventId === event.id;
                    return (
                      <div key={event.id}>
                        <NavLink
                          to={`/events/${event.id}`}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-standard text-sm transition-all duration-150',
                            isCurrentEvent
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          )}
                        >
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusDot[event.status] || 'bg-gray-300')} />
                          <span className="truncate">{event.title}</span>
                        </NavLink>

                        {isCurrentEvent && (
                          <div className="ml-4 mt-0.5 space-y-0.5">
                            {tabItems.map((tab) => {
                              const TabIcon = tab.icon;
                              const isTabActive = effectiveTab === tab.key;
                              return (
                                <NavLink
                                  key={tab.key}
                                  to={`/events/${event.id}?tab=${tab.key}`}
                                  onClick={() => setSidebarOpen(false)}
                                  className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-standard text-xs transition-all duration-150',
                                    isTabActive
                                      ? 'text-primary font-medium bg-primary/10'
                                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                  )}
                                >
                                  <TabIcon className="h-3.5 w-3.5" />
                                  <span>{t(tab.label)}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Admin section */}
          {isAdmin && (
            <div className={cn('pt-4 mt-4 border-t border-border', sidebarCollapsed ? 'space-y-0' : 'space-y-1')}>
              {!sidebarCollapsed && (
                <p className="px-4 text-label-uppercase font-semibold text-muted-foreground uppercase mb-2">
                  {t('nav.admin')}
                </p>
              )}
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

                if (sidebarCollapsed) {
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center justify-center w-full p-3 rounded-standard transition-all duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                      title={t(item.label)}
                    >
                      <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                    </NavLink>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-standard text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                    {t(item.label)}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        {/* User info at bottom */}
        <div
          className={cn(
            'flex-shrink-0 border-t border-border bg-card flex items-center cursor-pointer hover:bg-secondary transition-colors',
            sidebarCollapsed ? 'h-14 justify-center px-0' : 'h-14 px-4'
          )}
          onClick={() => {
            navigate('/settings');
            setSidebarOpen(false);
          }}
          title={sidebarCollapsed ? (user?.full_name || user?.username || 'User') : t('settings.title')}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">
                {user?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 ml-3">
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                {user?.full_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-tight">
                {user?.role === 'admin' ? t('common.administrator') : t('common.member')}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
