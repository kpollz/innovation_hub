import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Circle,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { problemsApi } from '@/api/problems';
import { commentsApi } from '@/api/comments';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES } from '@/utils/constants';
import { timeAgo, classNames } from '@/utils/helpers';
import { Avatar } from '@/components/ui/Avatar';
import type { Comment, ReactionType, ProblemStatus, ProblemCategory, ProblemVisibility, User } from '@/types';

export const ProblemDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedProblem, fetchProblem, isLoading } = useProblemStore();
  const { showToast } = useUIStore();
  const [accessError, setAccessError] = useState<'forbidden' | 'not_found' | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Edit/Delete states
  const [showActions, setShowActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<ProblemCategory>('process');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brainstormName, setBrainstormName] = useState('');
  const [brainstormDesc, setBrainstormDesc] = useState('');
  const [brainstormVisibility, setBrainstormVisibility] = useState<ProblemVisibility>('public');
  const [brainstormSharedUserIds, setBrainstormSharedUserIds] = useState<string[]>([]);
  const [brainstormUserSearch, setBrainstormUserSearch] = useState('');
  const [brainstormUsers, setBrainstormUsers] = useState<User[]>([]);

  // Privacy states for edit
  const [editVisibility, setEditVisibility] = useState<ProblemVisibility>('public');
  const [editSharedUserIds, setEditSharedUserIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBrainstormUserDropdown, setShowBrainstormUserDropdown] = useState(false);

  useEffect(() => {
    if (id) {
      setAccessError(null);
      problemsApi.getById(id)
        .then((data) => {
          useProblemStore.setState({ selectedProblem: data, isLoading: false });
        })
        .catch((err) => {
          if (err?.response?.status === 403) {
            setAccessError('forbidden');
          } else {
            setAccessError('not_found');
          }
          useProblemStore.setState({ isLoading: false });
        });
      fetchComments();
    }
  }, [id]);

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
    if (!id || !selectedProblem) return;
    try {
      if (selectedProblem.user_reaction === type) {
        await problemsApi.removeReaction(id);
      } else {
        await problemsApi.addReaction(id, type);
      }
      const updated = await problemsApi.getById(id);
      useProblemStore.setState({ selectedProblem: updated });
    } catch {
      showToast({ type: 'error', message: t('problems.reaction_error') });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    try {
      await commentsApi.create({ target_id: id, target_type: 'problem', content: newComment });
      showToast({ type: 'success', message: t('comments.added') });
      setNewComment('');
      await fetchComments();
      const updated = await problemsApi.getById(id);
      useProblemStore.setState({ selectedProblem: updated });
    } catch {
      showToast({ type: 'error', message: t('comments.add_error') });
    }
  };

  const handleStatusChange = async (newStatus: ProblemStatus) => {
    if (!id || !canModify) return;
    try {
      const updated = await problemsApi.update(id, { status: newStatus });
      useProblemStore.setState({ selectedProblem: updated });
      showToast({ type: 'success', message: t('problems.status_changed', { status: newStatus }) });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('problems.update_error') });
    }
    setShowActions(false);
  };

  const openEditModal = () => {
    if (selectedProblem) {
      setEditTitle(selectedProblem.title);
      setEditSummary(selectedProblem.summary || '');
      setEditContent(selectedProblem.content);
      setEditCategory(selectedProblem.category);
      setEditVisibility((selectedProblem as any).visibility || 'public');
      setEditSharedUserIds((selectedProblem as any).shared_user_ids || []);
      setUserSearch('');
      setIsEditModalOpen(true);
      setShowActions(false);
      usersApi.list({ limit: 100 }).then((res) => setAllUsers(res.items)).catch(() => {});
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editTitle.trim() || !editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await problemsApi.update(id, {
        title: editTitle,
        summary: editSummary.trim() || undefined,
        content: editContent,
        category: editCategory,
        visibility: editVisibility,
        shared_user_ids: editVisibility === 'private' ? editSharedUserIds : undefined,
      });
      showToast({ type: 'success', message: t('problems.updated_success') });
      setIsEditModalOpen(false);
      fetchProblem(id);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const message = typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw.map((e: { msg?: string }) => e.msg).join('; ')
          : t('problems.update_error');
      showToast({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      await problemsApi.delete(id);
      showToast({ type: 'success', message: t('problems.deleted_success') });
      setIsDeleteModalOpen(false);
      navigate('/problems');
    } catch {
      showToast({ type: 'error', message: t('problems.delete_error') });
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
        visibility: brainstormVisibility,
        shared_user_ids: brainstormVisibility === 'private' ? brainstormSharedUserIds : undefined,
      });
      showToast({ type: 'success', message: t('problems.room_created') });
      setIsBrainstormModalOpen(false);
      setBrainstormName('');
      setBrainstormDesc('');
      setBrainstormVisibility('public');
      setBrainstormSharedUserIds([]);
      setBrainstormUserSearch('');
      const updated = await problemsApi.getById(id);
      useProblemStore.setState({ selectedProblem: updated });
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const message = typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw.map((e: { msg?: string }) => e.msg).join('; ')
          : t('problems.room_create_error');
      showToast({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accessError) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className={`h-12 w-12 mx-auto mb-4 ${accessError === 'forbidden' ? 'text-amber-500' : 'text-gray-400'}`} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {accessError === 'forbidden' ? t('errors.forbidden_title') : t('errors.not_found_title')}
        </h2>
        <p className="text-gray-500 mb-4">
          {accessError === 'forbidden' ? t('errors.forbidden_desc') : t('errors.not_found_desc')}
        </p>
        <Link to="/problems" className="text-primary-600 hover:text-primary-700">
          {t('problems.back_to_problems')}
        </Link>
      </div>
    );
  }

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
  const authorAvatar = selectedProblem.author?.avatar_url;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/problems"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('problems.back_to_problems')}
      </Link>

      {/* Problem Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {category && (
                <Badge variant="info" size="sm">{category.label}</Badge>
              )}
              {(selectedProblem as any).visibility === 'private' && (
                <Badge variant="warning" size="sm">
                  <Lock className="h-3 w-3 mr-1" />
                  {t('problems.private_badge')}
                </Badge>
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
                          {t('problems.edit_problem')}
                        </button>

                        <div className="border-t border-gray-200 my-1" />

                        {(() => {
                          const current = selectedProblem.status;
                          const terminal = ['solved', 'closed'];
                          if (terminal.includes(current)) return null;
                          const order = ['open', 'discussing', 'brainstorming', 'solved', 'closed'];
                          const currentIdx = order.indexOf(current);
                          const options = PROBLEM_STATUSES.filter((s) => {
                            const targetIdx = order.indexOf(s.value);
                            return targetIdx > currentIdx && terminal.includes(s.value);
                          });
                          if (options.length === 0) return null;
                          return (<>
                        <p className="px-4 py-1 text-xs text-gray-500 font-medium">{t('problems.change_status')}</p>
                        {options.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => handleStatusChange(s.value as ProblemStatus)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Circle className="h-4 w-4" />
                            {s.label}
                          </button>
                        ))}
                          </>);
                        })()}

                        <div className="border-t border-gray-200 my-1" />

                        <button
                          onClick={() => {
                            setShowActions(false);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('problems.delete_problem')}
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
          <div
            className="text-gray-700 rich-content"
            dangerouslySetInnerHTML={{ __html: selectedProblem.content }}
          />

          {/* Author Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={authorAvatar} name={authorName} size="lg" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {authorName}
                </p>
                <p className="text-xs text-gray-500">
                  {t('common.author')}
                </p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Brainstorming Rooms Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">{t('problems.brainstorming_rooms')}</h3>
            {selectedProblem.rooms?.length > 0 && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                {selectedProblem.rooms.length}
              </span>
            )}
          </div>
          {!['solved', 'closed'].includes(selectedProblem.status) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setBrainstormName(`Brainstorm: ${selectedProblem.title}`);
                setBrainstormVisibility('public');
                setBrainstormSharedUserIds([]);
                setBrainstormUserSearch('');
                setIsBrainstormModalOpen(true);
                usersApi.list({ limit: 100, is_active: true }).then((res) => setBrainstormUsers(res.items)).catch(() => {});
              }}
            >
              {selectedProblem.rooms?.length > 0 ? t('problems.add_room') : t('problems.brainstorm_solutions')}
            </Button>
          )}
        </div>
        {selectedProblem.rooms?.length > 0 ? (
          <div className="mt-3 space-y-2 max-h-[180px] overflow-y-auto">
            {selectedProblem.rooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <BrainCircuit className="h-4 w-4 text-primary-600 shrink-0" />
                <span className="text-sm font-medium text-gray-800 truncate">{room.name}</span>
                <span className={classNames(
                  'ml-auto text-xs px-2 py-0.5 rounded-full shrink-0',
                  room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {room.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">{t('problems.no_rooms')}</p>
        )}
      </div>

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
              {t('comments.title', { count: comments.length })}
            </h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Add Comment */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              placeholder={t('comments.add_placeholder')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newComment.trim()}>
                {t('comments.post')}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {t('comments.no_comments')}
              </p>
            ) : (
              comments.map((comment) => {
                const commentAuthorName = comment.author?.full_name || comment.author?.username || 'Unknown';
                const isOwnComment = user?.id === comment.author_id;
                return (
                  <div
                    key={comment.id}
                    className={`flex gap-3 p-4 rounded-lg ${
                      isOwnComment ? 'flex-row-reverse bg-primary-50' : 'bg-gray-50'
                    }`}
                  >
                    <Avatar src={comment.author?.avatar_url} name={commentAuthorName} size="md" />
                    <div className={`flex-1 ${isOwnComment ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isOwnComment ? 'flex-row-reverse' : ''}`}>
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
        title={t('problems.edit_problem')}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label={t('problems.title_min_label')}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            minLength={5}
            maxLength={255}
          />
          <Input
            label={t('problems.summary_label')}
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            placeholder={t('problems.summary_placeholder')}
            maxLength={500}
          />
          <RichTextEditor
            label={t('problems.description_label')}
            value={editContent}
            onChange={setEditContent}
            minHeight="200px"
          />
          <Select
            label={t('problems.category_label')}
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as ProblemCategory)}
            options={PROBLEM_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          />

          {/* Privacy / Visibility */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('problems.visibility_label')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-visibility"
                  value="public"
                  checked={editVisibility === 'public'}
                  onChange={() => { setEditVisibility('public'); setEditSharedUserIds([]); }}
                  className="text-blue-600"
                />
                <span className="text-sm">{t('problems.visibility_public')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-visibility"
                  value="private"
                  checked={editVisibility === 'private'}
                  onChange={() => setEditVisibility('private')}
                  className="text-blue-600"
                />
                <span className="text-sm">{t('problems.visibility_private')}</span>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {editVisibility === 'public'
                ? t('problems.visibility_public_desc')
                : t('problems.visibility_private_desc')}
            </p>
          </div>

          {/* Shared Users (only when private) */}
          {editVisibility === 'private' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('problems.share_with_label')}
              </label>
              {editSharedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editSharedUserIds.map((uid) => {
                    const u = allUsers.find((x) => x.id === uid);
                    return (
                      <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {u?.full_name || u?.username || uid.slice(0, 8)}
                        <button type="button" onClick={() => setEditSharedUserIds(editSharedUserIds.filter((id) => id !== uid))} className="ml-1 text-blue-600 hover:text-red-500">×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <Input
                  placeholder={t('problems.search_users_placeholder')}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                />
                {showUserDropdown && allUsers.filter((u) =>
                  !editSharedUserIds.includes(u.id) &&
                  (u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                    (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ?? false))
                ).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {allUsers
                      .filter((u) =>
                        !editSharedUserIds.includes(u.id) &&
                        (u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ?? false))
                      )
                      .slice(0, 10)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setEditSharedUserIds([...editSharedUserIds, u.id]); setUserSearch(''); setShowUserDropdown(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                        >
                          <span className="font-medium">{u.username}</span>
                          {u.full_name && <span className="text-gray-500">({u.full_name})</span>}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('problems.delete_problem')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('problems.delete_confirm')}
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? t('common.deleting') : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Brainstorm Room Modal */}
      <Modal
        isOpen={isBrainstormModalOpen}
        onClose={() => setIsBrainstormModalOpen(false)}
        title={t('problems.create_room_title')}
      >
        <form onSubmit={handleCreateBrainstormRoom} className="space-y-4">
          <Input
            label={t('problems.room_name_label')}
            value={brainstormName}
            onChange={(e) => setBrainstormName(e.target.value)}
            required
            minLength={3}
            maxLength={255}
          />
          <Textarea
            label={t('problems.room_desc_label')}
            value={brainstormDesc}
            onChange={(e) => setBrainstormDesc(e.target.value)}
            rows={3}
          />

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('rooms.visibility_label')}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setBrainstormVisibility('public'); setBrainstormSharedUserIds([]); }}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  brainstormVisibility === 'public'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t('rooms.visibility_public')}
                <p className="text-xs font-normal mt-1 opacity-75">{t('rooms.visibility_public_desc')}</p>
              </button>
              <button
                type="button"
                onClick={() => setBrainstormVisibility('private')}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  brainstormVisibility === 'private'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t('rooms.visibility_private')}
                <p className="text-xs font-normal mt-1 opacity-75">{t('rooms.visibility_private_desc')}</p>
              </button>
            </div>

            {/* Share with users when private */}
            {brainstormVisibility === 'private' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rooms.share_with_label')}
                </label>
                {brainstormSharedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {brainstormSharedUserIds.map((uid) => {
                      const u = brainstormUsers.find((x) => x.id === uid);
                      if (!u) return null;
                      return (
                        <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                          {u.full_name || u.username}
                          <button type="button" onClick={() => setBrainstormSharedUserIds(brainstormSharedUserIds.filter((id) => id !== uid))} className="hover:text-primary-900">
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    value={brainstormUserSearch}
                    onChange={(e) => setBrainstormUserSearch(e.target.value)}
                    onFocus={() => setShowBrainstormUserDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBrainstormUserDropdown(false), 200)}
                    placeholder={t('rooms.search_users_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  {showBrainstormUserDropdown && brainstormUsers.filter((u) =>
                    u.id !== user?.id &&
                    !brainstormSharedUserIds.includes(u.id) &&
                    (u.username.toLowerCase().includes(brainstormUserSearch.toLowerCase()) ||
                      (u.full_name?.toLowerCase().includes(brainstormUserSearch.toLowerCase()) ?? false))
                  ).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {brainstormUsers
                        .filter((u) =>
                          u.id !== user?.id &&
                          !brainstormSharedUserIds.includes(u.id) &&
                          (u.username.toLowerCase().includes(brainstormUserSearch.toLowerCase()) ||
                            (u.full_name?.toLowerCase().includes(brainstormUserSearch.toLowerCase()) ?? false))
                        )
                        .slice(0, 10)
                        .map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setBrainstormSharedUserIds([...brainstormSharedUserIds, u.id]); setBrainstormUserSearch(''); setShowBrainstormUserDropdown(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                          >
                            <span className="font-medium">{u.full_name || u.username}</span>
                            {u.full_name && <span className="text-gray-400 text-xs">@{u.username}</span>}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsBrainstormModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.creating') : t('problems.create_room')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};