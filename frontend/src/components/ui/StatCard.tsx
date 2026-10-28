import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  iconBg = 'bg-blue-50 dark:bg-blue-950/60',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={clsx('w-5 h-5', iconColor)} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
        {trend && (
          <span
            className={clsx(
              'text-xs font-semibold px-1.5 py-0.5 rounded',
              trend.isPositive
                ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
                : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
};
