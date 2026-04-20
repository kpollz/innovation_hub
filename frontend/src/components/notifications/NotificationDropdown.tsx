import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Avatar } from '@/components/ui/Avatar';
import type { Notification } from '@/types';

const NotificationItem: React.FC<{
  notification: Notification;
  onClick: (n: Notification) => void;
}> = ({ notification, onClick }) => {
  const { t } = useTranslation();

  const actorName = notification.actor?.full_name || notification.actor?.username || '?';
  const messageKey = `notifications.${notification.type}`;

  // Build translation params based on notification type
  const getTranslationParams = () => {
    const targetTypeLabel = notification.target_type === 'problem'
      ? t('notifications.target_problem')
      : notification.target_type === 'idea'
        ? t('notifications.target_idea')
        : notification.target_type === 'event_idea'
          ? t('notifications.target_event_idea')
          : t('notifications.target_event');
    const baseParams = {
      actor: actorName,
      title: notification.target_title,
      target_type: targetTypeLabel,
    };

    switch (notification.type) {
      case 'comment_added':
        return {
          ...baseParams,
          detail: notification.action_detail || '',
        };
      case 'reaction_added': {
        const reactionEmojiMap: Record<string, string> = {
          like: '👍',
          dislike: '👎',
          insight: '💡',
        };
        return {
          ...baseParams,
          emoji: reactionEmojiMap[notification.action_detail || ''] || '👍',
        };
      }
      case 'vote_added':
        return {
          ...baseParams,
          stars: notification.action_detail || '?',
        };
      case 'status_changed': {
        const [oldStatus, newStatus] = (notification.action_detail || '').split(' → ');
        return {
          ...baseParams,
          old_status: oldStatus || '?',
          new_status: newStatus || '?',
        };
      }
      case 'event_join_request':
      case 'event_join_approved':
      case 'event_join_rejected':
        return { ...baseParams, team_name: notification.action_detail || '' };
      case 'event_idea_submitted':
        return baseParams;
      case 'event_scored':
        return { ...baseParams, score_detail: notification.action_detail || '' };
      default:
        return baseParams;
    }
  };

  const message = t(messageKey, getTranslationParams());

  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <button
      onClick={() => onClick(notification)}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
        !notification.is_read ? 'bg-primary-50/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={notification.actor?.avatar_url}
          name={notification.actor?.full_name || notification.actor?.username}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm leading-snug ${
              !notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'
            }`}
          >
            {message}
          </p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
        </div>
        {!notification.is_read && (
          <span className="mt-1 h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />
        )}
      </div>
    </button>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

export const NotificationDropdown: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
  } = useNotificationStore();

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, closeDropdown]);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
    }
    closeDropdown();
    if (n.target_type === 'problem') {
      navigate(`/problems/${n.target_id}`);
    } else if (n.target_type === 'event_idea') {
      navigate(`/events/${n.reference_id}/ideas/${n.target_id}`);
    } else if (n.target_type === 'event') {
      navigate(`/events/${n.target_id}`);
    } else {
      navigate(`/ideas/${n.target_id}`);
    }
  };

  const handleViewMore = () => {
    const nextPage = Math.floor(notifications.length / 5) + 1;
    fetchNotifications(nextPage, 5);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center bg-danger-500 text-white text-[10px] font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">
              {t('notifications.title')}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t('notifications.mark_all_read')}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {t('common.loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {t('notifications.no_notifications')}
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={handleNotificationClick}
                  />
                ))}
                {notifications.length < total && (
                  <button
                    onClick={handleViewMore}
                    disabled={isLoading}
                    className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    {isLoading ? t('common.loading') : t('notifications.view_more')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
