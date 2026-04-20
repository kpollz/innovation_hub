import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { DatePicker } from '@/components/ui/DatePicker';
import { eventsApi } from '@/api/events';
import { contentToJsonString, jsonStringToContent } from '@/utils/tiptap';
import type { EventObject, EventStatus, IntroductionType } from '@/types';

const STATUS_OPTIONS: { value: EventStatus; labelKey: string }[] = [
  { value: 'draft', labelKey: 'events.status_draft' },
  { value: 'active', labelKey: 'events.status_active' },
  { value: 'closed', labelKey: 'events.status_closed' },
];

interface EditEventModalProps {
  event: EventObject;
  onSaved?: () => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({ event, onSaved }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { modal, closeModal, showToast } = useUIStore();
  const isOpen = modal?.type === 'editEvent';

  const [title, setTitle] = useState(event.title);
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [introductionType, setIntroductionType] = useState<IntroductionType>(event.introduction_type || 'editor');
  const [description, setDescription] = useState(() => contentToJsonString(event.description));
  const [embedUrl, setEmbedUrl] = useState(event.embed_url || '');
  const [startDate, setStartDate] = useState(event.start_date || '');
  const [endDate, setEndDate] = useState(event.end_date || '');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    closeModal();
  };

  const onSubmit = async () => {
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
      const fieldsChanged = {
        title,
        description: introductionType === 'editor' ? jsonStringToContent(description) : undefined,
        introduction_type: introductionType,
        embed_url: introductionType === 'embed' ? embedUrl.trim() : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const statusChanged = status !== event.status;

      if (status === 'closed' && event.status !== 'closed') {
        // Update fields first while event is still editable, then close
        await eventsApi.update(event.id, fieldsChanged);
        await eventsApi.closeEvent(event.id);
      } else {
        await eventsApi.update(event.id, {
          ...fieldsChanged,
          status: statusChanged ? status : undefined,
        });
      }

      showToast({ type: 'success', message: t('events.edit.success') });
      onSaved?.();
      closeModal();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('events.edit.error') });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('events.delete.confirm'))) return;
    setLoading(true);
    try {
      await eventsApi.deleteEvent(event.id);
      showToast({ type: 'success', message: t('events.delete.success') });
      handleClose();
      navigate('/events');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('events.delete.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('events.edit.modal_title')}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-auto disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t('events.delete.button')}
          </button>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} isLoading={loading}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label={t('events.create.title_label')}
          placeholder={t('events.create.title_placeholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            {t('events.edit.status_label')}
          </label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  status === opt.value
                    ? opt.value === 'active'
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : opt.value === 'closed'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-muted text-foreground/70 border-gray-300'
                    : 'bg-white text-muted-foreground border-border hover:bg-secondary'
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Introduction Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">
              {t('events.create.start_date_label')}
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder={t('events.create.date_placeholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">
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
