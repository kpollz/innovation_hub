import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Avatar } from '@/components/ui/Avatar';
import type { ProblemVisibility, User } from '@/types';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create-direct' | 'create-from-problem' | 'edit';
  /** For create-from-problem: the problem to link (auto) */
  problemId?: string;
  problemTitle?: string;
  /** For edit: existing room data */
  roomId?: string;
  initialData?: {
    name: string;
    description: string;
    visibility: ProblemVisibility;
    sharedUserIds: string[];
    problemId?: string;
    problemTitle?: string;
  };
  onSuccess: () => void;
}

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  problemId: autoProblemId,
  problemTitle: autoProblemTitle,
  roomId,
  initialData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { problems, fetchProblems } = useProblemStore();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useUIStore();

  const isEdit = mode === 'edit';
  const isFromProblem = mode === 'create-from-problem';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [visibility, setVisibility] = useState<ProblemVisibility>('public');
  const [sharedUserIds, setSharedUserIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? (isFromProblem && autoProblemTitle ? `Brainstorm: ${autoProblemTitle}` : ''));
      setDescription(initialData?.description ?? '');
      setSelectedProblemId(initialData?.problemId ?? autoProblemId ?? '');
      setVisibility(initialData?.visibility ?? 'public');
      setSharedUserIds(initialData?.sharedUserIds ?? []);
      setUserSearch('');
      setShowUserDropdown(false);
      setErrors({});

      if (!isFromProblem) {
        fetchProblems({ limit: 100 });
      }
      usersApi.list({ limit: 100, is_active: true }).then((res) => setAllUsers(res.items)).catch(() => {});
    }
  }, [isOpen]);

  const toggleUser = (userId: string) => {
    setSharedUserIds((prev) =>
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

  const linkedProblemTitle = isFromProblem
    ? autoProblemTitle
    : problems.find(p => p.id === (initialData?.problemId || selectedProblemId))?.title;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.length < 3) {
      newErrors.name = t('rooms.name_min');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && roomId) {
        await roomsApi.update(roomId, {
          name: name.trim(),
          description: description.trim() || undefined,
          visibility,
          shared_user_ids: visibility === 'private' ? sharedUserIds : undefined,
        });
        showToast({ type: 'success', message: t('rooms.updated') });
      } else if (isFromProblem && autoProblemId) {
        await roomsApi.create({
          name: name.trim(),
          description: description.trim() || undefined,
          problem_id: autoProblemId,
          visibility,
          shared_user_ids: visibility === 'private' ? sharedUserIds : undefined,
        });
        showToast({ type: 'success', message: t('rooms.created_success') });
      } else {
        await roomsApi.create({
          name: name.trim(),
          description: description.trim() || undefined,
          problem_id: selectedProblemId || undefined,
          visibility,
          shared_user_ids: visibility === 'private' ? sharedUserIds : undefined,
        });
        showToast({ type: 'success', message: t('rooms.created_success') });
      }
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('rooms.create_error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedProblemId('');
    setVisibility('public');
    setSharedUserIds([]);
    setUserSearch('');
    setShowUserDropdown(false);
    setErrors({});
    onClose();
  };

  const modalTitle = isEdit
    ? t('rooms.edit_room')
    : t('rooms.create_room_title');

  const submitLabel = isEdit
    ? (isSubmitting ? t('common.saving') : t('common.save'))
    : (isSubmitting ? t('common.creating') : t('rooms.create_room'));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('rooms.room_name_label')}
          placeholder={t('rooms.room_name_placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <Textarea
          label={t('rooms.desc_label')}
          placeholder={t('rooms.room_desc_placeholder')}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
        />

        {/* Problem Link */}
        {isFromProblem ? (
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              {t('rooms.link_problem')}
            </label>
            <div className="px-3 py-2 bg-secondary rounded-lg text-sm text-foreground/70">
              {autoProblemTitle}
            </div>
          </div>
        ) : isEdit && linkedProblemTitle ? (
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              {t('rooms.linked_problem')}
            </label>
            <div className="px-3 py-2 bg-secondary rounded-lg text-sm text-foreground/70">
              {linkedProblemTitle}
            </div>
          </div>
        ) : !isEdit ? (
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              {t('rooms.link_problem')}
            </label>
            <select
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            >
              {problemOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Visibility Toggle */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            {t('rooms.visibility_label')}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setVisibility('public'); setSharedUserIds([]); }}
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

          {/* Share with users when private */}
          {visibility === 'private' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                {t('rooms.share_with_label')}
              </label>
              {sharedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {sharedUserIds.map((uid) => {
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
              <div ref={userSearchRef}>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder={t('rooms.search_users_placeholder')}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
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
                        sharedUserIds.includes(u.id) ? 'bg-primary-50' : ''
                      }`}
                    >
                      <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                      <span className="font-medium">{u.full_name || u.username}</span>
                      {u.full_name && <span className="text-muted-foreground text-xs">@{u.username}</span>}
                      {sharedUserIds.includes(u.id) && <span className="ml-auto text-primary-600">✓</span>}
                    </button>
                  ))}
                </Popover>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
