import React, { useEffect, useState } from 'react';
import {
  Lightbulb,
  MessageCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Rocket,
  Activity
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { DashboardStats, TopContributor } from '@/types';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  color: string;
}> = ({ title, value, icon: Icon, trend, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-success-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contributors, setContributors] = useState<TopContributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, contributorsData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getTopContributors(5),
        ]);
        setStats(statsData);
        setContributors(contributorsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Innovation Hub</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Ideas"
          value={stats?.total_ideas || 0}
          icon={Lightbulb}
          color="bg-primary-600"
          trend={stats?.new_this_week ? `+${stats.new_this_week} this week` : undefined}
        />
        <StatCard
          title="Total Problems"
          value={stats?.total_problems || 0}
          icon={AlertCircle}
          color="bg-warning-500"
        />
        <StatCard
          title="Active Rooms"
          value={stats?.total_rooms || 0}
          icon={MessageCircle}
          color="bg-success-500"
        />
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      {/* Interaction Rate */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Interaction Rate</p>
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
                <p className="text-sm text-gray-500">Resolved Problems</p>
                <p className="text-xl font-bold text-gray-900">{stats.resolved_problems || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">New This Week</p>
                <p className="text-xl font-bold text-gray-900">{stats.new_this_week || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Problems by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.problems_by_status && Object.entries(stats.problems_by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={status === 'open' ? 'warning' : status === 'solved' ? 'success' : 'default'}>
                      {status}
                    </Badge>
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
              ))}
              {!stats?.problems_by_status && (
                <p className="text-gray-500 text-sm text-center py-4">No data</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ideas by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.ideas_by_status && Object.entries(stats.ideas_by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      status === 'submitted' ? 'success' :
                      status === 'reviewing' ? 'warning' :
                      status === 'closed' ? 'danger' : 'default'
                    }>
                      {status}
                    </Badge>
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
              ))}
              {!stats?.ideas_by_status && (
                <p className="text-gray-500 text-sm text-center py-4">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      {contributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
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
                      {contributor.ideas_count} ideas
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {contributor.problems_count} problems
                    </span>
                    <span className="flex items-center gap-1">
                      <Rocket className="h-4 w-4" />
                      {contributor.votes_received} votes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
