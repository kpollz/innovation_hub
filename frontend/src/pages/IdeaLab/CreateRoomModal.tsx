import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { roomsApi } from '@/api/rooms';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';

const createRoomSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  problem_id: z.string().optional(),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  onSuccess: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onSuccess }) => {
  const { problems, fetchProblems } = useProblemStore();
  const { modal, closeModal, showToast } = useUIStore();

  const isOpen = modal?.type === 'createRoom';

  useEffect(() => {
    if (isOpen) {
      fetchProblems({ status: 'open', limit: 100 });
    }
  }, [isOpen, fetchProblems]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
  });

  const onSubmit = async (data: CreateRoomForm) => {
    try {
      await roomsApi.create({
        name: data.name,
        description: data.description,
        problem_id: data.problem_id || undefined,
      });
      showToast({ type: 'success', message: 'Room created successfully!' });
      reset();
      closeModal();
      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || 'Failed to create room' });
    }
  };

  const handleClose = () => {
    reset();
    closeModal();
  };

  const problemOptions = [
    { value: '', label: 'Link to a problem (optional)' },
    ...problems.map((p) => ({
      value: p.id,
      label: p.title,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Brainstorming Room"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          >
            Create Room
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="Room Name"
          placeholder="Enter room name..."
          {...register('name')}
          error={errors.name?.message}
        />

        <Textarea
          label="Description"
          placeholder="What will you brainstorm about?"
          rows={4}
          {...register('description')}
          error={errors.description?.message}
        />

        <Select
          label="Link to Problem (Optional)"
          options={problemOptions}
          {...register('problem_id')}
        />
      </form>
    </Modal>
  );
};
