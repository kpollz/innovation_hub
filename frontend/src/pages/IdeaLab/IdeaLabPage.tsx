import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, LayoutGrid, List, Lightbulb, Filter, Lock, BrainCircuit } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DatePicker } from '@/components/ui/DatePicker';
import { CreateRoomModal } from './CreateRoomModal';
import { Avatar } from '@/components/ui/Avatar';
import type { Room } from '@/types';
import { timeAgo } from '@/utils/helpers';

type ViewMode = 'list' | 'board';

const RoomCard: React.FC<{ room: Room }> = ({ room }) => {
  const { t } = useTranslation();
  const creatorName = room.creator?.full_name || room.creator?.username || 'Unknown';

  return (
    <Link to={`/rooms/${room.id}`}>
      <Card hoverable className="h-full">
        <div className="flex flex-col h-full">
          {/* Top: Badges */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={room.status === 'active' ? 'success' : 'default'}>
                  {room.status}
                </Badge>
                {room.visibility === 'private' && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground" title="Private">
                    <Lock className="h-3 w-3" />
                  </span>
                )}
              </div>
              {room.problem_id && (
                <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  Linked
                </span>
              )}
            </div>
          </div>

          {/* Middle: Content (flex-1 fills remaining space) */}
          <div className="px-5 flex-1">
            <h3 className="text-feature-title font-semibold text-foreground mb-2 line-clamp-1">
              {room.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {room.description}
            </p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                {t('rooms.ideas_count', { count: room.idea_count })}
              </span>
            </div>
          </div>

          {/* Bottom: Creator (pinned to bottom) */}
          <div className="px-5 pb-5 pt-4 mt-auto border-t border-border/50">
            <div className="flex items-center gap-2">
              <Avatar src={room.creator?.avatar_url} name={creatorName} size="sm" />
              <span className="text-sm text-foreground/70">{creatorName}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {timeAgo(room.created_at)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export const IdeaLabPage: React.FC = () => {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { showModal } = useUIStore();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (from?: string, to?: string) => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      const df = from ?? dateFrom;
      const dt = to ?? dateTo;
      if (df) filters.date_from = df;
      if (dt) filters.date_to = dt;
      const response = await roomsApi.list(filters);
      setRooms(response.items);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (key: 'from' | 'to', value: string) => {
    if (key === 'from') {
      setDateFrom(value);
      fetchRooms(value, dateTo);
    } else {
      setDateTo(value);
      fetchRooms(dateFrom, value);
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
          <h1 className="text-section-heading font-bold text-foreground flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary-600" />
            {t('rooms.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('rooms.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'board'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            {t('problems.filters')}
          </Button>
          <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
            {t('rooms.create_room')}
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-border">
          <div className="flex items-end gap-3">
            <DatePicker
              value={dateFrom}
              onChange={(val) => handleDateChange('from', val)}
              max={dateTo || undefined}
              placeholder={t('common.date_from')}
              className="w-[180px]"
            />
            <span className="text-muted-foreground pb-2">→</span>
            <DatePicker
              value={dateTo}
              onChange={(val) => handleDateChange('to', val)}
              min={dateFrom || undefined}
              placeholder={t('common.date_to')}
              className="w-[180px]"
            />
          </div>
        </div>
      )}

      {/* Active Rooms */}
      <div>
        <h2 className="text-feature-title font-semibold text-foreground mb-4">
          {t('rooms.active_rooms', { count: activeRooms.length })}
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : activeRooms.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-border">
            <p className="text-muted-foreground">{t('rooms.no_active')}</p>
            <Button variant="secondary" className="mt-4" onClick={openCreateModal}>
              {t('rooms.create_first')}
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
          <h2 className="text-feature-title font-semibold text-foreground mb-4">
            {t('rooms.archived_rooms', { count: archivedRooms.length })}
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
