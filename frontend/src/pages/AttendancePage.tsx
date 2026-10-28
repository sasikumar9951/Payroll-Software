import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Filter,
  ShieldCheck,
  MapPin,
  Globe,
  Wifi,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, AttendanceCorrection } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { captureLiveLocationAndIp } from '../utils/geolocation';

export const AttendancePage: React.FC = () => {
  const { user, hasRole } = useAuth();

  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [adminDaily, setAdminDaily] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'my' | 'admin' | 'corrections'>('my');

  // Modal for correction request
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionData, setCorrectionData] = useState({
    date: new Date().toISOString().split('T')[0],
    requestedCheckIn: `${new Date().toISOString().split('T')[0]}T09:00:00`,
    requestedCheckOut: `${new Date().toISOString().split('T')[0]}T18:00:00`,
    reason: '',
  });

  const fetchData = async () => {
    try {
      const [todayRes, histRes, corrRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/my-history'),
        api.get('/attendance/corrections'),
      ]);

      if (todayRes.data.success) setTodayRecord(todayRes.data.data);
      if (histRes.data.success) setHistory(histRes.data.data);
      if (corrRes.data.success) setCorrections(corrRes.data.data);

      if (hasRole('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER')) {
        const dailyRes = await api.get('/attendance/admin/daily');
        if (dailyRes.data.success) {
          setAdminDaily(dailyRes.data.data);
          setDailySummary(dailyRes.data.summary);
        }
      }
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePunchIn = async () => {
    setPunching(true);
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
      await fetchData();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    setPunching(true);
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
      await fetchData();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setPunching(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/attendance/corrections', correctionData);
      if (res.data.success) {
        toast.success('Regularization request submitted!');
        setIsCorrectionModalOpen(false);
        setCorrectionData({
          date: new Date().toISOString().split('T')[0],
          requestedCheckIn: `${new Date().toISOString().split('T')[0]}T09:00:00`,
          requestedCheckOut: `${new Date().toISOString().split('T')[0]}T18:00:00`,
          reason: '',
        });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit correction');
    }
  };

  const downloadExcel = () => {
    window.open('/api/reports/attendance/excel', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance & Regularization
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Official working hours: 09:00 AM – 06:00 PM IST with 15-minute grace window.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCorrectionModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Regularize Attendance</span>
          </button>

          {hasRole('SUPER_ADMIN', 'HR_ADMIN', 'ACCOUNTS_ADMIN') && (
            <button
              onClick={downloadExcel}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Web Punch Hero Widget */}
      {user?.role === 'SUPER_ADMIN' ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-blue-200 dark:border-blue-900/60 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 block mb-0.5">
                Executive Administrator Account
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Check-in and Check-out Exempt
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administrators oversee organizational operations and do not require daily shift punches. Use the tabs below to monitor staff attendance.
              </p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-sky-300 text-xs font-semibold">
            Full Organization Oversight
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 block mb-1">
                Live Office Attendance Clock
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {todayRecord?.checkInTime
                  ? `Checked In at ${new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Not Checked In for Today'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {todayRecord?.checkOutTime
                  ? `Checked Out at ${new Date(todayRecord.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Total: ${todayRecord.totalHours || 0} hrs`
                  : todayRecord?.checkInTime
                  ? 'Currently on duty. Remember to punch out before leaving office.'
                  : 'Punches recorded after 09:15 AM IST are tagged as Late Arrival.'}
              </p>

              {/* Verified Check-in Location & IP Address Badge */}
              {todayRecord?.checkInTime && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-[11px] font-semibold text-blue-700 dark:text-sky-300">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    <span>Location: <strong>{todayRecord.checkInLocation || 'Office Web Portal (Bengaluru)'}</strong></span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>IP: <strong>{todayRecord.checkInIp || '127.0.0.1 (Localhost)'}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!todayRecord?.checkInTime ? (
              <button
                onClick={handlePunchIn}
                disabled={punching}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>Check In Now</span>
              </button>
            ) : !todayRecord?.checkOutTime ? (
              <button
                onClick={handlePunchOut}
                disabled={punching}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Check Out</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Shift punches complete for today</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'my'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          My Attendance History
        </button>

        {hasRole('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER') && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Today's Company Register ({dailySummary?.present || 0} Present)
          </button>
        )}

        <button
          onClick={() => setActiveTab('corrections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'corrections'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Regularization Requests ({corrections.length})
        </button>
      </div>

      {/* Tab 1: My History */}
      {activeTab === 'my' && (
        <div className="rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Personal Attendance Log
            </h3>
            <span className="text-xs text-slate-400">{history.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Effective Hrs</th>
                  <th className="py-3 px-4">Late Mins</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Punch In Location & IP</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  history.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {new Date(r.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {r.effectiveHours ? `${r.effectiveHours} hrs` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {(r.lateMinutes || 0) > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            +{r.lateMinutes} min
                          </span>
                        ) : (
                          <span className="text-slate-400">On time</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            r.status === 'LATE'
                              ? 'warning'
                              : r.status === 'ABSENT'
                              ? 'danger'
                              : 'success'
                          }
                          size="sm"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {r.checkInTime ? (
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              <span>{r.checkInLocation || 'Office Web Portal'}</span>
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-emerald-500" />
                              <span>{r.checkInIp || '127.0.0.1'}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {r.isRegularized ? (
                          <span className="text-blue-500 font-semibold">Regularized</span>
                        ) : (
                          r.notes || 'Web Punch'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Admin Daily Overview */}
      {activeTab === 'admin' && hasRole('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER') && (
        <div className="rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Company Daily Attendance Roster
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time daily punches for all staff
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-600 font-bold">Present: {dailySummary?.present || 0}</span>
              <span className="text-amber-600 font-bold">Late: {dailySummary?.late || 0}</span>
              <span className="text-rose-600 font-bold">Absent: {dailySummary?.absent || 0}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Punch In</th>
                  <th className="py-3 px-4">Punch Out</th>
                  <th className="py-3 px-4">Total Hrs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">IP / Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adminDaily.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400">{emp.employeeId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-300">
                      {emp.department?.name || 'General'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {emp.attendance?.checkInTime
                        ? new Date(emp.attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {emp.attendance?.checkOutTime
                        ? new Date(emp.attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {emp.attendance?.totalHours ? `${emp.attendance.totalHours}h` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          emp.status === 'LATE'
                            ? 'warning'
                            : emp.status === 'ABSENT'
                            ? 'danger'
                            : 'success'
                        }
                        size="sm"
                      >
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {emp.attendance?.checkInTime ? (
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            <span>{emp.attendance?.checkInLocation || 'Office Web Portal'}</span>
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-emerald-500" />
                            <span>{emp.attendance?.checkInIp || '127.0.0.1'}</span>
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Corrections */}
      {activeTab === 'corrections' && (
        <div className="rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Regularization Audit Log
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4">Requested Timings</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No correction requests on file.
                    </td>
                  </tr>
                ) : (
                  corrections.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {c.employee?.firstName} {c.employee?.lastName}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {new Date(c.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {new Date(c.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(c.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.reason}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            c.status === 'APPROVED'
                              ? 'success'
                              : c.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {c.reviewedBy?.email || 'Pending HR Review'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regularization Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Attendance Regularization Request"
        description="Submit a correction for missed biometric punch or network glitch."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date to Correct *
            </label>
            <input
              type="date"
              required
              value={correctionData.date}
              onChange={(e) => setCorrectionData({ ...correctionData, date: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Check In *
              </label>
              <input
                type="datetime-local"
                required
                value={correctionData.requestedCheckIn}
                onChange={(e) => setCorrectionData({ ...correctionData, requestedCheckIn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Check Out *
              </label>
              <input
                type="datetime-local"
                required
                value={correctionData.requestedCheckOut}
                onChange={(e) => setCorrectionData({ ...correctionData, requestedCheckOut: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Missed Punch *
            </label>
            <textarea
              required
              rows={3}
              value={correctionData.reason}
              onChange={(e) => setCorrectionData({ ...correctionData, reason: e.target.value })}
              placeholder="e.g. Office biometric device was restarting due to router firmware update."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
