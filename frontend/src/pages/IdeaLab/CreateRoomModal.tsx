import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { roomsApi } from '@/api/rooms';
import { usersApi } from '@/api/users';
import { useProblemStore } from '@/stores/problemStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Popover } from '@/components/ui/Popover';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import type { ProblemVisibility, User } from '@/types';

const createRoomSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  problem_id: z.string().optional(),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  onSuccess: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { problems, fetchProblems } = useProblemStore();
  const { user: currentUser } = useAuthStore();
  const { modal, closeModal, showToast } = useUIStore();
  const [visibility, setVisibility] = useState<ProblemVisibility>('public');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  const isOpen = modal?.type === 'createRoom';

  useEffect(() => {
    if (isOpen) {
      fetchProblems({ status: 'open', limit: 100 });
      usersApi.list({ limit: 100, is_active: true }).then((res) => setAllUsers(res.items)).catch(() => {});
    }
  }, [isOpen, fetchProblems]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
  });

  const onSubmit = async (data: CreateRoomForm) => {
    try {
      await roomsApi.create({
        name: data.name,
        description: data.description,
        problem_id: data.problem_id || undefined,
        visibility,
        shared_user_ids: visibility === 'private' ? selectedUserIds : undefined,
      });
      showToast({ type: 'success', message: t('rooms.created_success') });
      reset();
      closeModal();
      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('rooms.create_error') });
    }
  };

  const handleClose = () => {
    reset();
    setVisibility('public');
    setSelectedUserIds([]);
    setUserSearch('');
    setShowUserDropdown(false);
    closeModal();
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = allUsers.filter(
    (u) => u.id !== currentUser?.id && (u.username.toLowerCase().includes(userSearch.toLowerCase()) || (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()))
  );

  const problemOptions = [
    { value: '', label: t('rooms.link_problem_option') },
    ...problems.map((p) => ({
      value: p.id,
      label: p.title,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('rooms.create_room_title')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          >
            {t('rooms.create_room')}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label={t('rooms.room_name_label')}
          placeholder={t('rooms.room_name_placeholder')}
          {...register('name')}
          error={errors.name?.message}
        />

        <Textarea
          label={t('rooms.desc_label')}
          placeholder={t('rooms.room_desc_placeholder')}
          rows={4}
          {...register('description')}
          error={errors.description?.message}
        />

        <Select
          label={t('rooms.link_problem')}
          options={problemOptions}
          {...register('problem_id')}
        />

        {/* Visibility Toggle */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            {t('rooms.visibility_label')}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                visibility === 'public'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-border text-muted-foreground hover:border-gray-300'
              }`}
            >
              {t('rooms.visibility_public')}
              <p className="text-xs font-normal mt-1 opacity-75">{t('rooms.visibility_public_desc')}</p>
            </button>
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                visibility === 'private'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-border text-muted-foreground hover:border-gray-300'
              }`}
            >
              {t('rooms.visibility_private')}
              <p className="text-xs font-normal mt-1 opacity-75">{t('rooms.visibility_private_desc')}</p>
            </button>
          </div>

          {/* Share with users - shown when private */}
          {visibility === 'private' && (
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                {t('rooms.share_with_label')}
              </label>
              {/* Selected user chips */}
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUserIds.map((uid) => {
                    const u = allUsers.find((x) => x.id === uid);
                    if (!u) return null;
                    return (
                      <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                        <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                        {u.full_name || u.username}
                        <button type="button" onClick={() => toggleUser(uid)} className="hover:text-primary-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Search input with dropdown */}
              <div ref={userSearchRef}>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder={t('rooms.search_users_placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                <Popover
                  triggerRef={userSearchRef}
                  open={showUserDropdown && filteredUsers.length > 0}
                  onClose={() => setShowUserDropdown(false)}
                  align="left"
                  matchWidth
                  className="bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { toggleUser(u.id); setUserSearch(''); }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 ${
                        selectedUserIds.includes(u.id) ? 'bg-primary-50' : ''
                      }`}
                    >
                      <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                      <span className="font-medium">{u.full_name || u.username}</span>
                      {u.full_name && <span className="text-muted-foreground text-xs">@{u.username}</span>}
                      {selectedUserIds.includes(u.id) && <span className="ml-auto text-primary-600">✓</span>}
                    </button>
                  ))}
                </Popover>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
