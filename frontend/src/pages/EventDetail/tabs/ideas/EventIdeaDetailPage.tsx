import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Edit2, Star, Trophy, Link as LinkIcon, Trash2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { eventsApi } from '@/api/events';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { TipTapRenderer } from '@/components/ui/TipTapRenderer';
import { ScoringPanel } from './ScoringPanel';
import { IdeaFormModal } from './IdeaFormModal';
import { formatDate } from '@/utils/helpers';
import type { EventObject, EventIdeaObject, EventTeamObject } from '@/types';

interface EventIdeaDetailPageProps {
  event: EventObject;
  myTeam: EventTeamObject | null;
}

export const EventIdeaDetailPage: React.FC<EventIdeaDetailPageProps> = ({ event, myTeam }) => {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [idea, setIdea] = useState<EventIdeaObject | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [showEditForm, setShowEditForm] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchIdea = useCallback(async () => {
    if (!ideaId) return;
    setLoading(true);
    try {
      const data = await eventsApi.getIdea(event.id, ideaId);
      setIdea(data);
    } catch {
      navigate(`/events/${event.id}?tab=ideas`, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [event.id, ideaId, navigate]);

  useEffect(() => { fetchIdea(); }, [fetchIdea]);

  const isActive = event.status === 'active';
  const canEdit = isActive && idea && (
    isAdmin ||
    idea.author_id === user?.id ||
    (myTeam?.leader_id === user?.id && idea.team_id === myTeam?.id)
  );
  const canDelete = isActive && idea && (
    isAdmin ||
    idea.author_id === user?.id ||
    (myTeam?.leader_id === user?.id && idea.team_id === myTeam?.id)
  );

  const handleDelete = async () => {
    if (!idea) return;
    setDeleting(true);
    try {
      await eventsApi.deleteIdea(event.id, idea.id);
      navigate(`/events/${event.id}?tab=ideas`, { replace: true });
    } catch { /* silent */ }
    finally { setDeleting(false); }
  };

  const renderField = (label: string, content: unknown) => {
    if (!content) return null;
    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">{label}</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <TipTapRenderer content={content as Parameters<typeof TipTapRenderer>[0]['content']} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="px-4 py-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="h-40 bg-gray-100 rounded-lg mb-4" />
        <div className="h-40 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (!idea) return null;

  return (
    <div className="px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(`/events/${event.id}?tab=ideas`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('events.ideas.back_to_list')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Avatar
                src={idea.author?.avatar_url}
                name={idea.author?.full_name || idea.author?.username}
                size="sm"
              />
              {idea.author?.full_name || idea.author?.username}
            </span>
            {idea.team && (
              <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-0.5 rounded-full">
                <Trophy className="h-3 w-3" />
                {idea.team.name}
                {idea.team.slogan && (
                  <span className="text-gray-400 italic ml-1">"{idea.team.slogan}"</span>
                )}
              </span>
            )}
            <span>{formatDate(idea.created_at)}</span>
            {idea.source_type === 'linked' && (
              <span className="flex items-center gap-1 text-blue-500">
                <LinkIcon className="h-3.5 w-3.5" />
                {t('events.ideas.linked')}
              </span>
            )}
            {idea.total_score !== null && (
              <span className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 rounded-full">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-yellow-700">{idea.total_score.toFixed(1)}</span>
                <span className="text-yellow-500">({idea.score_count})</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit2 className="h-4 w-4" />}
              onClick={() => setShowEditForm(true)}
            >
              {t('events.ideas.edit')}
            </Button>
          )}
          {canDelete && !showDeleteConfirm && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t('events.ideas.delete')}
            </Button>
          )}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">{t('events.ideas.delete_confirm')}</span>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleting}
                onClick={handleDelete}
              >
                {t('common.confirm')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Linked source info */}
      {idea.source_type === 'linked' && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 mb-6">
          {t('events.ideas.linked_source')}
        </div>
      )}

      {/* Content fields */}
      {renderField(t('events.ideas.fields.user_problem'), idea.user_problem)}
      {renderField(t('events.ideas.fields.user_scenarios'), idea.user_scenarios)}
      {renderField(t('events.ideas.fields.user_expectation'), idea.user_expectation)}
      {renderField(t('events.ideas.fields.research'), idea.research)}
      {renderField(t('events.ideas.fields.solution'), idea.solution)}

      {/* Scoring panel — only for authorized reviewers */}
      {idea.can_score && isActive && (
        <ScoringPanel
          event={event}
          idea={idea}
          onScoreUpdated={() => fetchIdea()}
        />
      )}

      {/* Score summary — collapsible, visible to everyone */}
      <ScoreSummary idea={idea} />

      {/* Edit Modal */}
      {showEditForm && idea && (
        <IdeaFormModal
          event={event}
          idea={idea}
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSaved={() => { setShowEditForm(false); fetchIdea(); }}
        />
      )}
    </div>
  );
};

/** Collapsible score summary — always visible, expand for detail. */
const ScoreSummary: React.FC<{ idea: EventIdeaObject }> = ({ idea }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [criteria, setCriteria] = useState<{ id: string; name: string; group: string }[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (expanded && idea.total_score !== null) {
      eventsApi.getCriteria(idea.event_id).then(c => setCriteria(c)).catch(() => {});
      eventsApi.getScores(idea.event_id, idea.id).then(res => {
        if (res.scores.length > 0) {
          setScores(res.scores[0].criteria_scores);
        }
      }).catch(() => {});
    }
  }, [expanded, idea]);

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between"
      >
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Star className="h-4 w-4 text-yellow-500" />
          {t('events.ideas.scoring.title')}
        </h4>
        <div className="flex items-center gap-2">
          {idea.total_score !== null ? (
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold text-yellow-700">{idea.total_score.toFixed(1)}</span>
              <span className="text-xs text-yellow-500">({idea.score_count})</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">{t('events.ideas.scoring.not_scored_yet')}</span>
          )}
          {expanded
            ? <ChevronDown className="h-4 w-4 text-gray-400" />
            : <ChevronRight className="h-4 w-4 text-gray-400" />
          }
        </div>
      </button>

      {expanded && idea.total_score !== null && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          {criteria.map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{c.name}</span>
              <span className="font-semibold text-gray-900">{scores[c.id] ?? '—'}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">{t('events.ideas.scoring.title')}</span>
            <span className="text-lg font-bold text-yellow-700">{idea.total_score.toFixed(1)}</span>
          </div>
        </div>
      )}

      {expanded && idea.total_score === null && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-400">
          {t('events.ideas.scoring.not_scored_yet')}
        </div>
      )}
    </div>
  );
};
