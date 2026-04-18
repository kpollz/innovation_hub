import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '@/api/events';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { EventObject, EventIdeaObject, TipTapContent } from '@/types';

interface IdeaFormModalProps {
  event: EventObject;
  idea: EventIdeaObject | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_JSON = '{"type":"doc","content":[{"type":"paragraph"}]}';

/** Convert TipTapContent to JSON string for the editor */
function contentToJsonString(content: TipTapContent | null | undefined): string {
  if (!content) return EMPTY_JSON;
  if (typeof content === 'string') {
    try { JSON.parse(content); return content; } catch { return content; }
  }
  return JSON.stringify(content);
}

/** Check if a TipTap JSON doc is effectively empty (no text, no images, no non-text nodes) */
function isEmptyDoc(doc: Record<string, unknown>): boolean {
  const content = doc.content as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(content) || content.length === 0) return true;
  return content.every(node => {
    if (node.type !== 'paragraph') return false;
    const inner = node.content as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(inner) || inner.length === 0) return true;
    return inner.every((n: Record<string, unknown>) =>
      n.type === 'text' && !(n.text as string || '').trim()
    );
  });
}

/** Convert editor JSON string to TipTapContent or undefined (if empty) */
function jsonStringToContent(json: string): TipTapContent | undefined {
  if (!json) return undefined;
  try {
    const parsed = JSON.parse(json);
    if (isEmptyDoc(parsed)) return undefined;
    return parsed;
  } catch {
    const stripped = json.replace(/<[^>]*>/g, '').trim();
    return stripped || undefined;
  }
}

export const IdeaFormModal: React.FC<IdeaFormModalProps> = ({
  event, idea, isOpen, onClose, onSaved,
}) => {
  const { t } = useTranslation();
  const isEditing = !!idea;

  const [title, setTitle] = useState(() => idea?.title || '');
  const [solution, setSolution] = useState(() => contentToJsonString(idea?.solution));
  const [userProblem, setUserProblem] = useState(() => contentToJsonString(idea?.user_problem));
  const [userScenarios, setUserScenarios] = useState(() => contentToJsonString(idea?.user_scenarios));
  const [userExpectation, setUserExpectation] = useState(() => contentToJsonString(idea?.user_expectation));
  const [research, setResearch] = useState(() => contentToJsonString(idea?.research));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (idea) {
        setTitle(idea.title);
        setSolution(contentToJsonString(idea.solution));
        setUserProblem(contentToJsonString(idea.user_problem));
        setUserScenarios(contentToJsonString(idea.user_scenarios));
        setUserExpectation(contentToJsonString(idea.user_expectation));
        setResearch(contentToJsonString(idea.research));
      } else {
        setTitle('');
        setSolution(EMPTY_JSON);
        setUserProblem(EMPTY_JSON);
        setUserScenarios(EMPTY_JSON);
        setUserExpectation(EMPTY_JSON);
        setResearch(EMPTY_JSON);
      }
      setError('');
    }
  }, [isOpen, idea]);

  const handleSubmit = async () => {
    const solutionContent = jsonStringToContent(solution);
    if (!title.trim() || !solutionContent) {
      setError(t('events.ideas.form.required_fields'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isEditing && idea) {
        await eventsApi.updateIdea(event.id, idea.id, {
          title: title.trim(),
          user_problem: jsonStringToContent(userProblem),
          user_scenarios: jsonStringToContent(userScenarios),
          user_expectation: jsonStringToContent(userExpectation),
          research: jsonStringToContent(research),
          solution: solutionContent,
        });
      } else {
        await eventsApi.createIdea(event.id, {
          title: title.trim(),
          user_problem: jsonStringToContent(userProblem),
          user_scenarios: jsonStringToContent(userScenarios),
          user_expectation: jsonStringToContent(userExpectation),
          research: jsonStringToContent(research),
          solution: solutionContent,
          source_type: 'manual',
        });
      }
      onSaved();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { detail?: unknown } } })?.response?.data;
      if (Array.isArray(resp?.detail)) {
        // FastAPI 422 validation errors
        const messages = (resp.detail as Array<{ msg: string }>).map(e => e.msg).join(', ');
        setError(messages);
      } else {
        const msg = typeof resp?.detail === 'string' ? resp.detail : t('events.ideas.form.error');
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={submitting}>
        {t('common.cancel')}
      </Button>
      <Button isLoading={submitting} onClick={handleSubmit}>
        {isEditing ? t('common.save') : t('events.ideas.form.submit')}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('events.ideas.form.edit_title') : t('events.ideas.form.create_title')}
      size="xl"
      footer={footer}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('events.ideas.fields.title')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('events.ideas.fields.title_placeholder')}
            maxLength={255}
          />
        </div>

        <RichTextEditor
          label={t('events.ideas.fields.user_problem')}
          value={userProblem}
          onChange={setUserProblem}
          placeholder={t('events.ideas.fields.user_problem_placeholder')}
          minHeight="120px"
          jsonMode
        />
        <RichTextEditor
          label={t('events.ideas.fields.user_scenarios')}
          value={userScenarios}
          onChange={setUserScenarios}
          placeholder={t('events.ideas.fields.user_scenarios_placeholder')}
          minHeight="120px"
          jsonMode
        />
        <RichTextEditor
          label={t('events.ideas.fields.user_expectation')}
          value={userExpectation}
          onChange={setUserExpectation}
          placeholder={t('events.ideas.fields.user_expectation_placeholder')}
          minHeight="120px"
          jsonMode
        />
        <RichTextEditor
          label={t('events.ideas.fields.research')}
          value={research}
          onChange={setResearch}
          placeholder={t('events.ideas.fields.research_placeholder')}
          minHeight="120px"
          jsonMode
        />
        <RichTextEditor
          label={`${t('events.ideas.fields.solution')} *`}
          value={solution}
          onChange={setSolution}
          placeholder={t('events.ideas.fields.solution_placeholder')}
          minHeight="150px"
          jsonMode
        />
      </div>
    </Modal>
  );
};
