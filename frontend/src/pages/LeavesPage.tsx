import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LeaveBalance, LeaveRequest, LeaveType } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isHalfDay: false,
    halfDayType: 'FIRST_HALF',
    reason: '',
  });

  const fetchLeaveData = async () => {
    try {
      const [balRes, reqRes, typeRes] = await Promise.all([
        api.get('/leaves/my-balances'),
        api.get('/leaves/my-requests'),
        api.get('/leaves/types'),
      ]);

      if (balRes.data.success) setBalances(balRes.data.data);
      if (reqRes.data.success) setRequests(reqRes.data.data);
      if (typeRes.data.success) {
        setTypes(typeRes.data.data);
        if (typeRes.data.data.length > 0 && !formData.leaveTypeId) {
          setFormData((prev) => ({ ...prev, leaveTypeId: typeRes.data.data[0].id }));
        }
      }
    } catch {
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/leaves/apply', formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Leave request submitted!');
        setIsApplyModalOpen(false);
        setFormData({
          leaveTypeId: types[0]?.id || '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          isHalfDay: false,
          halfDayType: 'FIRST_HALF',
          reason: '',
        });
        fetchLeaveData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Leave Management Portal
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            View available balances, apply for paid time off, and track approval states.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div
            key={b.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: b.leaveType.colorCode || '#3B82F6' }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {b.leaveType.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {b.leaveType.code}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {b.remainingDays}
              </span>
              <span className="text-xs text-slate-400">/ {b.allocatedDays} available</span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Used: {b.usedDays}d</span>
              <span>Pending: {b.pendingDays}d</span>
            </div>
          </div>
        ))}
      </div>

      {/* Requests History Table */}
      <div className="rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            My Submitted Applications
          </h3>
          <span className="text-xs text-slate-400">{requests.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Leave Category</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reviewer Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No leave requests submitted yet.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: r.leaveType?.colorCode || '#3B82F6' }}
                        />
                        <span>{r.leaveType?.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {new Date(r.startDate).toLocaleDateString('en-GB')} –{' '}
                      {new Date(r.endDate).toLocaleDateString('en-GB')}
                    </td>

                    <td className="py-3 px-4 font-bold">
                      {r.totalDays} day{r.totalDays > 1 ? 's' : ''}
                      {r.isHalfDay && (
                        <span className="ml-1 text-[10px] font-normal text-amber-500">
                          ({r.halfDayType === 'FIRST_HALF' ? '1st Half' : '2nd Half'})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.reason}</td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          r.status === 'APPROVED'
                            ? 'success'
                            : r.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {r.rejectionReason ? (
                        <span className="text-rose-500 font-medium">{r.rejectionReason}</span>
                      ) : (
                        r.reviewedBy?.email || 'Pending review'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Company Leave"
        description="Submit leave application for manager & HR approval."
        maxWidth="lg"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Leave Category *
            </label>
            <select
              value={formData.leaveTypeId}
              onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code}) - {t.daysAllowedPerYear} days/yr
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                To Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isHalfDay}
                onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold">Half-day Leave</span>
            </label>

            {formData.isHalfDay && (
              <select
                value={formData.halfDayType}
                onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="FIRST_HALF">First Half (Morning)</option>
                <option value="SECOND_HALF">Second Half (Afternoon)</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Leave *
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide a clear description of the leave reason..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
