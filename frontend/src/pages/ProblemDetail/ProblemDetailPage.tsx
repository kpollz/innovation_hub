import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  MessageCircle,
  BrainCircuit,
  Edit,
  Trash2,
  MoreVertical,
  Circle
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { problemsApi } from '@/api/problems';
import { commentsApi } from '@/api/comments';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES } from '@/utils/constants';
import { timeAgo, classNames } from '@/utils/helpers';
import type { Comment, ReactionType, ProblemStatus, ProblemCategory } from '@/types';

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedProblem, fetchProblem, isLoading } = useProblemStore();
  const { showToast } = useUIStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Edit/Delete states
  const [showActions, setShowActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<ProblemCategory>('process');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brainstormName, setBrainstormName] = useState('');
  const [brainstormDesc, setBrainstormDesc] = useState('');

  useEffect(() => {
    if (id) {
      fetchProblem(id);
      fetchComments();
    }
  }, [id, fetchProblem]);

  // Check if user can modify (owner or admin)
  const canModify = user && selectedProblem && (
    user.id === selectedProblem.author_id || user.role === 'admin'
  );

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
      if (selectedProblem?.user_reaction === type) {
        await problemsApi.removeReaction(id);
      } else {
        await problemsApi.addReaction(id, type);
      }
      fetchProblem(id);
    } catch {
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
      // Await comments first so they render before fetchProblem triggers isLoading spinner
      await fetchComments();
      // Refresh problem silently (status may have auto-transitioned)
      const updated = await problemsApi.getById(id);
      useProblemStore.setState({ selectedProblem: updated });
    } catch {
      showToast({ type: 'error', message: 'Failed to add comment' });
    }
  };

  const handleStatusChange = async (newStatus: ProblemStatus) => {
    if (!id || !canModify) return;
    try {
      await problemsApi.update(id, { status: newStatus });
      showToast({ type: 'success', message: `Status changed to ${newStatus}` });
      fetchProblem(id);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || 'Failed to update status' });
    }
    setShowActions(false);
  };

  const openEditModal = () => {
    if (selectedProblem) {
      setEditTitle(selectedProblem.title);
      setEditContent(selectedProblem.content);
      setEditCategory(selectedProblem.category);
      setIsEditModalOpen(true);
      setShowActions(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editTitle.trim() || !editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await problemsApi.update(id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
      });
      showToast({ type: 'success', message: 'Problem updated!' });
      setIsEditModalOpen(false);
      fetchProblem(id);
    } catch {
      showToast({ type: 'error', message: 'Failed to update problem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      await problemsApi.delete(id);
      showToast({ type: 'success', message: 'Problem deleted!' });
      setIsDeleteModalOpen(false);
      navigate('/problems');
    } catch {
      showToast({ type: 'error', message: 'Failed to delete problem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBrainstormRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !brainstormName.trim()) return;

    setIsSubmitting(true);
    try {
      await problemsApi.createRoom(id, {
        name: brainstormName,
        description: brainstormDesc || undefined,
      });
      showToast({ type: 'success', message: 'Brainstorming room created!' });
      setIsBrainstormModalOpen(false);
      setBrainstormName('');
      setBrainstormDesc('');
      fetchProblem(id);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || 'Failed to create brainstorming room' });
    } finally {
      setIsSubmitting(false);
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Posted {timeAgo(selectedProblem.created_at)}
              </span>

              {/* Actions Dropdown for Owner/Admin */}
              {canModify && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>

                  {showActions && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowActions(false)}
                      />
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={openEditModal}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Problem
                        </button>

                        <div className="border-t border-gray-200 my-1" />

                        <p className="px-4 py-1 text-xs text-gray-500 font-medium">Change Status</p>
                        {PROBLEM_STATUSES.filter((s) => {
                          const current = selectedProblem.status;
                          const order = ['open', 'discussing', 'brainstorming', 'solved', 'closed'];
                          const currentIdx = order.indexOf(current);
                          const targetIdx = order.indexOf(s.value);
                          // Only show forward transitions (not current or past)
                          return targetIdx > currentIdx;
                        }).map((s) => (
                          <button
                            key={s.value}
                            onClick={() => handleStatusChange(s.value as ProblemStatus)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Circle className="h-4 w-4" />
                            {s.label}
                          </button>
                        ))}

                        <div className="border-t border-gray-200 my-1" />

                        <button
                          onClick={() => {
                            setShowActions(false);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Problem
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
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
                  Author
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedProblem.room_id ? (
                <Link
                  to={`/rooms/${selectedProblem.room_id}`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <BrainCircuit className="h-4 w-4" />
                  View Brainstorming Room
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setBrainstormName(`Brainstorm: ${selectedProblem.title}`);
                    setIsBrainstormModalOpen(true);
                  }}
                >
                  <BrainCircuit className="h-4 w-4 mr-2" />
                  Brainstorm Solutions
                </Button>
              )}
            </div>
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
                selectedProblem.user_reaction === 'like'
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
                selectedProblem.user_reaction === 'insight'
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
                selectedProblem.user_reaction === 'dislike'
                  ? 'bg-red-100 text-red-700'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              <span>{selectedProblem.dislikes_count || 0}</span>
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

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Problem"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />
          <Textarea
            label="Content"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            required
          />
          <Select
            label="Category"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as ProblemCategory)}
            options={PROBLEM_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Problem"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this problem? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Brainstorm Room Modal */}
      <Modal
        isOpen={isBrainstormModalOpen}
        onClose={() => setIsBrainstormModalOpen(false)}
        title="Create Brainstorming Room"
      >
        <form onSubmit={handleCreateBrainstormRoom} className="space-y-4">
          <Input
            label="Room Name"
            value={brainstormName}
            onChange={(e) => setBrainstormName(e.target.value)}
            required
          />
          <Textarea
            label="Description (optional)"
            value={brainstormDesc}
            onChange={(e) => setBrainstormDesc(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsBrainstormModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
