import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, LayoutGrid, List, BrainCircuit, MoreVertical, Edit, Trash2, X, ShieldAlert, Lock } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { ideasApi } from '@/api/ideas';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Popover } from '@/components/ui/Popover';
import { Avatar } from '@/components/ui/Avatar';
import { IdeaCard } from './IdeaCard';
import type { Room, Idea, IdeaStatus, ProblemVisibility, User } from '@/types';
import { IDEA_STATUSES } from '@/utils/constants';
import { classNames, timeAgo } from '@/utils/helpers';

type ViewMode = 'board' | 'list';

const KANBAN_COLUMNS: { status: IdeaStatus; title: string }[] = [
  { status: 'draft', title: 'Draft' },
  { status: 'refining', title: 'Refining' },
  { status: 'reviewing', title: 'Reviewing' },
  { status: 'submitted', title: 'Submitted' },
  { status: 'closed', title: 'Closed' },
];

export const RoomDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<'forbidden' | 'not_found' | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const { showToast } = useUIStore();

  // Drag-and-drop state
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Edit/Delete states
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLButtonElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<ProblemVisibility>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Share users state for edit modal
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [editSharedUserIds, setEditSharedUserIds] = useState<string[]>([]);
  const [editUserSearch, setEditUserSearch] = useState('');
  const [showEditUserDropdown, setShowEditUserDropdown] = useState(false);
  const editUserSearchRef = useRef<HTMLDivElement>(null);

  const canModify = user && room && (
    user.id === room.created_by || user.role === 'admin'
  );

  useEffect(() => {
    if (id) {
      setAccessError(null);
      fetchRoomData();
    }
  }, [id]);

  const fetchRoomData = async () => {
    if (!id) return;
    try {
      const [roomData, ideasResponse] = await Promise.all([
        roomsApi.getById(id),
        ideasApi.list({ room_id: id }),
      ]);
      setRoom(roomData);
      setIdeas(ideasResponse.items);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setAccessError('forbidden');
      } else {
        setAccessError('not_found');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateIdeaPage = () => {
    navigate(`/rooms/${id}/ideas/new`);
  };

  const openEditModal = () => {
    if (!room) return;
    setEditName(room.name);
    setEditDescription(room.description || '');
    setEditVisibility(room.visibility || 'public');
    setEditSharedUserIds(room.shared_user_ids || []);
    setEditUserSearch('');
    setShowEditUserDropdown(false);
    setIsEditModalOpen(true);
    setShowActions(false);
    usersApi.list({ limit: 100, is_active: true }).then((res) => setAllUsers(res.items)).catch(() => {});
  };

  const toggleEditUser = (userId: string) => {
    setEditSharedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredEditUsers = allUsers.filter(
    (u) => u.id !== user?.id && (u.username.toLowerCase().includes(editUserSearch.toLowerCase()) || (u.full_name || '').toLowerCase().includes(editUserSearch.toLowerCase()))
  );

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await roomsApi.update(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        visibility: editVisibility,
        shared_user_ids: editVisibility === 'private' ? editSharedUserIds : undefined,
      });
      setRoom(updated);
      showToast({ type: 'success', message: t('rooms.updated') });
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('rooms.update_error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await roomsApi.delete(id);
      showToast({ type: 'success', message: t('rooms.deleted') });
      setIsDeleteModalOpen(false);
      navigate('/rooms');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('rooms.delete_error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIdeasByStatus = (status: IdeaStatus) => {
    return ideas.filter((idea) => idea.status === status);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, ideaId: string) => {
    setDraggedIdeaId(ideaId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: IdeaStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedIdeaId) return;

    const idea = ideas.find((i) => i.id === draggedIdeaId);
    if (!idea || idea.status === newStatus) {
      setDraggedIdeaId(null);
      return;
    }

    // Only author or admin can change status
    const canChange = user && (user.id === idea.author_id || user.role === 'admin');
    if (!canChange) {
      showToast({ type: 'error', message: t('rooms.drag_error_own') });
      setDraggedIdeaId(null);
      return;
    }

    // Terminal statuses cannot be dragged out
    if (idea.status === 'submitted' || idea.status === 'closed') {
      showToast({ type: 'error', message: t('rooms.drag_error_terminal', { status: idea.status }) });
      setDraggedIdeaId(null);
      return;
    }

    // Optimistic update — move idea to new column immediately
    const previousStatus = idea.status;
    setIdeas((prev) =>
      prev.map((i) => (i.id === draggedIdeaId ? { ...i, status: newStatus } : i))
    );
    setDraggedIdeaId(null);

    try {
      await ideasApi.update(draggedIdeaId, { status: newStatus });
      showToast({ type: 'success', message: t('rooms.status_updated') });
      await fetchRoomData();
    } catch {
      // Rollback on failure
      setIdeas((prev) =>
        prev.map((i) => (i.id === draggedIdeaId ? { ...i, status: previousStatus } : i))
      );
      showToast({ type: 'error', message: t('ideas.status_error') });
    }
  };

  const handleDragEnd = () => {
    setDraggedIdeaId(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (accessError || !room) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className={`h-12 w-12 mx-auto mb-4 ${accessError === 'forbidden' ? 'text-amber-500' : 'text-muted-foreground'}`} />
        <h2 className="text-card-heading font-semibold text-foreground/70 mb-2">
          {accessError === 'forbidden' ? t('errors.forbidden_title') : t('errors.not_found_title')}
        </h2>
        <p className="text-muted-foreground mb-4">
          {accessError === 'forbidden' ? t('errors.forbidden_desc') : t('errors.not_found_desc')}
        </p>
        <Link to="/rooms" className="text-primary-600 hover:text-primary-700">
          {t('rooms.back_to_rooms')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/rooms"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('rooms.back_to_rooms')}
      </Link>

      {/* Room Header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-section-heading font-bold text-foreground">{room.name}</h1>
            </div>
            {room.description && (
              <p className="text-muted-foreground">{room.description}</p>
            )}

            {room.problem_id && (
              <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-primary-600 font-medium">{t('rooms.linked_problem')}</p>
                  <Link
                    to={`/problems/${room.problem_id}`}
                    className="text-sm text-primary-700 hover:underline"
                  >
                    {t('rooms.view_linked')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={classNames(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'board'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={classNames(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={openCreateIdeaPage} leftIcon={<Plus className="h-4 w-4" />}>
              {t('rooms.add_idea')}
            </Button>

            {canModify && (
              <>
                <button
                  ref={actionsRef}
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>
                <Popover
                  triggerRef={actionsRef}
                  open={showActions}
                  onClose={() => setShowActions(false)}
                  align="right"
                  className="w-48 bg-white rounded-lg shadow-lg border border-border py-1"
                >
                  <button
                    onClick={openEditModal}
                    className="w-full px-4 py-2 text-left text-sm text-foreground/70 hover:bg-secondary flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {t('rooms.edit_room')}
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      setShowActions(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('rooms.delete_room')}
                  </button>
                </Popover>
              </>
            )}
          </div>
        </div>

        {/* Creator info + Badges */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={room.creator?.avatar_url}
              name={room.creator?.full_name || room.creator?.username}
              size="md"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {room.creator?.full_name || room.creator?.username || t('common.unknown')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('rooms.created_time', { time: timeAgo(room.created_at) })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={room.status === 'active' ? 'success' : 'default'}>
              {room.status}
            </Badge>
            {room.visibility === 'private' && (
              <Badge variant="warning">
                <Lock className="h-3 w-3 mr-1" />
                {t('rooms.private_badge')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Ideas View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnIdeas = getIdeasByStatus(column.status);
            const statusConfig = IDEA_STATUSES.find((s) => s.value === column.status);
            const isOver = dragOverColumn === column.status;

            return (
              <div
                key={column.status}
                className={classNames(
                  'bg-muted rounded-xl p-3 transition-colors',
                  isOver && 'bg-primary-50 ring-2 ring-primary-300'
                )}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground/70">{column.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig?.color}`}>
                    {columnIdeas.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[60px]">
                  {columnIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idea.id)}
                      onDragEnd={handleDragEnd}
                      className={classNames(
                        'cursor-grab active:cursor-grabbing',
                        draggedIdeaId === idea.id && 'opacity-50'
                      )}
                    >
                      <IdeaCard
                        idea={idea}
                        onUpdate={fetchRoomData}
                      />
                    </div>
                  ))}
                  {columnIdeas.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      {t('rooms.no_ideas')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-border">
              <p className="text-muted-foreground">{t('rooms.no_ideas_yet')}</p>
              <Button variant="secondary" className="mt-4" onClick={openCreateIdeaPage}>
                {t('rooms.add_first_idea')}
              </Button>
            </div>
          ) : (
            ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onUpdate={fetchRoomData}
                detailed
              />
            ))
          )}
        </div>
      )}

      {/* Edit Room Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('rooms.edit_room')}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">{t('rooms.name_label')}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              minLength={3}
              maxLength={255}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">{t('rooms.desc_label')}</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              {t('rooms.visibility_label')}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditVisibility('public')}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  editVisibility === 'public'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border text-muted-foreground hover:border-border/70'
                }`}
              >
                {t('rooms.visibility_public')}
                <p className="text-xs font-normal mt-1 opacity-75">{t('rooms.visibility_public_desc')}</p>
              </button>
              <button
                type="button"
                onClick={() => setEditVisibility('private')}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  editVisibility === 'private'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border text-muted-foreground hover:border-border/70'
                }`}
              >
                {t('rooms.visibility_private')}
                <p className="text-xs font-normal mt-1 opacity-75">{t('rooms.visibility_private_desc')}</p>
              </button>
            </div>

            {/* Share with users - shown when private */}
            {editVisibility === 'private' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  {t('rooms.share_with_label')}
                </label>
                {editSharedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editSharedUserIds.map((uid) => {
                      const u = allUsers.find((x) => x.id === uid);
                      if (!u) return null;
                      return (
                        <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                          <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                          {u.full_name || u.username}
                          <button type="button" onClick={() => toggleEditUser(uid)} className="hover:text-primary-900">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div ref={editUserSearchRef}>
                  <input
                    type="text"
                    value={editUserSearch}
                    onChange={(e) => { setEditUserSearch(e.target.value); setShowEditUserDropdown(true); }}
                    onFocus={() => setShowEditUserDropdown(true)}
                    placeholder={t('rooms.search_users_placeholder')}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  <Popover
                    triggerRef={editUserSearchRef}
                    open={showEditUserDropdown && filteredEditUsers.length > 0}
                    onClose={() => setShowEditUserDropdown(false)}
                    matchWidth
                    className="bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredEditUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { toggleEditUser(u.id); setEditUserSearch(''); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 ${
                          editSharedUserIds.includes(u.id) ? 'bg-primary-50' : ''
                        }`}
                      >
                        <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                        <span className="font-medium">{u.full_name || u.username}</span>
                        {u.full_name && <span className="text-muted-foreground text-xs">@{u.username}</span>}
                        {editSharedUserIds.includes(u.id) && <span className="ml-auto text-primary-600">✓</span>}
                      </button>
                    ))}
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('rooms.delete_room')}>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {t('rooms.delete_confirm')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? t('common.deleting') : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
