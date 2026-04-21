import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { extractTextFromTipTap, EMPTY_TIPTAP_JSON } from '@/utils/tiptap';

interface IdeaFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    title: string;
    description: string;
    summary: string;
  };
  onSubmit: (data: {
    title: string;
    description: string;
    summary: string;
  }) => Promise<void>;
  onCancel: () => void;
  backTo: string;
  backLabel: string;
  isSubmitting?: boolean;
}

export const IdeaForm: React.FC<IdeaFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  backTo,
  backLabel,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  const [title, setTitle] = React.useState(initialData?.title ?? '');
  const [description, setDescription] = React.useState(initialData?.description ?? EMPTY_TIPTAP_JSON);
  const [summary, setSummary] = React.useState(initialData?.summary ?? '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.length < 3) {
      newErrors.title = t('ideas.title_min');
    }
    const textContent = extractTextFromTipTap(description);
    if (!textContent || textContent.length < 10) {
      newErrors.description = t('ideas.desc_min');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ title, description, summary });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-section-heading font-bold text-foreground">
            {isEdit ? t('ideas.edit_idea') : t('ideas.create_title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? t('ideas.edit_desc') : t('ideas.create_desc')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('ideas.title_label')}
              placeholder={t('ideas.title_placeholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />

            <RichTextEditor
              label={t('ideas.desc_label')}
              value={description}
              onChange={setDescription}
              placeholder={t('ideas.desc_placeholder')}
              error={errors.description}
              minHeight="200px"
              jsonMode
            />

            <Textarea
              label={t('ideas.summary_label')}
              placeholder={t('ideas.summary_placeholder')}
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              error={errors.summary}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {isEdit ? t('common.save') : t('ideas.create_idea')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
