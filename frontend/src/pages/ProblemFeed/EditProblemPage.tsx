import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { problemsApi } from '@/api/problems';
import { contentToJsonString, jsonStringToContent } from '@/utils/tiptap';
import { ProblemForm } from './ProblemForm';
import type { Problem, ProblemCategory, ProblemVisibility } from '@/types';

export const EditProblemPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    problemsApi.getById(id)
      .then((data) => setProblem(data))
      .catch(() => {
        showToast({ type: 'error', message: t('problems.update_error') });
        navigate('/problems');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!problem) return null;

  const handleSubmit = async (data: {
    title: string;
    summary: string;
    category: ProblemCategory;
    content: string;
    visibility: ProblemVisibility;
    sharedUserIds: string[];
  }) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await problemsApi.update(id, {
        title: data.title,
        summary: data.summary.trim() || undefined,
        content: jsonStringToContent(data.content),
        category: data.category,
        visibility: data.visibility,
        shared_user_ids: data.visibility === 'private' ? data.sharedUserIds : undefined,
      });
      showToast({ type: 'success', message: t('problems.updated_success') });
      navigate(`/problems/${id}`);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const message = typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw.map((e: { msg?: string }) => e.msg).join('; ')
          : t('problems.update_error');
      showToast({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProblemForm
      mode="edit"
      initialData={{
        title: problem.title,
        summary: problem.summary || '',
        category: problem.category,
        content: contentToJsonString(problem.content),
        visibility: (problem as any).visibility || 'public',
        sharedUserIds: (problem as any).shared_user_ids || [],
      }}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/problems/${id}`)}
      backTo={`/problems/${id}`}
      backLabel={t('problems.back_to_problems')}
      isSubmitting={isSubmitting}
    />
  );
};
