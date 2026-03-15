import React, { useEffect, useState } from 'react';
import { 
  Lightbulb, 
  MessageCircle, 
  Rocket, 
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DashboardStats } from '@/types';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
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
          trend="+12% this month"
        />
        <StatCard
          title="Problems Open"
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
                          width: `${stats.total_problems > 0 ? (count / stats.total_problems) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
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
                      status === 'selected' ? 'success' : 
                      status === 'ready' ? 'warning' : 
                      status === 'rejected' ? 'danger' : 'default'
                    }>
                      {status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 flex-1 ml-4">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full"
                        style={{
                          width: `${stats.total_ideas > 0 ? (count / stats.total_ideas) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200">
            {stats?.top_contributors?.map((contributor, index) => (
              <div key={contributor.user.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {contributor.user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{contributor.user.full_name}</p>
                    <p className="text-xs text-gray-500">{contributor.user.team}</p>
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
    </div>
  );
};
