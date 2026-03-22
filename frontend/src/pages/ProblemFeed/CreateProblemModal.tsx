import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { PROBLEM_CATEGORIES } from '@/utils/constants';
import type { ProblemCategory } from '@/types';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const createProblemSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().max(200, 'Summary must be at most 200 characters').optional().or(z.literal('')),
  content: z.string().refine((val) => stripHtml(val).length >= 20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
});

type CreateProblemForm = z.infer<typeof createProblemSchema>;

export const CreateProblemModal: React.FC = () => {
  const { t } = useTranslation();
  const { createProblem, isLoading } = useProblemStore();
  const { modal, closeModal, showToast } = useUIStore();

  const isOpen = modal?.type === 'createProblem';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProblemForm>({
    resolver: zodResolver(createProblemSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: CreateProblemForm) => {
    try {
      await createProblem({
        title: data.title,
        summary: data.summary || undefined,
        content: data.content,
        category: data.category as ProblemCategory,
      });
      showToast({ type: 'success', message: t('problems.created_success') });
      reset();
      closeModal();
    } catch {
      showToast({ type: 'error', message: t('problems.create_error') });
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
      title={t('problems.create_title')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isLoading}
          >
            {t('problems.create_problem')}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label={t('problems.title_label')}
          placeholder={t('problems.title_placeholder')}
          {...register('title')}
          error={errors.title?.message}
        />

        <Input
          label={t('problems.summary_label')}
          placeholder={t('problems.summary_placeholder')}
          {...register('summary')}
          error={errors.summary?.message}
        />

        <Select
          label={t('problems.category_label')}
          options={[{ value: '', label: t('problems.select_category') }, ...PROBLEM_CATEGORIES]}
          {...register('category')}
          error={errors.category?.message}
        />

        <RichTextEditor
          label={t('problems.description_label')}
          value={watch('content')}
          onChange={(html) => setValue('content', html, { shouldValidate: true })}
          placeholder={t('problems.description_placeholder')}
          error={errors.content?.message}
          minHeight="200px"
        />
      </form>
    </Modal>
  );
};
