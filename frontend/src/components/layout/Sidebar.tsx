import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck2,
  CheckSquare,
  Building2,
  FileBarChart,
  ShieldAlert,
  LogOut,
  Settings,
  Award,
} from 'lucide-react';
import staticLogo from '../../assets/company-logo-white.png';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useCompanySettings } from '../../context/CompanySettingsContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasRole } = useAuth();
  const { settings } = useCompanySettings();
  const logoSrc = settings.companyLogo || staticLogo;

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/',
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS_ADMIN', 'EMPLOYEE'],
    },
    {
      label: 'Employees',
      icon: Users,
      to: '/employees',
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS_ADMIN'],
    },
    {
      label: 'Assessment',
      icon: Award,
      to: '/assessment',
      roles: ['EMPLOYEE', 'SUPER_ADMIN', 'HR_ADMIN'],
    },
    {
      label: 'Attendance',
      icon: Clock,
      to: '/attendance',
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS_ADMIN', 'EMPLOYEE'],
    },
    {
      label: 'Leave Portal',
      icon: CalendarCheck2,
      to: '/leaves',
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS_ADMIN', 'EMPLOYEE'],
    },
    {
      label: 'Approvals & Reviews',
      icon: CheckSquare,
      to: '/leave-approvals',
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'],
    },
    {
      label: 'Departments',
      icon: Building2,
      to: '/departments',
      roles: ['SUPER_ADMIN', 'HR_ADMIN'],
    },
    {
      label: 'Reports & Exports',
      icon: FileBarChart,
      to: '/reports',
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ACCOUNTS_ADMIN'],
    },
    {
      label: 'Audit Trail',
      icon: ShieldAlert,
      to: '/audit-logs',
      roles: ['SUPER_ADMIN'],
    },
    {
      label: 'Company Settings',
      icon: Settings,
      to: '/settings',
      roles: ['SUPER_ADMIN'],
    },
  ];

  const filteredNav = navItems.filter((item) => hasRole(...item.roles));

  const roleNameDisplay: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    HR_ADMIN: 'HR Administrator',
    PROJECT_MANAGER: 'Team Lead / PM',
    ACCOUNTS_ADMIN: 'Accounts Admin',
    EMPLOYEE: 'Employee',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[#0B192C] text-slate-300 flex flex-col border-r border-[#1E3E62] transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center px-4 py-4 border-b border-[#1E3E62]/80 bg-[#070F1B]/30">
          <img
            src={logoSrc}
            alt={settings.companyName}
            className="w-auto h-10 max-w-[210px] object-contain drop-shadow-sm transition-all"
          />
        </div>

        {/* Current user role card */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-[#152238]/70 border border-[#1E3E62]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-sm">
              {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
              </p>
              <p className="text-[10px] font-medium text-sky-300/80 truncate">
                {roleNameDisplay[user?.role || ''] || user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#1E3E62]/50'
                  )
                }
              >
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom logout */}
        <div className="p-3 border-t border-[#1E3E62]/80 bg-[#070F1B]/50">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
