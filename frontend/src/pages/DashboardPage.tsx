import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  CalendarDays,
  FileQuestion,
  TrendingUp,
  AlertCircle,
  LogIn,
  LogOut,
  Building,
  Sparkles,
  ShieldCheck,
  MapPin,
  Globe,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';
import { captureLiveLocationAndIp } from '../utils/geolocation';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, attRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/attendance/today'),
      ]);
      if (dashRes.data.success) {
        setData(dashRes.data.data);
      }
      if (attRes.data.success) {
        setTodayAttendance(attRes.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePunchIn = async () => {
    setPunchLoading(true);
    const toastId = toast.loading('Detecting live location & IP address...');
    try {
      const geo = await captureLiveLocationAndIp();
      const res = await api.post('/attendance/check-in', {
        method: 'WEB',
        location: geo.locationString,
        ip: geo.ip,
      });
      toast.dismiss(toastId);
      toast.success(res.data.message || 'Checked in successfully!');
      await fetchDashboardData();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setPunchLoading(true);
    const toastId = toast.loading('Detecting live location & IP address...');
    try {
      const geo = await captureLiveLocationAndIp();
      const res = await api.post('/attendance/check-out', {
        method: 'WEB',
        location: geo.locationString,
        ip: geo.ip,
      });
      toast.dismiss(toastId);
      toast.success(res.data.message || 'Checked out successfully!');
      await fetchDashboardData();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading live metrics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Enterprise HRMS & Workplace Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Good day, {user?.employee?.firstName || user?.email?.split('@')[0]}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Shift timing: 09:00 AM – 06:00 PM IST (15m grace window). Review real-time employee attendance and requests below.
            </p>
          </div>

          {/* Quick Web Punch Widget (Exempt for SUPER_ADMIN) */}
          {user?.role === 'SUPER_ADMIN' ? (
            <div className="bg-slate-50 dark:bg-[#0E1B2D] border border-blue-200 dark:border-blue-900/60 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-sky-400 font-bold block">
                  Administrator Mode
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Attendance Punch Exempt
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                  Today's Punch Status
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {todayAttendance?.checkInTime
                    ? `Checked In at ${new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Not Checked In Yet'}
                </span>
                {todayAttendance?.checkInTime && (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-blue-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{todayAttendance.checkInLocation || 'Office Web Portal'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-500" />
                      <span>{todayAttendance.checkInIp || '127.0.0.1'}</span>
                    </span>
                  </div>
                )}
                {todayAttendance?.checkOutTime && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    Checked Out at {new Date(todayAttendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!todayAttendance?.checkInTime ? (
                  <button
                    onClick={handlePunchIn}
                    disabled={punchLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Punch In</span>
                  </button>
                ) : !todayAttendance?.checkOutTime ? (
                  <button
                    onClick={handlePunchOut}
                    disabled={punchLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Punch Out</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Day Completed</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals Notice for HR / PM */}
      {hasRole('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER') &&
        ((stats?.pendingLeaves || 0) > 0 || (stats?.pendingCorrections || 0) > 0) && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Pending Administrative Action Required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  You have {stats?.pendingLeaves} pending leave request(s) and {stats?.pendingCorrections} attendance regularization request(s).
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/leave-approvals')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              Review Approvals
            </button>
          </div>
        )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={stats?.totalEmployees || 0}
          subtitle={`${stats?.activeEmployees || 0} active employees`}
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/50"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title="Present Today"
          value={stats?.presentCount || 0}
          subtitle={`${stats?.currentlyCheckedIn || 0} currently on shift`}
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          trend={{ value: `${stats?.attendanceRate || 0}% rate`, isPositive: (stats?.attendanceRate || 0) >= 80 }}
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Late Punches"
          value={stats?.lateCount || 0}
          subtitle="Arrived after 09:15 AM IST"
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="On Leave / Absent"
          value={`${stats?.onLeaveCount || 0} / ${stats?.absentCount || 0}`}
          subtitle={`${stats?.pendingLeaves || 0} pending applications`}
          icon={CalendarDays}
          iconColor="text-rose-600 dark:text-rose-400"
          iconBg="bg-rose-50 dark:bg-rose-950/50"
          onClick={() => navigate('/leaves')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Attendance Trends (Last 7 Working Days)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily present, late arrivals, and absent metrics
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>Live Database Records</span>
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trendData || []}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#presentGrad)" name="Present on time" />
                <Area type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#lateGrad)" name="Late Punches" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Department Headcounts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Workforce distribution across teams
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.departmentStats || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="code" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="employeeCount" fill="#3B82F6" radius={[0, 8, 8, 0]} name="Headcount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Floor Attendance & Notifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live checked in employees stream */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Attendance Activity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest employee check-in and checkout punches
              </p>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              View Full Register &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Punch Time</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.activePunches?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No check-ins recorded yet for today
                    </td>
                  </tr>
                ) : (
                  data?.activePunches.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <span>{p.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{p.employeeId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-300">{p.department}</td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {new Date(p.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            p.status === 'LATE'
                              ? 'warning'
                              : p.isCheckedOut
                              ? 'neutral'
                              : 'success'
                          }
                          size="sm"
                        >
                          {p.isCheckedOut ? 'Checked Out' : p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links & Shortcuts */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Quick Shortcuts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Frequent actions and workflows
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/leaves')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Apply for Leave</p>
                    <p className="text-[10px] text-slate-500">Casual, Sick, or Earned leave</p>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">&rarr;</span>
              </button>

              <button
                onClick={() => navigate('/attendance')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Attendance Regularization</p>
                    <p className="text-[10px] text-slate-500">Request missed punch correction</p>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">&rarr;</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Export Monthly Reports</p>
                    <p className="text-[10px] text-slate-500">Excel (.xlsx) attendance & payroll</p>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">&rarr;</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Enterprise HRMS Portal</span>
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
