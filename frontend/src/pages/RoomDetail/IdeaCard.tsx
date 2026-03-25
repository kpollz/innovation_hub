import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Star,
  MessageCircle,
  ThumbsUp,
  Lightbulb,
  MoreVertical,
  Pin,
  Trash2
} from 'lucide-react';
import { ideasApi } from '@/api/ideas';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import type { Idea, IdeaStatus } from '@/types';
import { IDEA_STATUSES } from '@/utils/constants';
import { truncateText, classNames } from '@/utils/helpers';
import { Avatar } from '@/components/ui/Avatar';

interface IdeaCardProps {
  idea: Idea;
  onUpdate: () => void;
  detailed?: boolean;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onUpdate,
  detailed = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteStars, setVoteStars] = useState(idea.user_vote?.stars || 3);
  const [showActions, setShowActions] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAuthor = user?.id === idea.author_id;
  const isAdmin = user?.role === 'admin';
  const canModify = isAuthor || isAdmin;
  const statusConfig = IDEA_STATUSES.find((s) => s.value === idea.status);

  const handleVote = async () => {
    try {
      await ideasApi.vote(idea.id, { stars: voteStars });
      showToast({ type: 'success', message: t('ideas.vote_recorded') });
      setShowVoteModal(false);
      onUpdate();
    } catch {
      showToast({ type: 'error', message: t('ideas.vote_error') });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ideasApi.update(idea.id, { status: newStatus as IdeaStatus });
      showToast({ type: 'success', message: t('ideas.status_updated') });
      onUpdate();
    } catch {
      showToast({ type: 'error', message: t('ideas.status_error') });
    }
  };

  const handlePinToggle = async () => {
    try {
      await ideasApi.update(idea.id, { is_pinned: !idea.is_pinned });
      showToast({
        type: 'success',
        message: idea.is_pinned ? t('ideas.unpin_success') : t('ideas.pin_success')
      });
      onUpdate();
    } catch {
      showToast({ type: 'error', message: t('ideas.pin_error') });
    }
  };

  const handleDelete = async () => {
    try {
      await ideasApi.delete(idea.id);
      showToast({ type: 'success', message: t('ideas.deleted_success') });
      setIsDeleteModalOpen(false);
      onUpdate();
    } catch {
      showToast({ type: 'error', message: t('ideas.delete_error') });
    }
  };

  const authorName = idea.author?.full_name || idea.author?.username || 'Unknown';

  return (
    <>
      <Card className={classNames('overflow-visible', idea.is_pinned && 'border-warning-300 ring-1 ring-warning-200')}>
        <CardContent className={classNames('p-4', detailed && 'p-6')}>
          {/* Header: Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {idea.is_pinned && (
                <Pin className="h-4 w-4 text-warning-500" />
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig?.color}`}>
                {statusConfig?.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canModify && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>

                  {showActions && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowActions(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              handlePinToggle();
                              setShowActions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            {idea.is_pinned ? t('ideas.unpin_idea') : t('ideas.pin_idea')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowActions(false);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('ideas.delete_idea')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <Link to={`/ideas/${idea.id}`}>
            <h3 className={classNames(
              'font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors',
              detailed ? 'text-xl' : 'text-sm line-clamp-2'
            )}>
              {idea.title}
            </h3>
          </Link>

          {idea.summary && (
            <p className={classNames(
              'text-gray-600 mb-3',
              detailed ? 'text-base' : 'text-xs line-clamp-3'
            )}>
              {detailed ? idea.summary : truncateText(idea.summary, 100)}
            </p>
          )}

          {/* Footer: Vote + Comments + Avatar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVoteModal(true)}
                className={classNames(
                  'flex items-center gap-1 hover:text-primary-600',
                  idea.user_vote ? 'text-primary-600' : ''
                )}
              >
                <Star className={classNames('h-4 w-4', idea.user_vote ? 'fill-primary-600' : '')} />
                <span>{idea.vote_avg?.toFixed(1) || '0.0'}</span>
                <span className="text-xs">({idea.vote_count || 0})</span>
              </button>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {idea.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                {idea.insights_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {idea.comments_count || 0}
              </span>
            </div>
            <Avatar src={idea.author?.avatar_url} name={authorName} size="sm" />
          </div>

          {/* Status Change (for author or admin) */}
          {canModify && detailed && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Select
                label={t('ideas.change_status')}
                value={idea.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={[...IDEA_STATUSES]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vote Modal */}
      <Modal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        title={t('ideas.vote_title', { title: truncateText(idea.title, 30) })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowVoteModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleVote}>
              {t('ideas.submit_vote')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t('ideas.vote_desc')}</p>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((stars) => (
              <button
                key={stars}
                onClick={() => setVoteStars(stars)}
                className={classNames(
                  'w-12 h-12 rounded-lg font-semibold transition-colors flex items-center justify-center',
                  voteStars >= stars
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Star className={classNames(
                  'h-6 w-6',
                  voteStars >= stars ? 'fill-white' : ''
                )} />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{t('ideas.vote_poor')}</span>
            <span>{t('ideas.vote_excellent')}</span>
          </div>
          {idea.user_vote && (
            <p className="text-center text-sm text-primary-600">
              {t('ideas.vote_previous', { stars: idea.user_vote.stars })}
            </p>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('ideas.delete_idea')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('ideas.delete_confirm')}
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
