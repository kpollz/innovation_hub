import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, Lightbulb } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreateRoomModal } from './CreateRoomModal';
import { Avatar } from '@/components/ui/Avatar';
import type { Room } from '@/types';
import { timeAgo } from '@/utils/helpers';

type ViewMode = 'list' | 'board';

const RoomCard: React.FC<{ room: Room }> = ({ room }) => {
  const creatorName = room.creator?.full_name || room.creator?.username || 'Unknown';

  return (
    <Link to={`/rooms/${room.id}`}>
      <Card hoverable className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge variant={room.status === 'active' ? 'success' : 'default'}>
              {room.status}
            </Badge>
            {room.problem_id && (
              <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                Linked
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
            {room.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {room.description}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              {room.idea_count} ideas
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <Avatar src={room.creator?.avatar_url} name={creatorName} size="sm" />
            <span className="text-xs text-gray-600">{creatorName}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {timeAgo(room.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const IdeaLabPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { showModal } = useUIStore();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomsApi.list();
      setRooms(response.items);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    showModal({ type: 'createRoom' });
  };

  const activeRooms = rooms.filter((r) => r.status === 'active');
  const archivedRooms = rooms.filter((r) => r.status === 'archived');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Idea Lab</h1>
          <p className="text-gray-600 mt-1">
            Brainstorming rooms for collaborative problem solving
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
            Create Room
          </Button>
        </div>
      </div>

      {/* Active Rooms */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Rooms ({activeRooms.length})
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : activeRooms.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No active rooms</p>
            <Button variant="secondary" className="mt-4" onClick={openCreateModal}>
              Create the first room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>

      {/* Archived Rooms */}
      {archivedRooms.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Archived Rooms ({archivedRooms.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {archivedRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}

      <CreateRoomModal onSuccess={fetchRooms} />
    </div>
  );
};
