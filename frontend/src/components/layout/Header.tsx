import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, LogOut, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </Button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 p-1.5 rounded-lg">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">
              Innovation Hub
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 relative"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full" />
          </Button>

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.team}</p>
            </div>
            
            <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="p-2 hover:bg-gray-100 text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
