import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ideasApi } from '@/api/ideas';
import { useUIStore } from '@/stores/uiStore';
import { jsonStringToContent, EMPTY_TIPTAP_JSON } from '@/utils/tiptap';
import { IdeaForm } from './IdeaForm';

export const CreateIdeaPage: React.FC = () => {
  const { t } = useTranslation();
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: { title: string; description: string; summary: string }) => {
    if (!roomId) return;
    setIsSubmitting(true);
    try {
      const idea = await ideasApi.create({
        room_id: roomId,
        title: data.title,
        description: jsonStringToContent(data.description) ?? JSON.parse(EMPTY_TIPTAP_JSON),
        summary: data.summary || undefined,
      });
      showToast({ type: 'success', message: t('ideas.created_success') });
      navigate(`/ideas/${idea.id}`);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const detail = Array.isArray(raw) ? raw.map((e: { msg?: string }) => e.msg).join(', ') : typeof raw === 'string' ? raw : t('ideas.create_error');
      showToast({ type: 'error', message: detail });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IdeaForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/rooms/${roomId}`)}
      backTo={`/rooms/${roomId}`}
      backLabel={t('ideas.back_to_room')}
      isSubmitting={isSubmitting}
    />
  );
};
