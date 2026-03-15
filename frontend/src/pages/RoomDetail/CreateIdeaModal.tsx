import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { roomsApi } from '@/api/rooms';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';

const createIdeaSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  outcome: z.string().min(5, 'Expected outcome must be at least 5 characters'),
});

type CreateIdeaForm = z.infer<typeof createIdeaSchema>;

interface CreateIdeaModalProps {
  roomId: string;
  onSuccess: () => void;
}

export const CreateIdeaModal: React.FC<CreateIdeaModalProps> = ({ roomId, onSuccess }) => {
  const { modal, closeModal, showToast } = useUIStore();

  const isOpen = modal?.type === 'createIdea';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateIdeaForm>({
    resolver: zodResolver(createIdeaSchema),
  });

  const onSubmit = async (data: CreateIdeaForm) => {
    try {
      await roomsApi.createIdea(roomId, data);
      showToast({ type: 'success', message: 'Idea created successfully!' });
      reset();
      closeModal();
      onSuccess();
    } catch {
      showToast({ type: 'error', message: 'Failed to create idea' });
    }
  };

  const handleClose = () => {
    reset();
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Idea"
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
            Create Idea
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="Idea Title"
          placeholder="What is your idea?"
          {...register('title')}
          error={errors.title?.message}
        />

        <Textarea
          label="Description"
          placeholder="Describe your solution in detail..."
          rows={4}
          {...register('description')}
          error={errors.description?.message}
        />

        <Textarea
          label="Expected Outcome"
          placeholder="What benefits will this idea bring?"
          rows={3}
          {...register('outcome')}
          error={errors.outcome?.message}
        />
      </form>
    </Modal>
  );
};
