import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Loader2, Save } from 'lucide-react';
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

interface ScoringPanelProps {
  event: EventObject;
  idea: EventIdeaObject;
  onScoreUpdated: () => void;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({ event, idea, onScoreUpdated }) => {
  const { t } = useTranslation();
  const [criteria, setCriteria] = useState<EventScoringCriteriaObject[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [existingScoreId, setExistingScoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalPreview, setTotalPreview] = useState<number | null>(null);

  // Score summary
  const [scoreSummary, setScoreSummary] = useState<ScoreListResponse['summary'] | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [criteriaData, scoresData] = await Promise.all([
        eventsApi.getCriteria(event.id),
        eventsApi.getScores(event.id, idea.id),
      ]);
      setCriteria(criteriaData);

      // Check if current user's team already scored
      // The backend enforces uniqueness (event_idea_id, scorer_team_id)
      // The can_score flag on the idea already confirms the user can score

      // Initialize scores from existing if found
      const initScores: Record<string, number> = {};
      criteriaData.forEach(c => { initScores[c.id] = 0; });

      if (scoresData.scores.length > 0) {
        // Find the score from the user's team (not the idea owner's team)
        const userTeamScore = scoresData.scores[0]; // There should be only one score per team
        if (userTeamScore) {
          setExistingScoreId(userTeamScore.id);
          Object.entries(userTeamScore.criteria_scores).forEach(([k, v]) => {
            initScores[k] = v;
          });
        }
      }

      setScores(initScores);
      setScoreSummary(scoresData.summary);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [event.id, idea.id, idea.team_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Calculate preview total
  useEffect(() => {
    const filled = Object.values(scores).filter(v => v > 0);
    if (filled.length === criteria.length && criteria.length > 0) {
      const total = criteria.reduce((sum, c) => {
        return sum + (scores[c.id] || 0) * c.weight;
      }, 0);
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
      onScoreUpdated();
      fetchData();
    } catch { /* error handled silently */ }
    finally { setSubmitting(false); }
  };

  const isComplete = Object.values(scores).filter(v => v > 0).length === criteria.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
      </div>
    );
  }

  const problemCriteria = criteria.filter(c => c.group === 'problem');
  const solutionCriteria = criteria.filter(c => c.group === 'solution');

  const renderGroup = (groupCriteria: EventScoringCriteriaObject[], groupLabel: string) => (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">{groupLabel}</h4>
      <div className="space-y-4">
        {groupCriteria.map(criterion => (
          <div key={criterion.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{criterion.name}</p>
                {criterion.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{criterion.description}</p>
                )}
              </div>
              {scores[criterion.id] > 0 && (
                <span className="text-sm font-bold text-primary-600 flex-shrink-0">
                  {scores[criterion.id]}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {LIKERT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleScoreChange(criterion.id, opt.value)}
                  className={`flex-1 py-1.5 text-xs rounded-md border transition-colors font-medium ${
                    scores[criterion.id] === opt.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                  title={t(`events.ideas.scoring.${opt.label}`)}
                >
                  {opt.value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {t('events.ideas.scoring.title')}
        </h3>
        {totalPreview !== null && (
          <span className="text-lg font-bold text-primary-600">
            {totalPreview.toFixed(1)} {t('events.ideas.scoring.points')}
          </span>
        )}
      </div>

      {/* Score summary from other teams */}
      {scoreSummary && idea.total_score !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            {t('events.ideas.scoring.current_avg', { avg: scoreSummary.total_avg.toFixed(1) })}
            {' · '}
            {t('events.ideas.scoring.score_count_label', { count: idea.score_count })}
          </p>
        </div>
      )}

      {renderGroup(problemCriteria, t('events.ideas.scoring.group_problem'))}
      <div className="mt-6">
        {renderGroup(solutionCriteria, t('events.ideas.scoring.group_solution'))}
      </div>

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
    </div>
  );
};
