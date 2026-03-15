import React, { useState } from 'react';
import {
  Star,
  MessageCircle,
  MoreVertical,
  Pin
} from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import type { Idea, IdeaStatus } from '@/types';
import { IDEA_STATUSES } from '@/utils/constants';
import { timeAgo, truncateText, classNames } from '@/utils/helpers';

interface IdeaCardProps {
  idea: Idea;
  roomId: string;
  onUpdate: () => void;
  detailed?: boolean;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ 
  idea, 
  roomId, 
  onUpdate, 
  detailed = false 
}) => {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteScore, setVoteScore] = useState(5);
  const [showActions, setShowActions] = useState(false);

  const isAuthor = user?.id === idea.author_id;
  const statusConfig = IDEA_STATUSES.find((s) => s.value === idea.status);

  const handleVote = async () => {
    try {
      await roomsApi.voteIdea(roomId, idea.id, { score: voteScore });
      showToast({ type: 'success', message: 'Vote recorded!' });
      setShowVoteModal(false);
      onUpdate();
    } catch {
      showToast({ type: 'error', message: 'Failed to vote' });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await roomsApi.updateIdea(roomId, idea.id, { status: newStatus as IdeaStatus });
      showToast({ type: 'success', message: 'Status updated!' });
      onUpdate();
    } catch {
      showToast({ type: 'error', message: 'Failed to update status' });
    }
  };

  const handlePinToggle = async () => {
    try {
      await roomsApi.updateIdea(roomId, idea.id, { is_pinned: !idea.is_pinned });
      showToast({ 
        type: 'success', 
        message: idea.is_pinned ? 'Idea unpinned' : 'Idea pinned!' 
      });
      onUpdate();
    } catch {
      showToast({ type: 'error', message: 'Failed to toggle pin' });
    }
  };

  return (
    <>
      <Card className={classNames(idea.is_pinned && 'border-warning-300 ring-1 ring-warning-200')}>
        <CardContent className={classNames('p-4', detailed && 'p-6')}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {idea.is_pinned && (
                <Pin className="h-4 w-4 text-warning-500" />
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig?.color}`}>
                {statusConfig?.label}
              </span>
            </div>
            
            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        handlePinToggle();
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      {idea.is_pinned ? 'Unpin' : 'Pin'} Idea
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <h3 className={classNames(
            'font-semibold text-gray-900 mb-2',
            detailed ? 'text-xl' : 'text-sm line-clamp-2'
          )}>
            {idea.title}
          </h3>
          
          <p className={classNames(
            'text-gray-600 mb-3',
            detailed ? 'text-base' : 'text-xs line-clamp-3'
          )}>
            {detailed ? idea.description : truncateText(idea.description, 100)}
          </p>

          {/* Outcome */}
          {detailed && (
            <div className="bg-success-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-success-700 font-medium mb-1">Expected Outcome</p>
              <p className="text-sm text-success-800">{idea.outcome}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <button
                onClick={() => setShowVoteModal(true)}
                className="flex items-center gap-1 hover:text-primary-600"
              >
                <Star className="h-4 w-4" />
                <span>{idea.vote_avg.toFixed(1)}</span>
                <span className="text-xs">({idea.vote_count})</span>
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {idea.comment_count}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-700">
                  {idea.author.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-500">{timeAgo(idea.created_at)}</span>
            </div>
          </div>

          {/* Status Change (for author) */}
          {isAuthor && detailed && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Select
                label="Change Status"
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
        title={`Vote on "${truncateText(idea.title, 30)}"`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowVoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleVote}>
              Submit Vote
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">Rate this idea from 1-10:</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                onClick={() => setVoteScore(score)}
                className={classNames(
                  'w-10 h-10 rounded-lg font-semibold transition-colors',
                  voteScore === score
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      </Modal>
    </>
  );
};
