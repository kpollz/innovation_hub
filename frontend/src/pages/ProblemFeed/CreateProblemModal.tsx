import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PROBLEM_CATEGORIES } from '@/utils/constants';
import type { ProblemCategory } from '@/types';

const createProblemSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().max(200, 'Summary must be at most 200 characters').optional().or(z.literal('')),
  content: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
});

type CreateProblemForm = z.infer<typeof createProblemSchema>;

export const CreateProblemModal: React.FC = () => {
  const { createProblem, isLoading } = useProblemStore();
  const { modal, closeModal, showToast } = useUIStore();

  const isOpen = modal?.type === 'createProblem';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProblemForm>({
    resolver: zodResolver(createProblemSchema),
  });

  const onSubmit = async (data: CreateProblemForm) => {
    try {
      await createProblem({
        title: data.title,
        summary: data.summary || undefined,
        content: data.content,
        category: data.category as ProblemCategory,
      });
      showToast({ type: 'success', message: 'Problem created successfully!' });
      reset();
      closeModal();
    } catch {
      showToast({ type: 'error', message: 'Failed to create problem' });
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
      title="Share a Problem"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isLoading}
          >
            Create Problem
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="Title"
          placeholder="What's the problem?"
          {...register('title')}
          error={errors.title?.message}
        />

        <Input
          label="Summary (Optional)"
          placeholder="Brief summary of the problem (max 200 characters)"
          {...register('summary')}
          error={errors.summary?.message}
        />

        <Select
          label="Category"
          options={[{ value: '', label: 'Select a category' }, ...PROBLEM_CATEGORIES]}
          {...register('category')}
          error={errors.category?.message}
        />

        <Textarea
          label="Description"
          placeholder="Describe the problem in detail..."
          rows={5}
          {...register('content')}
          error={errors.content?.message}
        />
      </form>
    </Modal>
  );
};
