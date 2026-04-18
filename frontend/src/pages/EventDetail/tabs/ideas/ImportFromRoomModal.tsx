import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, FolderOpen, FileText } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { ideasApi } from '@/api/ideas';
import { eventsApi } from '@/api/events';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IdeaFormModal } from './IdeaFormModal';
import type { EventObject, Room, Idea, EventIdeaObject, EventTeamObject } from '@/types';

interface ImportFromRoomModalProps {
  event: EventObject;
  myTeam?: EventTeamObject | null;
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

export const ImportFromRoomModal: React.FC<ImportFromRoomModalProps> = ({
  event, myTeam, isOpen, onClose, onImported,
}) => {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomIdeas, setRoomIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // After import, open edit form
  const [importedIdea, setImportedIdea] = useState<EventIdeaObject | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await roomsApi.list({ status: 'active', limit: 100 });
      setRooms(result.items);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchRoomIdeas = useCallback(async (roomId: string) => {
    setLoading(true);
    try {
      const result = await ideasApi.list({ room_id: roomId, limit: 100 });
      setRoomIdeas(result.items);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      setSelectedRoom(null);
      setRoomIdeas([]);
    }
  }, [isOpen, fetchRooms]);

  const handleSelectRoom = async (room: Room) => {
    setSelectedRoom(room);
    await fetchRoomIdeas(room.id);
  };

  const handleImport = async (ideaId: string) => {
    if (!selectedRoom) return;
    setImporting(true);
    try {
      const result = await eventsApi.createIdeaFromRoom(event.id, {
        room_id: selectedRoom.id,
        idea_id: ideaId,
      });
      setImportedIdea(result);
      setShowEditForm(true);
    } catch { /* silent */ }
    finally { setImporting(false); }
  };

  const handleEditSaved = () => {
    setShowEditForm(false);
    setImportedIdea(null);
    onImported();
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showEditForm}
        onClose={onClose}
        title={t('events.ideas.import.title')}
        size="lg"
      >
        {loading && !selectedRoom ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : !selectedRoom ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">{t('events.ideas.import.select_room')}</p>
            {rooms.length === 0 ? (
              <p className="text-center text-gray-400 py-8">{t('events.ideas.import.no_rooms')}</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                  >
                    <FolderOpen className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{room.name}</p>
                      <p className="text-xs text-gray-500">
                        {t('events.ideas.import.idea_count', { count: room.idea_count })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => { setSelectedRoom(null); setRoomIdeas([]); }}
              className="text-sm text-primary-600 hover:text-primary-700 mb-3"
            >
              &larr; {t('events.ideas.import.back_rooms')}
            </button>
            <p className="text-sm text-gray-500 mb-3">
              {t('events.ideas.import.room_label')}: <strong>{selectedRoom.name}</strong>
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : roomIdeas.length === 0 ? (
              <p className="text-center text-gray-400 py-8">{t('events.ideas.import.no_ideas')}</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {roomIdeas.map(idea => (
                  <div
                    key={idea.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">{idea.title}</p>
                    </div>
                    <Button
                      size="sm"
                      isLoading={importing}
                      onClick={() => handleImport(idea.id)}
                    >
                      {t('events.ideas.import.button')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit form for imported idea */}
      {showEditForm && importedIdea && (
        <IdeaFormModal
          event={event}
          idea={importedIdea}
          myTeam={myTeam}
          isOpen={showEditForm}
          onClose={handleEditSaved}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
};
