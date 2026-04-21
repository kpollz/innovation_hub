import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { RoomFormModal } from './RoomFormModal';

interface CreateRoomModalProps {
  onSuccess: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onSuccess }) => {
  const { modal, closeModal } = useUIStore();
  const isOpen = modal?.type === 'createRoom';

  return (
    <RoomFormModal
      isOpen={isOpen}
      onClose={closeModal}
      mode="create-direct"
      onSuccess={onSuccess}
    />
  );
};
