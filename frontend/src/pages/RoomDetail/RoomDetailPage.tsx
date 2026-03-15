import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, List, BrainCircuit } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreateIdeaModal } from './CreateIdeaModal';
import { IdeaCard } from './IdeaCard';
import type { Room, Idea, IdeaStatus } from '@/types';
import { IDEA_STATUSES } from '@/utils/constants';
import { classNames } from '@/utils/helpers';

type ViewMode = 'board' | 'list';

const KANBAN_COLUMNS: { status: IdeaStatus; title: string }[] = [
  { status: 'draft', title: 'Draft' },
  { status: 'refining', title: 'Refining' },
  { status: 'ready', title: 'Ready for Pilot' },
  { status: 'selected', title: 'Selected' },
  { status: 'rejected', title: 'Rejected' },
];

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const { showModal } = useUIStore();

  useEffect(() => {
    if (id) {
      fetchRoomData();
    }
  }, [id]);

  const fetchRoomData = async () => {
    if (!id) return;
    try {
      const [roomData, ideasData] = await Promise.all([
        roomsApi.getById(id),
        roomsApi.listIdeas(id),
      ]);
      setRoom(roomData);
      setIdeas(ideasData);
    } catch (error) {
      console.error('Failed to fetch room data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateIdeaModal = () => {
    showModal({ type: 'createIdea' });
  };

  const getIdeasByStatus = (status: IdeaStatus) => {
    return ideas.filter((idea) => idea.status === status);
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
        <p className="text-gray-500">Room not found</p>
        <Link to="/rooms" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Idea Lab
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
        Back to Idea Lab
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
            <p className="text-gray-600">{room.description}</p>
            
            {room.linked_problem && (
              <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-primary-600 font-medium">Linked Problem</p>
                  <Link
                    to={`/problems/${room.linked_problem.id}`}
                    className="text-sm text-primary-700 hover:underline"
                  >
                    {room.linked_problem.title}
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
            <Button onClick={openCreateIdeaModal} leftIcon={<Plus className="h-4 w-4" />}>
              Add Idea
            </Button>
          </div>
        </div>
      </div>

      {/* Ideas View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnIdeas = getIdeasByStatus(column.status);
            const statusConfig = IDEA_STATUSES.find((s) => s.value === column.status);
            
            return (
              <div key={column.status} className="bg-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">{column.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig?.color}`}>
                    {columnIdeas.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      roomId={room.id}
                      onUpdate={fetchRoomData}
                    />
                  ))}
                  {columnIdeas.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">
                      No ideas
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
              <p className="text-gray-500">No ideas yet</p>
              <Button variant="secondary" className="mt-4" onClick={openCreateIdeaModal}>
                Add the first idea
              </Button>
            </div>
          ) : (
            ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                roomId={room.id}
                onUpdate={fetchRoomData}
                detailed
              />
            ))
          )}
        </div>
      )}

      <CreateIdeaModal roomId={room.id} onSuccess={fetchRoomData} />
    </div>
  );
};
