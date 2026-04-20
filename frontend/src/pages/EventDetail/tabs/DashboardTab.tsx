import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trophy, Users, BarChart3, ChevronDown, ChevronUp, Filter, Settings, Medal
} from 'lucide-react';
import { eventsApi } from '@/api/events';
import { Avatar } from '@/components/ui/Avatar';
import { AwardPodium } from './AwardPodium';
import { AwardManager } from './AwardManager';
import type { EventObject, EventDashboardIdea, EventDashboardTeam, EventAward } from '@/types';

interface DashboardTabProps {
  event: EventObject;
  isAdmin?: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ event, isAdmin }) => {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<EventDashboardIdea[]>([]);
  const [teams, setTeams] = useState<EventDashboardTeam[]>([]);
  const [awards, setAwards] = useState<EventAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [showAwardManager, setShowAwardManager] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [awardsRes, ideasRes, teamsRes] = await Promise.all([
        eventsApi.getAwards(event.id),
        eventsApi.getDashboardIdeas(event.id, teamFilter || undefined),
        eventsApi.getDashboardTeams(event.id),
      ]);
      setAwards(awardsRes.items);
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
      {/* Awards Podium */}
      {(awards.length > 0 || isAdmin) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-feature-title font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t('events.dashboard.awards_title')}
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowAwardManager(true)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary px-3 py-1.5 rounded-standard transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t('events.dashboard.manage_awards')}
              </button>
            )}
          </div>
          {awards.length > 0 ? (
            <div className="bg-white border border-border rounded-lg py-4">
              <AwardPodium awards={awards} />
            </div>
          ) : (
            <div className="text-center py-8 bg-secondary/50 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground text-sm">{t('events.dashboard.no_awards_desc')}</p>
            </div>
          )}
        </div>
      )}

      {/* Ideas Ranking */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-feature-title font-semibold text-foreground flex items-center gap-2">
            <Medal className="h-5 w-5 text-yellow-500" />
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
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[27%]" />
                <col className="w-[22%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('events.dashboard.col_title')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('events.dashboard.col_team')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('events.dashboard.col_score')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('events.dashboard.col_scores')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground"></th>
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
                        <td className="px-4 py-3 font-medium text-foreground truncate" title={idea.title}>
                          {idea.title}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate">
                          {idea.team?.name || '—'}
                        </td>
                        <td className={`px-4 py-3 text-center font-semibold ${hasScore ? 'text-primary-700' : 'text-muted-foreground'}`}>
                          {hasScore ? idea.total_score!.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
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
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[19%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('events.dashboard.col_team_info')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('events.dashboard.col_ideas')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('events.dashboard.col_avg')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('events.dashboard.col_total')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('events.dashboard.col_members')}</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((dt, idx) => (
                  <tr key={dt.team.id} className="border-b border-border/50 hover:bg-secondary">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="truncate">
                        <span className="font-medium text-foreground">{dt.team.name}</span>
                        {dt.team.slogan && (
                          <p className="text-xs text-muted-foreground truncate">{dt.team.slogan}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">{dt.idea_count}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {dt.avg_score !== null ? dt.avg_score.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-primary-700">
                      {dt.total_score > 0 ? dt.total_score.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-2 justify-center">
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

      {/* Award Manager Modal */}
      {showAwardManager && (
        <AwardManager
          event={event}
          teams={teams}
          onClose={() => setShowAwardManager(false)}
          onChanged={fetchData}
        />
      )}
    </div>
  );
};
