import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, FolderOpen, FileText } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { ideasApi } from '@/api/ideas';
import { problemsApi } from '@/api/problems';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IdeaFormModal } from './IdeaFormModal';
import type { EventObject, Room, Idea, EventIdeaObject, EventTeamObject, TipTapContent } from '@/types';

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

  // Pending import: stored until user confirms in edit form
  const [pendingImport, setPendingImport] = useState<{
    room: Room;
    idea: Idea;
    problemContent: TipTapContent | null;
    sourceProblemId: string | null;
  } | null>(null);
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

  const handleImport = async (idea: Idea) => {
    if (!selectedRoom) return;
    let problemContent: TipTapContent | null = null;
    let sourceProblemId: string | null = null;

    if (selectedRoom.problem_id) {
      try {
        const problem = await problemsApi.getById(selectedRoom.problem_id);
        problemContent = problem.content;
        sourceProblemId = problem.id;
      } catch { /* silent — proceed without problem content */ }
    }

    setPendingImport({
      room: selectedRoom,
      idea,
      problemContent,
      sourceProblemId,
    });
    setShowEditForm(true);
  };

  const handleEditSaved = () => {
    setShowEditForm(false);
    setPendingImport(null);
    onImported();
    onClose();
  };

  const handleEditCancelled = () => {
    setShowEditForm(false);
    setPendingImport(null);
  };

  // Build a fake EventIdeaObject from room idea + problem for form pre-population
  const buildImportIdea = (
    room: Room, idea: Idea,
    problemContent: TipTapContent | null, sourceProblemId: string | null,
  ): EventIdeaObject => ({
    id: '__import__',
    event_id: event.id,
    team_id: '',
    team: null,
    title: idea.title,
    user_problem: problemContent,
    user_scenarios: null,
    user_expectation: null,
    research: null,
    solution: idea.description,
    source_type: 'linked',
    source_problem_id: sourceProblemId,
    source_room_id: room.id,
    source_idea_id: idea.id,
    author_id: '',
    author: null,
    total_score: null,
    score_count: 0,
    can_score: false,
    created_at: '',
    updated_at: null,
  });

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
                      onClick={() => handleImport(idea)}
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
      {showEditForm && pendingImport && (
        <IdeaFormModal
          event={event}
          idea={buildImportIdea(pendingImport.room, pendingImport.idea, pendingImport.problemContent, pendingImport.sourceProblemId)}
          myTeam={myTeam}
          isOpen={showEditForm}
          onClose={handleEditCancelled}
          onSaved={handleEditSaved}
          importSource={{ room_id: pendingImport.room.id, idea_id: pendingImport.idea.id }}
        />
      )}
    </>
  );
};
