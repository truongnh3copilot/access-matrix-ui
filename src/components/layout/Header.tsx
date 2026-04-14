import React, { useState } from 'react';
import { Bell, ChevronDown, Search, Shield, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';

export const Header: React.FC = () => {
  const { currentUser, setCurrentUser, requests } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const switchRole = () => {
    if (currentUser.role === 'admin') {
      setCurrentUser({ id: 'u2', name: 'Bob Martinez', role: 'viewer', avatar: 'BM' });
    } else {
      setCurrentUser({ id: 'u4', name: 'David Kim', role: 'admin', avatar: 'DK' });
    }
    setShowUserMenu(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Search */}
      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users, resources..."
          className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Role indicator */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          currentUser.role === 'admin'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <Shield className="w-3.5 h-3.5" />
          {currentUser.role === 'admin' ? 'Admin View' : 'User View'}
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar initials={currentUser.avatar} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{currentUser.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                </div>
                <button
                  onClick={switchRole}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Switch to {currentUser.role === 'admin' ? 'User View' : 'Admin View'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
