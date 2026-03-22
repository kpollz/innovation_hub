import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ideasApi } from '@/api/ideas';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const createIdeaSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().refine((val) => stripHtml(val).length >= 10, 'Description must be at least 10 characters'),
  summary: z.string().optional(),
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateIdeaForm>({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: { description: '' },
  });

  const onSubmit = async (data: CreateIdeaForm) => {
    try {
      await ideasApi.create({
        room_id: roomId,
        title: data.title,
        description: data.description,
        summary: data.summary || undefined,
      });
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

        <RichTextEditor
          label="Description"
          value={watch('description')}
          onChange={(html) => setValue('description', html, { shouldValidate: true })}
          placeholder="Describe your solution in detail..."
          error={errors.description?.message}
          minHeight="150px"
        />

        <Textarea
          label="Summary (optional)"
          placeholder="Brief summary of your idea (shown in listings)"
          rows={3}
          {...register('summary')}
          error={errors.summary?.message}
        />
      </form>
    </Modal>
  );
};
