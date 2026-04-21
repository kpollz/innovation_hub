import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Popover } from '@/components/ui/Popover';
import { Avatar } from '@/components/ui/Avatar';
import { PROBLEM_CATEGORIES } from '@/utils/constants';
import { usersApi } from '@/api/users';
import { extractTextFromTipTap, EMPTY_TIPTAP_JSON } from '@/utils/tiptap';
import type { ProblemCategory, ProblemVisibility, User } from '@/types';

interface ProblemFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    title: string;
    summary: string;
    category: string;
    content: string;
    visibility: ProblemVisibility;
    sharedUserIds: string[];
  };
  onSubmit: (data: {
    title: string;
    summary: string;
    category: ProblemCategory;
    content: string;
    visibility: ProblemVisibility;
    sharedUserIds: string[];
  }) => Promise<void>;
  onCancel: () => void;
  backTo: string;
  backLabel: string;
  isSubmitting?: boolean;
}

export const ProblemForm: React.FC<ProblemFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  backTo,
  backLabel,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [content, setContent] = useState(initialData?.content ?? EMPTY_TIPTAP_JSON);
  const [visibility, setVisibility] = useState<ProblemVisibility>(initialData?.visibility ?? 'public');
  const [sharedUserIds, setSharedUserIds] = useState<string[]>(initialData?.sharedUserIds ?? []);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    usersApi.list({ limit: 100 }).then((res) => setAllUsers(res.items)).catch(() => {});
  }, []);

  const filteredUsers = allUsers.filter(
    (u) =>
      !sharedUserIds.includes(u.id) &&
      (u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ?? false))
  );

  const addSharedUser = (userId: string) => {
    if (!sharedUserIds.includes(userId)) {
      setSharedUserIds([...sharedUserIds, userId]);
    }
    setUserSearch('');
    setShowUserDropdown(false);
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

    await onSubmit({
      title,
      summary,
      category: category as ProblemCategory,
      content,
      visibility,
      sharedUserIds: visibility === 'private' ? sharedUserIds : [],
    });
  };

  const isEdit = mode === 'edit';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={backTo} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <h1 className="text-section-heading font-bold text-foreground">
          {isEdit ? t('problems.edit_problem') : t('problems.create_title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEdit ? t('problems.edit_desc') : t('problems.create_desc')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="border-b border-border">
            <h2 className="text-feature-title font-semibold text-foreground">{t('problems.problem_details')}</h2>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">
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
              <label className="block text-sm font-medium text-foreground/70 mb-1">
                {t('problems.summary_label')}
              </label>
              <Input
                placeholder={t('problems.summary_placeholder')}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                error={errors.summary}
              />
              <p className="text-xs text-muted-foreground mt-1">{summary.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">
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
            <div className="border-t border-border pt-6">
              <label className="block text-sm font-medium text-foreground/70 mb-3">
                {t('problems.visibility_label')}
              </label>
              <div className="flex gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    visibility === 'public'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-muted-foreground hover:bg-secondary'
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
                      : 'border-gray-300 bg-white text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <span>🔒</span>
                  <span>{t('problems.visibility_private')}</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {visibility === 'public'
                  ? t('problems.visibility_public_desc')
                  : t('problems.visibility_private_desc')}
              </p>

              {/* Shared users section - only visible when private */}
              {visibility === 'private' && (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-foreground/70">
                    {t('problems.share_with_label')}
                  </label>

                  {/* Selected shared users as chips */}
                  {sharedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sharedUserIds.map((userId) => {
                        const user = allUsers.find(u => u.id === userId);
                        return (
                          <span
                            key={userId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                          >
                            <Avatar src={user?.avatar_url} name={user?.full_name || user?.username || ''} size="sm" />
                            {user?.full_name || user?.username || userId.slice(0, 8)}
                            <button
                              type="button"
                              onClick={() => removeSharedUser(userId)}
                              className="ml-1 text-primary-600 hover:text-primary-900"
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
                    <Input
                      placeholder={t('problems.search_users_placeholder')}
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                      onFocus={() => setShowUserDropdown(true)}
                    />
                    <Popover
                      triggerRef={userSearchRef}
                      open={showUserDropdown && filteredUsers.length > 0}
                      onClose={() => setShowUserDropdown(false)}
                      matchWidth
                      className="bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addSharedUser(user.id)}
                          className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex items-center gap-2"
                        >
                          <Avatar src={user.avatar_url} name={user.full_name || user.username} size="sm" />
                          <span className="font-medium">{user.full_name || user.username}</span>
                          {user.full_name && <span className="text-muted-foreground text-xs">@{user.username}</span>}
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
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? t('common.save') : t('problems.create_problem')}
          </Button>
        </div>
      </form>
    </div>
  );
};
