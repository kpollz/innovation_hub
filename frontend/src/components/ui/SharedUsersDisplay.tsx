import React from 'react';
import { Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { SharedUser } from '@/types';

interface SharedUsersDisplayProps {
  users: SharedUser[];
  label: string;
}

export const SharedUsersDisplay: React.FC<SharedUsersDisplayProps> = ({ users, label }) => {
  if (!users || users.length === 0) return null;

  const maxVisible = 3;
  const visibleUsers = users.slice(0, maxVisible);
  const extraCount = users.length - maxVisible;

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="flex -space-x-1.5">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            title={user.full_name || user.username}
            className="ring-2 ring-white rounded-full"
          >
            <Avatar src={user.avatar_url} name={user.full_name || user.username} size="xs" />
          </div>
        ))}
        {extraCount > 0 && (
          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center ring-2 ring-white">
            <span className="text-[9px] font-medium text-muted-foreground">+{extraCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};
