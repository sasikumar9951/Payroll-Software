import React from 'react';
import { X, CheckCheck, Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { NotificationItem } from '../../types';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'DANGER':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#152238] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Notifications</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {notifications.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-sky-400 font-medium p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Bell className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">No new notifications</p>
                <p className="text-xs text-slate-500 mt-1">You're all caught up with company updates!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) onMarkAsRead(n.id);
                    if (n.linkUrl) {
                      navigate(n.linkUrl);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer transition-colors ${
                    n.isRead
                      ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                      : 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold leading-tight truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
