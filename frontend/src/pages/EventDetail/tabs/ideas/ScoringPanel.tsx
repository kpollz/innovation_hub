import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Loader2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { eventsApi } from '@/api/events';
import { Button } from '@/components/ui/Button';
import type {
  EventObject, EventIdeaObject, EventScoringCriteriaObject,
  ScoreListResponse,
} from '@/types';

const LIKERT_OPTIONS = [
  { value: 12.5, label: 'strongly_agree' },
  { value: 10, label: 'agree' },
  { value: 7.5, label: 'neutral' },
  { value: 5, label: 'disagree' },
  { value: 2.5, label: 'strongly_disagree' },
] as const;

const CRITERIA_I18N_KEY: Record<string, string> = {
  'Unresolved Problem': 'unresolved_problem',
  'Root Cause Analysis': 'root_cause_analysis',
  'Problem Recognition': 'problem_recognition',
  'Gap Evidence': 'gap_evidence',
  'Novelty': 'novelty',
  'Root Cause Resolution': 'root_cause_resolution',
  'Competitive Advantage': 'competitive_advantage',
  'Technical Feasibility': 'technical_feasibility',
};

const ck = (name: string, field: 'name' | 'desc'): string => {
  const key = CRITERIA_I18N_KEY[name];
  return key ? `events.ideas.scoring.criteria.${key}.${field}` : '';
};

interface ScoringPanelProps {
  event: EventObject;
  idea: EventIdeaObject;
  readOnly?: boolean;
  onScoreUpdated?: () => void;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({ event, idea, readOnly = false, onScoreUpdated }) => {
  const { t } = useTranslation();
  const [criteria, setCriteria] = useState<EventScoringCriteriaObject[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [existingScoreId, setExistingScoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalPreview, setTotalPreview] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [scoreSummary, setScoreSummary] = useState<ScoreListResponse['summary'] | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [criteriaData, scoresData] = await Promise.all([
        eventsApi.getCriteria(event.id),
        eventsApi.getScores(event.id, idea.id),
      ]);
      setCriteria(criteriaData);

      const initScores: Record<string, number> = {};
      criteriaData.forEach(c => { initScores[c.id] = 0; });

      if (scoresData.scores.length > 0) {
        if (readOnly) {
          Object.entries(scoresData.summary.criteria_avg).forEach(([k, v]) => {
            initScores[k] = v;
          });
        } else {
          const userTeamScore = scoresData.scores[0];
          if (userTeamScore) {
            setExistingScoreId(userTeamScore.id);
            Object.entries(userTeamScore.criteria_scores).forEach(([k, v]) => {
              initScores[k] = v;
            });
          }
        }
      }

      setScores(initScores);
      setScoreSummary(scoresData.summary);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [event.id, idea.id, idea.team_id, readOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const filled = Object.values(scores).filter(v => v > 0);
    if (filled.length === criteria.length && criteria.length > 0) {
      const total = criteria.reduce((sum, c) => sum + (scores[c.id] || 0) * c.weight, 0);
      setTotalPreview(total);
    } else {
      setTotalPreview(null);
    }
  }, [scores, criteria]);

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: value }));
  };

  const handleSubmit = async () => {
    const filledScores: Record<string, number> = {};
    Object.entries(scores).forEach(([k, v]) => {
      if (v > 0) filledScores[k] = v;
    });
    if (Object.keys(filledScores).length < criteria.length) return;

    setSubmitting(true);
    try {
      if (existingScoreId) {
        await eventsApi.updateScore(event.id, idea.id, { criteria_scores: filledScores });
      } else {
        await eventsApi.submitScore(event.id, idea.id, { criteria_scores: filledScores });
      }
      onScoreUpdated?.();
      fetchData();
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getLikertLabel = (value: number): string => {
    const opt = LIKERT_OPTIONS.find(o => o.value === value);
    return opt ? t(`events.ideas.scoring.${opt.label}`) : '';
  };

  const getCriteriaName = (c: EventScoringCriteriaObject): string => {
    const key = ck(c.name, 'name');
    return key ? t(key) : c.name;
  };

  const getCriteriaDesc = (c: EventScoringCriteriaObject): string => {
    const key = ck(c.name, 'desc');
    return key ? t(key) : (c.description || '');
  };

  const isComplete = Object.values(scores).filter(v => v > 0).length === criteria.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
      </div>
    );
  }

  if (criteria.length === 0) return null;

  const problemCriteria = criteria.filter(c => c.group === 'problem');
  const solutionCriteria = criteria.filter(c => c.group === 'solution');
  const totalScore = readOnly ? (idea.total_score ?? null) : totalPreview;

  const renderGroup = (groupCriteria: EventScoringCriteriaObject[], groupKey: string, groupLabel: string) => {
    if (groupCriteria.length === 0) return null;
    const isExpanded = expandedGroups[groupKey] === true;
    const groupTotal = groupCriteria.reduce((sum, c) => sum + (scores[c.id] || 0) * c.weight, 0);

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleGroup(groupKey)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded
              ? <ChevronDown className="h-4 w-4 text-gray-500" />
              : <ChevronRight className="h-4 w-4 text-gray-500" />
            }
            <h4 className="text-sm font-semibold text-gray-700">{groupLabel}</h4>
            <span className="text-xs text-gray-400">({groupCriteria.length})</span>
          </div>
          <span className="text-sm font-bold text-gray-600">{groupTotal.toFixed(1)}</span>
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4">
            {groupCriteria.map(criterion => {
              const currentScore = scores[criterion.id] || 0;
              return (
                <div key={criterion.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{getCriteriaName(criterion)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{getCriteriaDesc(criterion)}</p>
                    </div>
                    {currentScore > 0 && (
                      <span className="text-sm font-semibold text-primary-600 flex-shrink-0 whitespace-nowrap">
                        {currentScore} <span className="font-normal text-gray-400">({getLikertLabel(currentScore)})</span>
                      </span>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="flex gap-1 mt-2">
                      {LIKERT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleScoreChange(criterion.id, opt.value)}
                          className={`flex-1 py-1.5 px-1 text-xs rounded-md border transition-colors font-medium ${
                            scores[criterion.id] === opt.value
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                          title={t(`events.ideas.scoring.${opt.label}`)}
                        >
                          <span className="block font-bold">{opt.value}</span>
                          <span className="block text-[10px] opacity-80 mt-0.5">
                            {t(`events.ideas.scoring.${opt.label}_short`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {t('events.ideas.scoring.title')}
        </h3>
        {totalScore !== null && (
          <span className="text-lg font-bold text-primary-600">
            {totalScore.toFixed(1)} {t('events.ideas.scoring.points')}
          </span>
        )}
      </div>

      {scoreSummary && idea.total_score !== null && !readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            {t('events.ideas.scoring.current_avg', { avg: scoreSummary.total_avg.toFixed(1) })}
            {' · '}
            {t('events.ideas.scoring.score_count_label', { count: idea.score_count })}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {renderGroup(problemCriteria, 'problem', t('events.ideas.scoring.group_problem'))}
        {renderGroup(solutionCriteria, 'solution', t('events.ideas.scoring.group_solution'))}
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-400">
            {isComplete
              ? t('events.ideas.scoring.ready_submit')
              : t('events.ideas.scoring.fill_all', {
                  remaining: criteria.length - Object.values(scores).filter(v => v > 0).length,
                })
            }
          </p>
          <Button
            size="sm"
            leftIcon={<Save className="h-4 w-4" />}
            isLoading={submitting}
            disabled={!isComplete || submitting}
            onClick={handleSubmit}
          >
            {existingScoreId ? t('events.ideas.scoring.update') : t('events.ideas.scoring.submit')}
          </Button>
        </div>
      )}
    </div>
  );
};
