import React, { useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Popover } from '@/components/ui/Popover';
import { PROBLEM_CATEGORIES } from '@/utils/constants';
import { usersApi } from '@/api/users';
import { extractTextFromTipTap, EMPTY_TIPTAP_JSON, jsonStringToContent } from '@/utils/tiptap';
import type { ProblemCategory, ProblemVisibility } from '@/types';

export const CreateProblemPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createProblem, isLoading } = useProblemStore();
  const { showToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState(EMPTY_TIPTAP_JSON);
  const [visibility, setVisibility] = useState<ProblemVisibility>('public');
  const [sharedUserIds, setSharedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUserSearch = useCallback(async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const result = await usersApi.list({ search: query, limit: 10 });
      setUserSearchResults(result.items.map(u => ({ id: u.id, full_name: u.full_name || '', email: u.email || '' })));
    } catch {
      setUserSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addSharedUser = (userId: string) => {
    if (!sharedUserIds.includes(userId)) {
      setSharedUserIds([...sharedUserIds, userId]);
    }
    setUserSearch('');
    setUserSearchResults([]);
  };

  const removeSharedUser = (userId: string) => {
    setSharedUserIds(sharedUserIds.filter(id => id !== userId));
  };

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
    const textContent = extractTextFromTipTap(content);
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
        content: jsonStringToContent(content) ?? JSON.parse(EMPTY_TIPTAP_JSON),
        category: category as ProblemCategory,
        visibility,
        shared_user_ids: visibility === 'private' ? sharedUserIds : undefined,
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
              jsonMode
            />

            {/* Privacy / Visibility Section */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('problems.visibility_label')}
              </label>
              <div className="flex gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    visibility === 'public'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>🌐</span>
                  <span>{t('problems.visibility_public')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    visibility === 'private'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>🔒</span>
                  <span>{t('problems.visibility_private')}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {visibility === 'public'
                  ? t('problems.visibility_public_desc')
                  : t('problems.visibility_private_desc')}
              </p>

              {/* Shared users section - only visible when private */}
              {visibility === 'private' && (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('problems.share_with_label')}
                  </label>

                  {/* Selected shared users as chips */}
                  {sharedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sharedUserIds.map((userId) => {
                        const user = userSearchResults.find(u => u.id === userId);
                        return (
                          <span
                            key={userId}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {user?.full_name || userId.slice(0, 8)}
                            <button
                              type="button"
                              onClick={() => removeSharedUser(userId)}
                              className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* User search input */}
                  <div ref={userSearchRef}>
                    <div className="relative">
                      <Input
                        placeholder={t('problems.search_users_placeholder')}
                        value={userSearch}
                        onChange={(e) => handleUserSearch(e.target.value)}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                    <Popover
                      triggerRef={userSearchRef}
                      open={userSearchResults.length > 0}
                      onClose={() => setUserSearchResults([])}
                      matchWidth
                      className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {userSearchResults
                        .filter(u => !sharedUserIds.includes(u.id))
                        .map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addSharedUser(user.id)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                          >
                            <span className="font-medium">{user.full_name}</span>
                            <span className="text-gray-500 ml-2">{user.email}</span>
                          </button>
                        ))}
                    </Popover>
                  </div>
                </div>
              )}
            </div>
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