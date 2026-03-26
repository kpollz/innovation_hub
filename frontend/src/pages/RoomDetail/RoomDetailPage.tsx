import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, LayoutGrid, List, BrainCircuit, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { ideasApi } from '@/api/ideas';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { IdeaCard } from './IdeaCard';
import type { Room, Idea, IdeaStatus } from '@/types';
import { IDEA_STATUSES } from '@/utils/constants';
import { Avatar } from '@/components/ui/Avatar';
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
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const { showToast } = useUIStore();

  // Drag-and-drop state
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Edit/Delete states
  const [showActions, setShowActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canModify = user && room && (
    user.id === room.created_by || user.role === 'admin'
  );

  useEffect(() => {
    if (id) {
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
    } catch (error) {
      console.error('Failed to fetch room data:', error);
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
    setIsEditModalOpen(true);
    setShowActions(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await roomsApi.update(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
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

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('rooms.not_found')}</p>
        <Link to="/rooms" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
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
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('rooms.back_to_rooms')}
      </Link>

      {/* Room Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
              <Badge variant={room.status === 'active' ? 'success' : 'default'}>
                {room.status}
              </Badge>
            </div>
            {room.description && (
              <p className="text-gray-600">{room.description}</p>
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={classNames(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'board'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={classNames(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={openCreateIdeaPage} leftIcon={<Plus className="h-4 w-4" />}>
              {t('rooms.add_idea')}
            </Button>

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
                        {t('rooms.edit_room')}
                      </button>
                      <div className="border-t border-gray-200 my-1" />
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
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Creator info — bottom right */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {room.creator?.full_name || room.creator?.username || t('common.unknown')}
              </p>
              <p className="text-xs text-gray-500">
                {t('rooms.created_time', { time: timeAgo(room.created_at) })}
              </p>
            </div>
            <Avatar
              src={room.creator?.avatar_url}
              name={room.creator?.full_name || room.creator?.username}
              size="md"
            />
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
                  'bg-gray-100 rounded-xl p-3 transition-colors',
                  isOver && 'bg-primary-50 ring-2 ring-primary-300'
                )}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">{column.title}</h3>
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
                    <p className="text-center text-sm text-gray-400 py-4">
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
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">{t('rooms.no_ideas_yet')}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('rooms.name_label')}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              minLength={3}
              maxLength={255}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('rooms.desc_label')}</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
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
          <p className="text-gray-600">
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
