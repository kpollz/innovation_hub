import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  AlertCircle,
  Lightbulb,
  LayoutDashboard,
  Users,
  X
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { classNames } from '@/utils/helpers';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/problems', label: 'Problem Feed', icon: AlertCircle },
  { path: '/rooms', label: 'Idea Lab', icon: Lightbulb },
];

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'User Management', icon: Users },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-64 bg-white border-r border-gray-200',
          'transform transition-transform duration-300 ease-in-out',
          'lg:transform-none',
          'flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden flex-shrink-0">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={classNames(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className={classNames('h-5 w-5', isActive ? 'text-primary-600' : 'text-gray-500')} />
                {item.label}
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Admin
                </p>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);
                  
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={classNames(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className={classNames('h-5 w-5', isActive ? 'text-primary-600' : 'text-gray-500')} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* User info at bottom - clickable to settings */}
        <div
          className="flex-shrink-0 h-14 px-4 border-t border-gray-200 bg-white flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
          title="Account Settings"
        >
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary-700">
                  {user?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                {user?.full_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate leading-tight">
                {user?.role === 'admin' ? 'Administrator' : 'Member'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
