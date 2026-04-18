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
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
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
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('events.dashboard.ideas_title')}
          </h2>
          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
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
            <p className="text-gray-500">{t('events.dashboard.no_ideas')}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('events.dashboard.col_title')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('events.dashboard.col_team')}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">{t('events.dashboard.col_score')}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">{t('events.dashboard.col_scores')}</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea, idx) => {
                  const isExpanded = expandedIdeaId === idea.id;
                  const hasScore = idea.total_score !== null;
                  return (
                    <React.Fragment key={idea.id}>
                      <tr
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!hasScore ? 'opacity-60' : ''}`}
                        onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-500">
                          {hasScore ? idx + 1 : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                          {idea.title}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {idea.team?.name || '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${hasScore ? 'text-primary-700' : 'text-gray-400'}`}>
                          {hasScore ? idea.total_score!.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {idea.score_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {idea.criteria_breakdown && Object.keys(idea.criteria_breakdown).length > 0 && (
                            isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 mx-auto" /> : <ChevronDown className="h-4 w-4 text-gray-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && idea.criteria_breakdown && Object.keys(idea.criteria_breakdown).length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {Object.entries(idea.criteria_breakdown).map(([name, score]) => (
                                <div key={name} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-gray-100">
                                  <span className="text-xs text-gray-600 truncate">{name}</span>
                                  <span className="text-xs font-semibold text-gray-900 ml-2">{(score as number).toFixed(1)}</span>
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
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-500" />
          {t('events.dashboard.teams_title')}
        </h2>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">{t('events.dashboard.no_teams')}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('events.dashboard.col_team_info')}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">{t('events.dashboard.col_ideas')}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">{t('events.dashboard.col_avg')}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">{t('events.dashboard.col_total')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('events.dashboard.col_members')}</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((dt, idx) => (
                  <tr key={dt.team.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900">{dt.team.name}</span>
                        {dt.team.slogan && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{dt.team.slogan}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{dt.idea_count}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
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
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
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
