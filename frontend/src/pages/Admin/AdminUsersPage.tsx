import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  Lightbulb,
  DoorOpen,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { classNames } from '@/utils/helpers';
import type { User } from '@/types';

interface UserStats {
  problems_count: number;
  ideas_count: number;
  comments_count: number;
  rooms_count: number;
}

const LIMIT = 10;

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useUIStore();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('member');
  const [editActive, setEditActive] = useState(true);
  const [editStats, setEditStats] = useState<UserStats | null>(null);

  // Delete modal
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Reset password modal
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await usersApi.list(params);
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      showToast({ type: 'error', message: t('admin.load_users_error') });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, showToast, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / LIMIT);

  const openEdit = async (u: User) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditActive(u.is_active);
    setEditStats(null);
    try {
      const stats = await usersApi.getStats(u.id);
      setEditStats(stats);
    } catch { /* ignore */ }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      await usersApi.adminUpdate(editUser.id, {
        role: editRole as 'member' | 'admin',
        is_active: editActive,
      });
      showToast({ type: 'success', message: t('admin.user_updated') });
      setEditUser(null);
      fetchUsers();
    } catch {
      showToast({ type: 'error', message: t('admin.user_update_error') });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await usersApi.adminDelete(deleteUser.id);
      showToast({ type: 'success', message: t('admin.user_deleted') });
      setDeleteUser(null);
      fetchUsers();
    } catch {
      showToast({ type: 'error', message: t('admin.user_delete_error') });
    }
  };

  const handleResetPassword = async (u: User) => {
    setResetUser(u);
    setNewPassword('');
    setCopied(false);
    try {
      const res = await usersApi.adminResetPassword(u.id);
      setNewPassword(res.new_password);
    } catch {
      showToast({ type: 'error', message: t('admin.reset_password_error') });
      setResetUser(null);
    }
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-section-heading font-bold text-gray-900">{t('admin.users_title')}</h1>
        <p className="text-gray-500 mt-1">{t('admin.users_count', { count: total })}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t('admin.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-base text-gray-900 focus:border-primary-500 focus:ring-primary-500 focus:outline-none shadow-sm transition-colors"
            >
              <option value="">{t('admin.all_roles')}</option>
              <option value="admin">{t('common.administrator')}</option>
              <option value="member">{t('common.member')}</option>
            </select>
            <Button type="submit" className="px-5 py-2.5">
              <Search className="h-4 w-4 mr-1.5" />
              {t('common.search')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">{t('admin.user_column')}</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">{t('admin.team_column')}</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">{t('admin.role_column')}</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">{t('admin.status_column')}</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">{t('admin.actions_column')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">{t('common.loading')}</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">{t('admin.no_users')}</td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary-700">
                              {u.full_name?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {u.full_name || u.username}
                              {isSelf && <span className="ml-1 text-xs text-primary-600">({t('admin.you')})</span>}
                            </p>
                            <p className="text-xs text-gray-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{u.team || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={classNames(
                          'text-xs px-2 py-0.5 rounded-full',
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {u.role === 'admin' ? t('common.administrator') : t('common.member')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={classNames(
                          'text-xs px-2 py-0.5 rounded-full',
                          u.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}>
                          {u.is_active ? t('admin.active') : t('admin.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                            title={t('admin.edit_user')}
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="p-1.5 rounded hover:bg-amber-100 text-gray-500 hover:text-amber-600"
                                title={t('admin.reset_password')}
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteUser(u)}
                                className="p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
                                title={t('admin.delete_user')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {t('common.page_of', { current: page, total: totalPages })}
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={t('admin.edit_user_title', { name: editUser?.full_name || editUser?.username })}
      >
        {editUser && (
          <div className="space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {editUser.full_name?.charAt(0).toUpperCase() || editUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{editUser.full_name || editUser.username}</p>
                <p className="text-xs text-gray-500">@{editUser.username} · {editUser.email || t('admin.no_email')}</p>
              </div>
            </div>

            {/* Stats */}
            {editStats && (
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-semibold text-blue-700">{editStats.problems_count}</p>
                  <p className="text-xs text-blue-600">{t('admin.problems_count')}</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <Lightbulb className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                  <p className="text-lg font-semibold text-amber-700">{editStats.ideas_count}</p>
                  <p className="text-xs text-amber-600">{t('admin.ideas_count')}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <MessageCircle className="h-4 w-4 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-semibold text-green-700">{editStats.comments_count}</p>
                  <p className="text-xs text-green-600">{t('admin.comments_count')}</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <DoorOpen className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-semibold text-purple-700">{editStats.rooms_count}</p>
                  <p className="text-xs text-purple-600">{t('admin.rooms_count')}</p>
                </div>
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.role_label')}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditRole('member')}
                  className={classNames(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                    editRole === 'member'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <ShieldOff className="h-4 w-4" />
                  {t('common.member')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditRole('admin')}
                  className={classNames(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                    editRole === 'admin'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Shield className="h-4 w-4" />
                  {t('common.administrator')}
                </button>
              </div>
            </div>

            {/* Active status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.account_status')}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditActive(true)}
                  className={classNames(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                    editActive
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <UserCheck className="h-4 w-4" />
                  {t('admin.active')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditActive(false)}
                  className={classNames(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                    !editActive
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <UserX className="h-4 w-4" />
                  {t('admin.inactive')}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditUser(null)}>{t('common.cancel')}</Button>
              <Button onClick={handleSaveEdit}>{t('common.save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title={t('admin.delete_user')}
      >
        <div className="space-y-4">
          <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: t('admin.delete_user_confirm', { name: deleteUser?.full_name || deleteUser?.username }) }} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteUser(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleDelete}>{t('admin.delete_user')}</Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        title={t('admin.reset_password_title', { name: resetUser?.full_name || resetUser?.username })}
      >
        <div className="space-y-4">
          {!newPassword ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-500">{t('admin.generating_password')}</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                {t('admin.password_reset_msg')}
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <code className="flex-1 text-lg font-mono font-semibold text-gray-900 select-all">
                  {newPassword}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title={t('admin.copy_clipboard')}
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 text-center">{t('admin.copied')}</p>
              )}
            </>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setResetUser(null)}>{t('common.close')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
