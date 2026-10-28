import React from 'react';
import { FileSpreadsheet, Download, Users, Clock, CalendarDays, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const ReportsPage: React.FC = () => {
  const downloadReport = (endpoint: string, filename: string) => {
    toast.success(`Preparing ${filename}...`);
    window.open(endpoint, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Executive Reports & Exports
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Generate production-ready Excel (.xlsx) workbooks for audit, payroll preparation, and attendance analysis.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Register Report */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Company Attendance Register (Excel)
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Complete historical log of daily punches, check-in and check-out timestamps, effective working hours, late arrivals, break deductions, and punch regularization audit states.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-400">
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">.XLSX Format</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">Auto Calculated Hours</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">Punch Method Audit</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Ready to download</span>
            <button
              onClick={() => downloadReport('/api/reports/attendance/excel', 'Company_Attendance_Report.xlsx')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel</span>
            </button>
          </div>
        </div>

        {/* Employee Directory Report */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Employee Directory & Statutory Register
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Full workforce roster containing Employee IDs, official designations, department affiliations, joining dates, work locations, monthly salary structure, and bank details.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-400">
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">.XLSX Format</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">Statutory & PAN info</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">CTC & Salary Structure</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Restricted for Admin/HR</span>
            <button
              onClick={() => downloadReport('/api/reports/employees/excel', 'Company_Employees_Report.xlsx')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
