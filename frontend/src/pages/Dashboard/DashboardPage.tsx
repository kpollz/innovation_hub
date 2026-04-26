import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lightbulb,
  AlertCircle,
  Rocket,
  Activity,
  Trophy,
  BarChart3,
  X,
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { eventsApi } from '@/api/events';
import type { DateRangeParams } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DatePicker } from '@/components/ui/DatePicker';
import { ActivityOverTimeChart } from './components/ActivityOverTimeChart';
import { CategoryDonutChart } from './components/CategoryDonutChart';
import { PROBLEM_STATUSES, IDEA_STATUSES } from '@/utils/constants';
import type { DashboardStats, DailyActivity } from '@/types';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  change?: string;
  hint?: string;
}> = ({ title, value, icon: Icon, color, change, hint }) => (
  <div title={hint}>
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {change !== undefined && (
            <span
              title={hint}
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                change === '—' ? 'bg-secondary text-muted-foreground' :
                change.startsWith('+') ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}
            >
              {change}
            </span>
          )}
        </div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  </div>
);

function computeChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '—';
  const pct = ((current - previous) / previous * 100).toFixed(0);
  return pct.startsWith('-') ? `${pct}%` : `+${pct}%`;
}

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [prevStats, setPrevStats] = useState<DashboardStats | null>(null);
  const [activityOverTime, setActivityOverTime] = useState<DailyActivity[]>([]);
  const [problemsByCategory, setProblemsByCategory] = useState<Record<string, number>>({});
  const [activeEvents, setActiveEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const range: DateRangeParams = {};
      if (dateFrom) range.date_from = dateFrom;
      if (dateTo) range.date_to = dateTo;

      let prevRange: DateRangeParams = {};
      if (range.date_from && range.date_to) {
        const start = new Date(range.date_from);
        const end = new Date(range.date_to);
        const diff = end.getTime() - start.getTime();
        prevRange = {
          date_from: new Date(start.getTime() - diff - 86400000).toISOString().split('T')[0],
          date_to: new Date(start.getTime() - 86400000).toISOString().split('T')[0],
        };
      } else {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 86400000);
        const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000);
        prevRange = {
          date_from: twoWeeksAgo.toISOString().split('T')[0],
          date_to: new Date(weekAgo.getTime() - 86400000).toISOString().split('T')[0],
        };
      }

      const [
        statsData,
        prevStatsData,
        activityData,
        categoryData,
        eventsRes,
      ] = await Promise.all([
        dashboardApi.getStats(Object.keys(range).length ? range : undefined),
        dashboardApi.getStats(prevRange),
        dashboardApi.getActivityOverTime(Object.keys(range).length ? range : undefined),
        dashboardApi.getProblemsByCategory(Object.keys(range).length ? range : undefined),
        eventsApi.list({ status: 'active', limit: 1 }),
      ]);

      setStats(statsData);
      setPrevStats(prevStatsData);
      setActivityOverTime(activityData);
      setProblemsByCategory(categoryData);
      setActiveEvents(eventsRes.total);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearDates = () => {
    setDateFrom('');
    setDateTo('');
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-section-heading font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary-600" />
            {t('dashboard.analytics_title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            max={dateTo || undefined}
            placeholder={t('dashboard.date_from')}
            className="w-[160px]"
          />
          <span className="text-muted-foreground">→</span>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            min={dateFrom || undefined}
            placeholder={t('dashboard.date_to')}
            className="w-[160px]"
            align="right"
          />
          {hasDateFilter && (
            <button
              onClick={handleClearDates}
              className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
              title={t('dashboard.clear_filter')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.total_problems')}
          value={stats?.total_problems || 0}
          icon={AlertCircle}
          color="bg-blue-600"
          change={prevStats ? computeChange(stats?.total_problems || 0, prevStats.total_problems) : '—'}
          hint={t('dashboard.hint_total_problems')}
        />
        <StatCard
          title={t('dashboard.active_brainstorms')}
          value={stats?.total_rooms || 0}
          icon={Lightbulb}
          color="bg-amber-500"
          change={prevStats ? computeChange(stats?.total_rooms || 0, prevStats.total_rooms) : '—'}
          hint={t('dashboard.hint_active_brainstorms')}
        />
        <StatCard
          title={t('dashboard.total_ideas')}
          value={stats?.total_ideas || 0}
          icon={Rocket}
          color="bg-green-600"
          change={prevStats ? computeChange(stats?.total_ideas || 0, prevStats.total_ideas) : '—'}
          hint={t('dashboard.hint_total_ideas')}
        />
        <StatCard
          title={t('dashboard.active_events')}
          value={activeEvents}
          icon={Trophy}
          color="bg-cyan-600"
          change="—"
          hint={t('dashboard.hint_active_events')}
        />
      </div>

      {/* Interaction Rate + Resolved */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div title={t('dashboard.hint_interaction_rate')}>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.interaction_rate')}</p>
                  <p className="text-feature-title font-bold text-foreground">
                    {stats.interaction_rate?.toFixed(1) || 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div title={t('dashboard.hint_resolved')}>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Rocket className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.resolved_problems')}</p>
                  <p className="text-feature-title font-bold text-foreground">{stats.resolved_problems || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityOverTimeChart data={activityOverTime} />
        <CategoryDonutChart data={problemsByCategory} />
      </div>

      {/* Status Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.problems_by_status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.problems_by_status && Object.entries(stats.problems_by_status).map(([status, count]) => {
                const statusCfg = PROBLEM_STATUSES.find(s => s.value === status);
                return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusCfg ? (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                    ) : (
                      <Badge>{status}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-1 ml-4">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{
                          width: `${stats.total_problems > 0 ? ((count as number) / stats.total_problems) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-8">{count as number}</span>
                  </div>
                </div>
                );
              })}
              {!stats?.problems_by_status && (
                <p className="text-muted-foreground text-sm text-center py-4">{t('common.no_data')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.ideas_by_status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.ideas_by_status && Object.entries(stats.ideas_by_status).map(([status, count]) => {
                const statusCfg = IDEA_STATUSES.find(s => s.value === status);
                return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusCfg ? (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                    ) : (
                      <Badge>{status}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-1 ml-4">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full"
                        style={{
                          width: `${stats.total_ideas > 0 ? ((count as number) / stats.total_ideas) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-8">{count as number}</span>
                  </div>
                </div>
                );
              })}
              {!stats?.ideas_by_status && (
                <p className="text-muted-foreground text-sm text-center py-4">{t('common.no_data')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  );
};
