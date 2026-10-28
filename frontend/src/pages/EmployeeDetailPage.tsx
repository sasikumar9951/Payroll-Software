import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Clock,
  Printer,
  ClipboardList,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Employee } from '../types';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/employees/${id}`);
        if (res.data.success) {
          setEmployee(res.data.data);
        }
      } catch {
        toast.error('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Employee record not found</p>
        <button
          onClick={() => navigate('/employees')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isFinancialVisible = employee.ctc !== undefined && employee.ctc !== null;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            id="start-assessment-link-btn"
            onClick={() => navigate(`/employees/${id}/assessment`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/20 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Start Assessment</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Profile</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            {employee.firstName?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <Badge variant="success">{employee.employmentStatus}</Badge>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-sky-400 mt-0.5">
              {employee.designation?.name || 'General Staff'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {employee.employeeId}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                {employee.department?.name}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {employee.workLocation}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0E1B2D] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{employee.user.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{employee.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Joined: {new Date(employee.joiningDate).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job & Organization Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Job & Reporting Structure
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Employment Type</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.employmentType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Reporting Manager</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {employee.reportingManager
                  ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName} (${employee.reportingManager.employeeId})`
                  : 'Executive Leadership (Direct)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Probation Status</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.probationStatus}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">System Role</span>
              <span className="font-semibold text-blue-600 dark:text-sky-400 font-mono">{employee.user.role}</span>
            </div>
          </div>
        </div>

        {/* Emergency & Address Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Personal & Emergency Contact
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Emergency Contact</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {employee.emergencyContactName || 'Self / Registered Phone'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Contact Number</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {employee.emergencyContactPhone || employee.phone || 'N/A'}
              </span>
            </div>
            <div className="py-1.5">
              <span className="text-slate-400 block mb-1">Residential Address</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {employee.currentAddress || 'Bengaluru Office HQ, Karnataka, India'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary & Statutory Compensation Card (Role Restricted) */}
      {isFinancialVisible && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Salary Structure & Statutory Details (Confidential)</span>
            </h2>
            <Badge variant="primary">INR Currency</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium block">Monthly Basic</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                ₹{Number(employee.basicSalary || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium block">Monthly HRA</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                ₹{Number(employee.hra || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium block">Special Allowances</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                ₹{Number(employee.specialAllowance || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-[11px] text-blue-600 dark:text-blue-300 font-medium block">Annual CTC</span>
              <span className="text-lg font-bold text-blue-900 dark:text-white mt-1 block">
                ₹{Number(employee.ctc || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1B2D]">
              <span className="text-slate-400 block text-[10px]">Bank Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.bankName || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1B2D]">
              <span className="text-slate-400 block text-[10px]">Account Number</span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{employee.accountNumber || '••••••••'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1B2D]">
              <span className="text-slate-400 block text-[10px]">PAN / Tax Number</span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{employee.panNumber || '••••••••'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Annual Leave Balances (Year 2026)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {employee.leaveBalances?.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {b.leaveType.name}
                </span>
                <span className="font-mono text-[10px] text-slate-400 font-bold">
                  {b.leaveType.code}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {b.remainingDays}
                </span>
                <span className="text-[11px] text-slate-400">/ {b.allocatedDays} days</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
