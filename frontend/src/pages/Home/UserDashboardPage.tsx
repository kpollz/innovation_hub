import React, { useEffect, useState, useCallback } from 'react';
import { dashboardApi } from '@/api/dashboard';
import { eventsApi } from '@/api/events';
import { useAuthStore } from '@/stores/authStore';
import { HeroGreeting } from './sections/HeroGreeting';
import { RecentProblems } from './sections/RecentProblems';
import { TrendingIdeas } from './sections/TrendingIdeas';
import { UpcomingDeadlines } from './sections/UpcomingDeadlines';
import { QuickActions } from './sections/QuickActions';
import { TopContributors } from './sections/TopContributors';
import { RecentActivityFeed } from '@/pages/Dashboard/components/RecentActivityFeed';
import type { DashboardStats, Problem, Idea, EventObject, TopContributor, ActivityItem } from '@/types';

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [activeEvents, setActiveEvents] = useState<EventObject[]>([]);
  const [contributors, setContributors] = useState<TopContributor[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, problems, ideas, eventsRes, contributorsData, activityData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentProblems(5),
        dashboardApi.getRecentIdeas(5),
        eventsApi.list({ status: 'active', limit: 10 }),
        dashboardApi.getTopContributors(10),
        dashboardApi.getRecentActivity(10),
      ]);
      setStats(statsData);
      setRecentProblems(problems);
      setRecentIdeas(ideas);
      setActiveEvents(eventsRes.items);
      setContributors(contributorsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <HeroGreeting
        user={user}
        openProblems={stats?.problems_by_status?.['open'] || 0}
        activeRooms={stats?.total_rooms || 0}
        liveEvents={activeEvents.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentProblems problems={recentProblems} />
          <RecentActivityFeed items={recentActivity} />
        </div>

        <div className="space-y-6">
          <UpcomingDeadlines events={activeEvents} />
          <TrendingIdeas ideas={recentIdeas} />
          <QuickActions />
        </div>
      </div>

      <TopContributors contributors={contributors} />
    </div>
  );
};
