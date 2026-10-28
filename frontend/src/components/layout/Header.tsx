import React, { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { NotificationItem } from '../../types';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenNotifications,
  unreadNotificationsCount,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-18 bg-white/90 dark:bg-[#152238]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile button & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, departments, ID (e.g. DCT-2024)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Live clock, Notifications, Theme toggle, User badge */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live IST Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
            {currentTime}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Pill */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.employee?.firstName?.[0] || 'D'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
              {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-sky-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
