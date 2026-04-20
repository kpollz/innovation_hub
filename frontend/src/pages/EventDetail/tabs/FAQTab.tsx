import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Loader2
} from 'lucide-react';
import { eventsApi } from '@/api/events';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TipTapRenderer } from '@/components/ui/TipTapRenderer';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { extractTextFromTipTap, contentToJsonString, jsonStringToContent, EMPTY_TIPTAP_JSON } from '@/utils/tiptap';
import type { EventObject, EventTeamObject, FAQObject, TipTapContent } from '@/types';

interface FAQTabProps {
  event: EventObject;
  myTeam?: EventTeamObject | null;
}

const hasContent = (content: TipTapContent | null | undefined): boolean => {
  return !!extractTextFromTipTap(content);
};

export const FAQTab: React.FC<FAQTabProps> = ({ event, myTeam }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isTeamLead = myTeam?.leader_id === user?.id;

  const [faqs, setFaqs] = useState<FAQObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState(EMPTY_TIPTAP_JSON);
  const [formSaving, setFormSaving] = useState(false);

  const canCreate = isAdmin || isTeamLead;

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getFAQs(event.id);
      setFaqs(data);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const handleCreate = async () => {
    if (!formQuestion.trim()) return;
    setFormSaving(true);
    try {
      await eventsApi.createFAQ(event.id, {
        question: formQuestion.trim(),
        answer: hasContent(formAnswer) ? jsonStringToContent(formAnswer) : undefined,
      });
      setShowCreate(false);
      setFormQuestion('');
      setFormAnswer(EMPTY_TIPTAP_JSON);
      await fetchFaqs();
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.faq.create_error'));
    } finally {
      setFormSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editId || !formQuestion.trim()) return;
    setFormSaving(true);
    try {
      await eventsApi.updateFAQ(event.id, editId, {
        question: formQuestion.trim(),
        answer: hasContent(formAnswer) ? jsonStringToContent(formAnswer) : undefined,
      });
      setEditId(null);
      setFormQuestion('');
      setFormAnswer(EMPTY_TIPTAP_JSON);
      await fetchFaqs();
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.faq.update_error'));
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    try {
      await eventsApi.deleteFAQ(event.id, faqId);
      setShowDelete(null);
      await fetchFaqs();
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.faq.delete_error'));
    }
  };

  const openEdit = (faq: FAQObject) => {
    setEditId(faq.id);
    setFormQuestion(faq.question);
    setFormAnswer(contentToJsonString(faq.answer));
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditId(null);
    setFormQuestion('');
    setFormAnswer(EMPTY_TIPTAP_JSON);
  };

  const canEditFaq = (faq: FAQObject) => isAdmin || faq.created_by === user?.id;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-feature-title font-semibold text-gray-900 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-500" />
          {t('events.faq.title', { count: faqs.length })}
        </h2>
        {canCreate && (
          <button
            onClick={() => { setFormQuestion(''); setFormAnswer(EMPTY_TIPTAP_JSON); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            {t('events.faq.create')}
          </button>
        )}
      </div>

      {/* Empty state */}
      {faqs.length === 0 && (
        <div className="text-center py-16">
          <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600">{t('events.faq.no_faqs')}</h3>
          <p className="text-gray-400 mt-1">{t('events.faq.no_faqs_desc')}</p>
        </div>
      )}

      {/* Accordion List */}
      {faqs.map((faq, idx) => {
        const isExpanded = expandedId === faq.id;
        const isEditing = editId === faq.id;
        const canEdit = canEditFaq(faq);

        return (
          <div key={faq.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isEditing ? (
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder={t('events.faq.question_placeholder')}
                />
                <RichTextEditor
                  value={formAnswer}
                  onChange={setFormAnswer}
                  placeholder={t('events.faq.answer_placeholder')}
                  minHeight="120px"
                  jsonMode
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={closeForm}>
                    {t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={handleEdit} disabled={!formQuestion.trim() || formSaving}>
                    {formSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {canEdit && (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(faq)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title={t('events.faq.edit')}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDelete(faq.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={t('events.faq.delete')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="ml-9">
                      {hasContent(faq.answer) ? (
                        <TipTapRenderer content={faq.answer} />
                      ) : (
                        <p className="text-sm text-gray-400 italic">{t('events.faq.no_answer')}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Create FAQ Modal */}
      <Modal
        isOpen={showCreate}
        onClose={closeForm}
        title={t('events.faq.create_title')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!formQuestion.trim() || formSaving}>
              {formSaving ? t('common.creating') : t('events.faq.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('events.faq.question_label')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formQuestion}
              onChange={e => setFormQuestion(e.target.value)}
              placeholder={t('events.faq.question_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              maxLength={2000}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('events.faq.answer_label')}
            </label>
            <RichTextEditor
              value={formAnswer}
              onChange={setFormAnswer}
              placeholder={t('events.faq.answer_placeholder')}
              minHeight="150px"
              jsonMode
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={t('events.faq.delete_title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => showDelete && handleDelete(showDelete)}>
              {t('events.faq.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">{t('events.faq.delete_confirm')}</p>
      </Modal>
    </div>
  );
};
