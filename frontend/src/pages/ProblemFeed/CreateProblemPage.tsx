import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { PROBLEM_CATEGORIES } from '@/utils/constants';
import type { ProblemCategory } from '@/types';

export const CreateProblemPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createProblem, isLoading } = useProblemStore();
  const { showToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    if (summary.length > 200) {
      newErrors.summary = 'Summary must be at most 200 characters';
    }
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!textContent || textContent.length < 20) {
      newErrors.content = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createProblem({
        title,
        summary: summary || undefined,
        content,
        category: category as ProblemCategory,
      });
      showToast({ type: 'success', message: t('problems.created_success') });
      navigate('/problems');
    } catch {
      showToast({ type: 'error', message: t('problems.create_error') });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/problems" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← {t('problems.back_to_problems')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('problems.create_title')}</h1>
        <p className="text-gray-600 mt-1">{t('problems.create_desc')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('problems.problem_details')}</h2>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('problems.title_label')} <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder={t('problems.title_placeholder_alt')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('problems.summary_label')}
              </label>
              <Input
                placeholder={t('problems.summary_placeholder')}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                error={errors.summary}
              />
              <p className="text-xs text-gray-500 mt-1">{summary.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('problems.category_label')} <span className="text-red-500">*</span>
              </label>
              <Select
                options={[{ value: '', label: t('problems.select_category') }, ...PROBLEM_CATEGORIES]}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                error={errors.category}
              />
            </div>

            <RichTextEditor
              label={t('problems.description_label') + ' *'}
              value={content}
              onChange={setContent}
              placeholder={t('problems.description_placeholder')}
              error={errors.content}
              minHeight="250px"
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/problems')}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t('problems.create_problem')}
          </Button>
        </div>
      </form>
    </div>
  );
};
