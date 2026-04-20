import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border shadow-clay-xs">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-secondary lg:hidden"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-standard shadow-clay-xs">
              <Lightbulb className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-feature-title font-semibold text-foreground hidden sm:block">
              Innovation Hub
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <NotificationDropdown />

          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
              <p className="text-caption text-muted-foreground">{user?.team}</p>
            </div>

            <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="p-2 hover:bg-secondary text-muted-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
