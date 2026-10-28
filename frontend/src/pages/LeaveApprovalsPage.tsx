import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  User,
  Check,
  X,
} from 'lucide-react';
import api from '../services/api';
import { LeaveRequest, AttendanceCorrection } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const LeaveApprovalsPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<{ type: 'leave' | 'correction'; id: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApprovals = async () => {
    try {
      const [leaveRes, corrRes] = await Promise.all([
        api.get('/leaves/admin/all?status=PENDING'),
        api.get('/attendance/corrections'),
      ]);

      if (leaveRes.data.success) setLeaves(leaveRes.data.data);
      if (corrRes.data.success) {
        setCorrections(corrRes.data.data.filter((c: any) => c.status === 'PENDING'));
      }
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleLeaveAction = async (id: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    try {
      const res = await api.put(`/leaves/admin/${id}/action`, {
        action,
        rejectionReason: reason || null,
      });
      if (res.data.success) {
        toast.success(`Leave request ${action.toLowerCase()}d!`);
        setRejectingItem(null);
        setRejectionReason('');
        fetchApprovals();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleCorrectionAction = async (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
    try {
      const res = await api.put(`/attendance/corrections/${id}/status`, {
        status,
        reviewNotes: notes || null,
      });
      if (res.data.success) {
        toast.success(`Regularization ${status.toLowerCase()}!`);
        setRejectingItem(null);
        setRejectionReason('');
        fetchApprovals();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Approvals & Review Center
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Authorize team leave applications and attendance regularizations.
        </p>
      </div>

      {/* Pending Leave Requests Section */}
      <div className="rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pending Leave Applications ({leaves.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No pending leave requests awaiting approval.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {l.employee.firstName} {l.employee.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {l.employee.employeeId} &bull; {l.employee.department?.name}
                      </p>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {l.leaveType.name}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {new Date(l.startDate).toLocaleDateString('en-GB')} –{' '}
                      {new Date(l.endDate).toLocaleDateString('en-GB')}
                    </td>

                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-sky-400">
                      {l.totalDays}d
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{l.reason}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleLeaveAction(l.id, 'APPROVE')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setRejectingItem({ type: 'leave', id: l.id })}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Attendance Regularization Section */}
      <div className="rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pending Regularization Corrections ({corrections.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Requested Timings</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {corrections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No pending attendance regularization requests.
                  </td>
                </tr>
              ) : (
                corrections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {c.employee.firstName} {c.employee.lastName}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400">
                        {c.employee.employeeId}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold">
                      {new Date(c.date).toLocaleDateString('en-GB')}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {new Date(c.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(c.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.reason}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCorrectionAction(c.id, 'APPROVED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setRejectingItem({ type: 'correction', id: c.id })}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        title="Reject Application"
        description="Provide a justification note for the applicant."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Critical project sprint deadline during requested dates."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectingItem(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (rejectingItem?.type === 'leave') {
                  handleLeaveAction(rejectingItem.id, 'REJECT', rejectionReason);
                } else if (rejectingItem?.type === 'correction') {
                  handleCorrectionAction(rejectingItem.id, 'REJECTED', rejectionReason);
                }
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
