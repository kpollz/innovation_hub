import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  Lightbulb, 
  MessageCircle,
  BrainCircuit
} from 'lucide-react';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { problemsApi } from '@/api/problems';
import { commentsApi } from '@/api/comments';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES } from '@/utils/constants';
import { timeAgo, classNames } from '@/utils/helpers';
import type { Comment, ReactionType } from '@/types';

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedProblem, fetchProblem, isLoading } = useProblemStore();
  const { showToast } = useUIStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);

  useEffect(() => {
    if (id) {
      fetchProblem(id);
      fetchComments();
    }
  }, [id, fetchProblem]);

  const fetchComments = async () => {
    if (!id) return;
    try {
      const response = await commentsApi.list({ target_id: id, target_type: 'problem' });
      setComments(response.items || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleReaction = async (type: ReactionType) => {
    if (!id) return;
    try {
      if (userReaction === type) {
        await problemsApi.removeReaction(id);
        setUserReaction(null);
      } else {
        await problemsApi.addReaction(id, type);
        setUserReaction(type);
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to add reaction' });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    try {
      await commentsApi.create({ target_id: id, target_type: 'problem', content: newComment });
      showToast({ type: 'success', message: 'Comment added!' });
      setNewComment('');
      fetchComments();
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to add comment' });
    }
  };

  if (isLoading || !selectedProblem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const category = PROBLEM_CATEGORIES.find((c) => c.value === selectedProblem.category);
  const status = PROBLEM_STATUSES.find((s) => s.value === selectedProblem.status);
  const authorName = selectedProblem.author?.full_name || selectedProblem.author?.username || 'Unknown User';
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/problems"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Problems
      </Link>

      {/* Problem Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {category && (
                <Badge variant="info" size="sm">{category.label}</Badge>
              )}
              {status && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              Posted {timeAgo(selectedProblem.created_at)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedProblem.title}
          </h1>
          <p className="text-gray-700 whitespace-pre-wrap">
            {selectedProblem.content}
          </p>

          {/* Author Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {authorInitial}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {authorName}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedProblem.author?.team || 'N/A'}
                </p>
              </div>
            </div>

            {selectedProblem.linked_room_id && (
              <Link
                to={`/rooms/${selectedProblem.linked_room_id}`}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <BrainCircuit className="h-4 w-4" />
                View Brainstorming Room
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reactions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleReaction('like')}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                userReaction === 'like'
                  ? 'bg-primary-100 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              <span>{selectedProblem.likes_count || 0}</span>
            </button>
            <button
              onClick={() => handleReaction('insight')}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                userReaction === 'insight'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <Lightbulb className="h-5 w-5" />
              <span>{selectedProblem.insights_count || 0}</span>
            </button>
            <button
              onClick={() => handleReaction('dislike')}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                userReaction === 'dislike'
                  ? 'bg-red-100 text-red-700'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <ThumbsDown className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Comments ({comments.length})
            </h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Add Comment */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              comments.map((comment) => {
                const commentAuthorName = comment.author?.full_name || comment.author?.username || 'Unknown';
                return (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary-700">
                        {commentAuthorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {commentAuthorName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};