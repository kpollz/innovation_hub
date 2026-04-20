import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '@/api/events';
import { useUIStore } from '@/stores/uiStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { contentToJsonString, jsonStringToContent, EMPTY_TIPTAP_JSON } from '@/utils/tiptap';
import type { EventObject, EventIdeaObject, EventTeamObject } from '@/types';

interface IdeaFormModalProps {
  event: EventObject;
  idea: EventIdeaObject | null;
  myTeam?: EventTeamObject | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  importSource?: { room_id: string; idea_id: string } | null;
}

export const IdeaFormModal: React.FC<IdeaFormModalProps> = ({
  event, idea, myTeam, isOpen, onClose, onSaved, importSource,
}) => {
  const { t } = useTranslation();
  const { showToast } = useUIStore();
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
        setSolution(EMPTY_TIPTAP_JSON);
        setUserProblem(EMPTY_TIPTAP_JSON);
        setUserScenarios(EMPTY_TIPTAP_JSON);
        setUserExpectation(EMPTY_TIPTAP_JSON);
        setResearch(EMPTY_TIPTAP_JSON);
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
      if (importSource) {
        // Import mode: create from room first, then update with form data
        const created = await eventsApi.createIdeaFromRoom(event.id, importSource);
        await eventsApi.updateIdea(event.id, created.id, {
          title: title.trim(),
          user_problem: jsonStringToContent(userProblem),
          user_scenarios: jsonStringToContent(userScenarios),
          user_expectation: jsonStringToContent(userExpectation),
          research: jsonStringToContent(research),
          solution: solutionContent,
        });
      } else if (isEditing && idea) {
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
      showToast({
        type: 'success',
        message: importSource
          ? t('events.ideas.form.submit_success')
          : isEditing ? t('events.ideas.form.update_success') : t('events.ideas.form.submit_success'),
      });
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
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {!isEditing && myTeam && (
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              {t('events.ideas.fields.inventor')}
            </label>
            <div className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-muted-foreground">
              {myTeam.name}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
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
