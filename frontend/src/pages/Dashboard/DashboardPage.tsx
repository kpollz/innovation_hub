import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lightbulb,
  MessageCircle,
  AlertCircle,
  Rocket,
  Activity,
  X
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import type { DateRangeParams } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PROBLEM_STATUSES, IDEA_STATUSES } from '@/utils/constants';
import { DatePicker } from '@/components/ui/DatePicker';
import type { DashboardStats, TopContributor } from '@/types';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contributors, setContributors] = useState<TopContributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const range: DateRangeParams = {};
      if (dateFrom) range.date_from = dateFrom;
      if (dateTo) range.date_to = dateTo;

      const [statsData, contributorsData] = await Promise.all([
        dashboardApi.getStats(Object.keys(range).length ? range : undefined),
        dashboardApi.getTopContributors(5, Object.keys(range).length ? range : undefined),
      ]);
      setStats(statsData);
      setContributors(contributorsData);
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
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            max={dateTo || undefined}
            placeholder={t('dashboard.date_from')}
            className="w-[180px]"
          />
          <span className="text-gray-400">→</span>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            min={dateFrom || undefined}
            placeholder={t('dashboard.date_to')}
            className="w-[180px]"
            align="right"
          />
          {hasDateFilter && (
            <button
              onClick={handleClearDates}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title={t('dashboard.total_ideas')}
          value={stats?.total_ideas || 0}
          icon={Lightbulb}
          color="bg-primary-600"
        />
        <StatCard
          title={t('dashboard.total_problems')}
          value={stats?.total_problems || 0}
          icon={AlertCircle}
          color="bg-warning-500"
        />
        <StatCard
          title={t('dashboard.active_rooms')}
          value={stats?.total_rooms || 0}
          icon={MessageCircle}
          color="bg-success-500"
        />
      </div>

      {/* Interaction Rate + Resolved */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.interaction_rate')}</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.interaction_rate?.toFixed(1) || 0}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Rocket className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.resolved_problems')}</p>
                <p className="text-xl font-bold text-gray-900">{stats.resolved_problems || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
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
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{
                          width: `${stats.total_problems > 0 ? ((count as number) / stats.total_problems) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count as number}</span>
                  </div>
                </div>
                );
              })}
              {!stats?.problems_by_status && (
                <p className="text-gray-500 text-sm text-center py-4">{t('common.no_data')}</p>
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
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full"
                        style={{
                          width: `${stats.total_ideas > 0 ? ((count as number) / stats.total_ideas) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count as number}</span>
                  </div>
                </div>
                );
              })}
              {!stats?.ideas_by_status && (
                <p className="text-gray-500 text-sm text-center py-4">{t('common.no_data')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      {contributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.top_contributors')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {contributors.map((contributor, index) => (
                <div key={contributor.user.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <Avatar src={contributor.user.avatar_url} name={contributor.user.full_name || contributor.user.username} size="lg" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {contributor.user.full_name || contributor.user.username}
                      </p>
                      <p className="text-xs text-gray-500">{contributor.user.team || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      {contributor.ideas_count} {t('dashboard.ideas')}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {contributor.problems_count} {t('dashboard.problems')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Rocket className="h-4 w-4" />
                      {contributor.votes_received} {t('dashboard.votes')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </>
      )}
    </div>
  );
};
