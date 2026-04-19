import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { DatePicker } from '@/components/ui/DatePicker';
import { eventsApi } from '@/api/events';
import { EMPTY_TIPTAP_JSON } from '@/utils/tiptap';
import type { IntroductionType } from '@/types';

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  onSuccess?: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { modal, closeModal, showToast } = useUIStore();
  const isOpen = modal?.type === 'createEvent';

  const [introductionType, setIntroductionType] = useState<IntroductionType>('editor');
  const [description, setDescription] = useState(EMPTY_TIPTAP_JSON);
  const [embedUrl, setEmbedUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
  });

  const handleClose = () => {
    reset();
    setIntroductionType('editor');
    setDescription(EMPTY_TIPTAP_JSON);
    setEmbedUrl('');
    setStartDate('');
    setEndDate('');
    closeModal();
  };

  const onSubmit = async (data: CreateEventForm) => {
    if (introductionType === 'embed' && !embedUrl.trim()) {
      showToast({ type: 'error', message: t('events.create.embed_url_required') });
      return;
    }

    if (introductionType === 'embed' && !/^https?:\/\/\S+$/.test(embedUrl.trim())) {
      showToast({ type: 'error', message: t('events.create.embed_url_invalid') });
      return;
    }

    if (endDate && startDate && endDate < startDate) {
      showToast({ type: 'error', message: t('events.create.end_date_before_start') });
      return;
    }

    setLoading(true);
    try {
      await eventsApi.create({
        title: data.title,
        description: introductionType === 'editor' ? description : undefined,
        introduction_type: introductionType,
        embed_url: introductionType === 'embed' ? embedUrl.trim() : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      showToast({ type: 'success', message: t('events.create.success') });
      handleClose();
      onSuccess?.();
    } catch {
      showToast({ type: 'error', message: t('events.create.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('events.create.modal_title')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={loading}>
            {t('events.create.submit')}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label={t('events.create.title_label')}
          placeholder={t('events.create.title_placeholder')}
          {...register('title')}
          error={errors.title?.message}
        />

        {/* Introduction Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('events.create.introduction_type_label')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="introductionType"
                value="editor"
                checked={introductionType === 'editor'}
                onChange={() => setIntroductionType('editor')}
                className="text-primary-600"
              />
              <span className="text-sm">{t('events.create.type_editor')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="introductionType"
                value="embed"
                checked={introductionType === 'embed'}
                onChange={() => setIntroductionType('embed')}
                className="text-primary-600"
              />
              <span className="text-sm">{t('events.create.type_embed')}</span>
            </label>
          </div>
        </div>

        {/* Editor or Embed URL */}
        {introductionType === 'editor' ? (
          <RichTextEditor
            label={t('events.create.description_label')}
            value={description}
            onChange={setDescription}
            placeholder={t('events.create.description_placeholder')}
            minHeight="200px"
            jsonMode
          />
        ) : (
          <Input
            label={t('events.create.embed_url_label')}
            placeholder={t('events.create.embed_url_placeholder')}
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
          />
        )}

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('events.create.start_date_label')}
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder={t('events.create.date_placeholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('events.create.end_date_label')}
            </label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder={t('events.create.date_placeholder')}
              min={startDate || undefined}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
