import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { ideasApi } from '@/api/ideas';
import { contentToJsonString, jsonStringToContent } from '@/utils/tiptap';
import { IdeaForm } from '../RoomDetail/IdeaForm';
import type { Idea } from '@/types';

export const EditIdeaPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    ideasApi.getById(id)
      .then((data) => setIdea(data))
      .catch(() => {
        showToast({ type: 'error', message: t('ideas.load_error') });
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!idea) return null;

  const handleSubmit = async (data: { title: string; description: string; summary: string }) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await ideasApi.update(id, {
        title: data.title,
        description: jsonStringToContent(data.description),
        summary: data.summary.trim() || undefined,
      });
      showToast({ type: 'success', message: t('ideas.updated_success') });
      navigate(`/ideas/${id}`);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const detail = Array.isArray(raw) ? raw.map((e: { msg?: string }) => e.msg).join(', ') : typeof raw === 'string' ? raw : t('ideas.update_error');
      showToast({ type: 'error', message: detail });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IdeaForm
      mode="edit"
      initialData={{
        title: idea.title,
        description: contentToJsonString(idea.description),
        summary: idea.summary || '',
      }}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/ideas/${id}`)}
      backTo={`/ideas/${id}`}
      backLabel={t('ideas.back_to_room')}
      isSubmitting={isSubmitting}
    />
  );
};
