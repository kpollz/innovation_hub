import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProblemStore } from '@/stores/problemStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Popover } from '@/components/ui/Popover';
import { Avatar } from '@/components/ui/Avatar';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { PROBLEM_CATEGORIES } from '@/utils/constants';
import { usersApi } from '@/api/users';
import { extractTextFromTipTap, EMPTY_TIPTAP_JSON, jsonStringToContent } from '@/utils/tiptap';
import type { ProblemCategory, ProblemVisibility, User } from '@/types';

const createProblemSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().max(200, 'Summary must be at most 200 characters').optional().or(z.literal('')),
  content: z.string().refine((val) => extractTextFromTipTap(val).length >= 20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
});

type CreateProblemForm = z.infer<typeof createProblemSchema>;

export const CreateProblemModal: React.FC = () => {
  const { t } = useTranslation();
  const { createProblem, isLoading } = useProblemStore();
  const { modal, closeModal, showToast } = useUIStore();

  const isOpen = modal?.type === 'createProblem';

  // Privacy state
  const [visibility, setVisibility] = useState<ProblemVisibility>('public');
  const [sharedUserIds, setSharedUserIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      usersApi.list({ limit: 100 }).then((res) => setAllUsers(res.items)).catch(() => {});
    }
  }, [isOpen]);

  const filteredUsers = allUsers.filter(
    (u) =>
      !sharedUserIds.includes(u.id) &&
      (u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ?? false))
  );

  const addSharedUser = (userId: string) => {
    setSharedUserIds((prev) => [...prev, userId]);
    setUserSearch('');
  };

  const removeSharedUser = (userId: string) => {
    setSharedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProblemForm>({
    resolver: zodResolver(createProblemSchema),
    defaultValues: { content: EMPTY_TIPTAP_JSON },
  });

  const onSubmit = async (data: CreateProblemForm) => {
    try {
      await createProblem({
        title: data.title,
        summary: data.summary || undefined,
        content: jsonStringToContent(data.content) ?? JSON.parse(EMPTY_TIPTAP_JSON),
        category: data.category as ProblemCategory,
        visibility,
        shared_user_ids: sharedUserIds.length > 0 ? sharedUserIds : undefined,
      });
      showToast({ type: 'success', message: t('problems.created_success') });
      reset();
      setVisibility('public');
      setSharedUserIds([]);
      setUserSearch('');
      closeModal();
    } catch {
      showToast({ type: 'error', message: t('problems.create_error') });
    }
  };

  const handleClose = () => {
    reset();
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('problems.create_title')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isLoading}
          >
            {t('problems.create_problem')}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label={t('problems.title_label')}
          placeholder={t('problems.title_placeholder')}
          {...register('title')}
          error={errors.title?.message}
        />

        <Input
          label={t('problems.summary_label')}
          placeholder={t('problems.summary_placeholder')}
          {...register('summary')}
          error={errors.summary?.message}
        />

        <Select
          label={t('problems.category_label')}
          options={[{ value: '', label: t('problems.select_category') }, ...PROBLEM_CATEGORIES]}
          {...register('category')}
          error={errors.category?.message}
        />

        <RichTextEditor
          label={t('problems.description_label')}
          value={watch('content')}
          onChange={(html) => setValue('content', html, { shouldValidate: true })}
          placeholder={t('problems.description_placeholder')}
          error={errors.content?.message}
          minHeight="200px"
          jsonMode
        />

        {/* Privacy / Visibility */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('problems.visibility_label', 'Visibility')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={() => { setVisibility('public'); setSharedUserIds([]); }}
                className="text-blue-600"
              />
              <span className="text-sm">{t('problems.visibility_public', '🌐 Public')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
                className="text-blue-600"
              />
              <span className="text-sm">{t('problems.visibility_private', '🔒 Private')}</span>
            </label>
          </div>
        </div>

        {/* Shared Users (only when private) */}
        {visibility === 'private' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('problems.share_with_label', 'Share with specific users')}
            </label>

            {/* Selected users chips */}
            {sharedUserIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sharedUserIds.map((uid) => {
                  const user = allUsers.find((u) => u.id === uid);
                  return (
                    <span
                      key={uid}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                    >
                      {user?.full_name || user?.username || uid}
                      <button
                        type="button"
                        onClick={() => removeSharedUser(uid)}
                        className="ml-1 text-blue-600 dark:text-blue-300 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search and add users */}
            <div ref={userSearchRef}>
              <Input
                placeholder={t('problems.search_users_placeholder', 'Search users to share with...')}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onFocus={() => setShowUserDropdown(true)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
              />
              <Popover
                triggerRef={userSearchRef}
                open={showUserDropdown && filteredUsers.length > 0}
                onClose={() => setShowUserDropdown(false)}
                matchWidth
                className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { addSharedUser(user.id); setShowUserDropdown(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                  >
                    <Avatar src={user.avatar_url} name={user.full_name || user.username} size="sm" />
                    <span className="font-medium">{user.full_name || user.username}</span>
                    {user.full_name && <span className="text-gray-400 text-xs">@{user.username}</span>}
                  </button>
                ))}
              </Popover>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
