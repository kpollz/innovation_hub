import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trophy, Users, BarChart3, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { eventsApi } from '@/api/events';
import { Avatar } from '@/components/ui/Avatar';
import type { EventObject, EventDashboardIdea, EventDashboardTeam } from '@/types';

interface DashboardTabProps {
  event: EventObject;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ event }) => {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<EventDashboardIdea[]>([]);
  const [teams, setTeams] = useState<EventDashboardTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ideasRes, teamsRes] = await Promise.all([
        eventsApi.getDashboardIdeas(event.id, teamFilter || undefined),
        eventsApi.getDashboardTeams(event.id),
      ]);
      setIdeas(ideasRes.items);
      setTeams(teamsRes.items);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [event.id, teamFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {[1, 2].map(s => (
          <div key={s}>
            <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Ideas Ranking */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-feature-title font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('events.dashboard.ideas_title')}
          </h2>
          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('events.dashboard.all_teams')}</option>
                {teams.map(dt => (
                  <option key={dt.team.id} value={dt.team.id}>{dt.team.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {ideas.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-muted-foreground">{t('events.dashboard.no_ideas')}</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('events.dashboard.col_title')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('events.dashboard.col_team')}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('events.dashboard.col_score')}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('events.dashboard.col_scores')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea, idx) => {
                  const isExpanded = expandedIdeaId === idea.id;
                  const hasScore = idea.total_score !== null;
                  return (
                    <React.Fragment key={idea.id}>
                      <tr
                        className={`border-b border-border/50 hover:bg-secondary cursor-pointer ${!hasScore ? 'opacity-60' : ''}`}
                        onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                      >
                        <td className="px-4 py-3 font-medium text-muted-foreground">
                          {hasScore ? idx + 1 : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                          {idea.title}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {idea.team?.name || '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${hasScore ? 'text-primary-700' : 'text-muted-foreground'}`}>
                          {hasScore ? idea.total_score!.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {idea.score_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {idea.criteria_breakdown && Object.keys(idea.criteria_breakdown).length > 0 && (
                            isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground mx-auto" /> : <ChevronDown className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && idea.criteria_breakdown && Object.keys(idea.criteria_breakdown).length > 0 && (
                        <tr className="bg-secondary">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {Object.entries(idea.criteria_breakdown).map(([name, score]) => (
                                <div key={name} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-border/50">
                                  <span className="text-xs text-muted-foreground truncate">{name}</span>
                                  <span className="text-xs font-semibold text-foreground ml-2">{(score as number).toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Teams Ranking */}
      <div>
        <h2 className="text-feature-title font-semibold text-foreground flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-500" />
          {t('events.dashboard.teams_title')}
        </h2>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-muted-foreground">{t('events.dashboard.no_teams')}</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('events.dashboard.col_team_info')}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('events.dashboard.col_ideas')}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('events.dashboard.col_avg')}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('events.dashboard.col_total')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('events.dashboard.col_members')}</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((dt, idx) => (
                  <tr key={dt.team.id} className="border-b border-border/50 hover:bg-secondary">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-foreground">{dt.team.name}</span>
                        {dt.team.slogan && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{dt.team.slogan}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{dt.idea_count}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {dt.avg_score !== null ? dt.avg_score.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary-700">
                      {dt.total_score > 0 ? dt.total_score.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {dt.members.slice(0, 5).map(m => (
                          <Avatar key={m.id} src={m.avatar_url} name={m.full_name || m.username} size="sm" />
                        ))}
                        {dt.members.length > 5 && (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                            +{dt.members.length - 5}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
