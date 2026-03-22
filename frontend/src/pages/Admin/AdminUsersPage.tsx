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
      showToast({ type: 'error', message: 'Failed to load users' });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, showToast]);

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
      showToast({ type: 'success', message: 'User updated!' });
      setEditUser(null);
      fetchUsers();
    } catch {
      showToast({ type: 'error', message: 'Failed to update user' });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await usersApi.adminDelete(deleteUser.id);
      showToast({ type: 'success', message: 'User deleted!' });
      setDeleteUser(null);
      fetchUsers();
    } catch {
      showToast({ type: 'error', message: 'Failed to delete user' });
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
      showToast({ type: 'error', message: 'Failed to reset password' });
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
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">{total} users total</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name, username, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="rounded-lg border-gray-300 text-sm"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
            <Button type="submit" size="sm">
              <Search className="h-4 w-4 mr-1" />
              Search
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Team</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No users found</td>
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
                              {isSelf && <span className="ml-1 text-xs text-primary-600">(you)</span>}
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
                          {u.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={classNames(
                          'text-xs px-2 py-0.5 rounded-full',
                          u.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                            title="Edit User"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="p-1.5 rounded hover:bg-amber-100 text-gray-500 hover:text-amber-600"
                                title="Reset Password"
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteUser(u)}
                                className="p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
                                title="Delete User"
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
              Page {page} of {totalPages}
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
        title={`Edit User: ${editUser?.full_name || editUser?.username}`}
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
                <p className="text-xs text-gray-500">@{editUser.username} · {editUser.email || 'No email'}</p>
              </div>
            </div>

            {/* Stats */}
            {editStats && (
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-semibold text-blue-700">{editStats.problems_count}</p>
                  <p className="text-xs text-blue-600">Problems</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <Lightbulb className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                  <p className="text-lg font-semibold text-amber-700">{editStats.ideas_count}</p>
                  <p className="text-xs text-amber-600">Ideas</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <MessageCircle className="h-4 w-4 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-semibold text-green-700">{editStats.comments_count}</p>
                  <p className="text-xs text-green-600">Comments</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <DoorOpen className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-semibold text-purple-700">{editStats.rooms_count}</p>
                  <p className="text-xs text-purple-600">Rooms</p>
                </div>
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
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
                  Member
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
                  Admin
                </button>
              </div>
            </div>

            {/* Active status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
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
                  Active
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
                  Inactive
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteUser?.full_name || deleteUser?.username}</strong>?
            This will also delete all their problems, ideas, comments, and rooms. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete User</Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        title={`Reset Password: ${resetUser?.full_name || resetUser?.username}`}
      >
        <div className="space-y-4">
          {!newPassword ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-500">Generating new password...</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                Password has been reset. Copy and send this to the user. They should change it after logging in.
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <code className="flex-1 text-lg font-mono font-semibold text-gray-900 select-all">
                  {newPassword}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 text-center">Copied to clipboard!</p>
              )}
            </>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setResetUser(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
