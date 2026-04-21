import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { jsonStringToContent } from '@/utils/tiptap';
import { ProblemForm } from './ProblemForm';
import type { ProblemCategory, ProblemVisibility } from '@/types';

export const CreateProblemPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createProblem, isLoading } = useProblemStore();
  const { showToast } = useUIStore();

  const handleSubmit = async (data: {
    title: string;
    summary: string;
    category: ProblemCategory;
    content: string;
    visibility: ProblemVisibility;
    sharedUserIds: string[];
  }) => {
    try {
      await createProblem({
        title: data.title,
        summary: data.summary || undefined,
        content: jsonStringToContent(data.content) ?? JSON.parse('{"type":"doc","content":[{"type":"paragraph"}]}'),
        category: data.category,
        visibility: data.visibility,
        shared_user_ids: data.visibility === 'private' ? data.sharedUserIds : undefined,
      });
      showToast({ type: 'success', message: t('problems.created_success') });
      navigate('/problems');
    } catch {
      showToast({ type: 'error', message: t('problems.create_error') });
    }
  };

  return (
    <ProblemForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => navigate('/problems')}
      backTo="/problems"
      backLabel={t('problems.back_to_problems')}
      isSubmitting={isLoading}
    />
  );
};
