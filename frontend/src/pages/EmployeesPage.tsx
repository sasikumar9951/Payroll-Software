import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Building,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  Pencil,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Employee, Department } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'EMPLOYEE') {
      navigate('/assessment', { replace: true });
    }
  }, [user, navigate]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal for Add Employee
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({

    employeeId: '',
    email: '',
    password: 'Welcome@123',
    role: 'EMPLOYEE',
    firstName: '',
    lastName: '',
    phone: '',
    departmentId: '',
    designationTitle: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    workLocation: 'OFFICE',
    basicSalary: 60000,
    hra: 24000,
    specialAllowance: 16000,
    ctc: 1200000,
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: 'HDFC0001234',
    panNumber: '',
  });

  // Modal for Edit Employee
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'EMPLOYEE',
    departmentId: '',
    designationTitle: '',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    workLocation: 'OFFICE',
    basicSalary: 0,
    hra: 0,
    specialAllowance: 0,
    ctc: 0,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedDept) params.append('departmentId', selectedDept);
      if (selectedStatus) params.append('employmentStatus', selectedStatus);
      params.append('page', page.toString());
      params.append('limit', '8');

      const res = await api.get(`/employees?${params.toString()}`);
      if (res.data.success) {
        setEmployees(res.data.data);
        setTotalPages(res.data.meta.totalPages);
        setTotal(res.data.meta.total);
      }
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const deptRes = await api.get('/departments');
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept, selectedStatus, page]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/employees', formData);
      if (res.data.success) {
        toast.success('Employee created successfully!');
        setIsAddModalOpen(false);
        fetchEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEditFormData({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      phone: emp.phone || '',
      role: (emp.user as any)?.role || 'EMPLOYEE',
      // departmentId may come as emp.departmentId or inside the nested emp.department object
      departmentId: emp.departmentId || emp.department?.id || '',
      designationTitle: emp.designation?.name || '',
      employmentStatus: emp.employmentStatus || 'ACTIVE',
      employmentType: emp.employmentType || 'FULL_TIME',
      workLocation: emp.workLocation || 'OFFICE',
      basicSalary: Number(emp.basicSalary) || 0,
      hra: Number(emp.hra) || 0,
      specialAllowance: Number(emp.specialAllowance) || 0,
      ctc: Number(emp.ctc) || 0,
      bankName: emp.bankName || '',
      accountNumber: emp.accountNumber || '',
      ifscCode: emp.ifscCode || '',
      panNumber: emp.panNumber || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;
    setEditSubmitting(true);
    try {
      // Build payload — only send designationTitle if user typed something;
      // otherwise send the resolved designationId to avoid clearing it
      const payload: Record<string, any> = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phone: editFormData.phone,
        role: editFormData.role,
        departmentId: editFormData.departmentId || undefined,
        employmentStatus: editFormData.employmentStatus,
        employmentType: editFormData.employmentType,
        workLocation: editFormData.workLocation,
        basicSalary: editFormData.basicSalary,
        hra: editFormData.hra,
        specialAllowance: editFormData.specialAllowance,
        ctc: editFormData.ctc,
        bankName: editFormData.bankName,
        accountNumber: editFormData.accountNumber,
        ifscCode: editFormData.ifscCode,
        panNumber: editFormData.panNumber,
      };
      if (editFormData.designationTitle.trim()) {
        payload.designationTitle = editFormData.designationTitle.trim();
      }
      const res = await api.put(`/employees/${editingEmpId}`, payload);
      if (res.data.success) {
        toast.success('Employee updated successfully!');
        setIsEditModalOpen(false);
        fetchEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deactivated successfully');
      fetchEmployees();
    } catch {
      toast.error('Failed to deactivate employee');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'PROBATION':
        return <Badge variant="warning">Probation</Badge>;
      case 'NOTICE_PERIOD':
        return <Badge variant="danger">Notice Period</Badge>;
      case 'TERMINATED':
        return <Badge variant="neutral">Terminated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Employee Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {total} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage company employees, job roles, reporting lines, and profiles.
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'HR_ADMIN') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, employee ID, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="NOTICE_PERIOD">Notice Period</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0E1B2D] text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Role & Dept</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Work Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading employee directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No employees found matching criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {emp.firstName?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="font-mono text-[10px] text-blue-600 dark:text-sky-400 font-semibold">
                            {emp.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {emp.designation?.name || 'General Staff'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {emp.department?.name || 'Unassigned'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.user.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {emp.workLocation}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(emp.employmentStatus)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasRole('SUPER_ADMIN', 'HR_ADMIN') && (
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title="Edit Employee"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {hasRole('SUPER_ADMIN', 'HR_ADMIN') && emp.employmentStatus === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivate(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Deactivate Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({total} employees)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Employee"
        description="Create employee profile, credentials, and initial leave balance"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="DCT-2026-009"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Permission *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="PROJECT_MANAGER">Team Lead / PM</option>
                <option value="HR_ADMIN">HR Administrator</option>
                <option value="ACCOUNTS_ADMIN">Accounts Administrator</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@company.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Initial Password — full width */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Password *
                <span className="ml-2 font-normal text-slate-400">(Employee will use this to log in)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                💡 Share this password with the employee so they can log in. They can change it later.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designationTitle}
                onChange={(e) => setFormData({ ...formData, designationTitle: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Location
              </label>
              <select
                value={formData.workLocation}
                onChange={(e) => setFormData({ ...formData, workLocation: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="OFFICE">Office (In-Person)</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Basic Salary (INR)
              </label>
              <input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Annual CTC (INR)
              </label>
              <input
                type="number"
                value={formData.ctc}
                onChange={(e) => setFormData({ ...formData, ctc: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Onboard Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Employee Modal ── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee"
        description="Update employee details, role, designation, and compensation"
        maxWidth="2xl"
      >
        <form onSubmit={handleEditEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Permission</label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="PROJECT_MANAGER">Team Lead / PM</option>
                <option value="HR_ADMIN">HR Administrator</option>
                <option value="ACCOUNTS_ADMIN">Accounts Administrator</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select
                value={editFormData.departmentId}
                onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Designation (free text) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
              <input
                type="text"
                value={editFormData.designationTitle}
                onChange={(e) => setEditFormData({ ...editFormData, designationTitle: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Employment Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
              <select
                value={editFormData.employmentStatus}
                onChange={(e) => setEditFormData({ ...editFormData, employmentStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="NOTICE_PERIOD">Notice Period</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Type</label>
              <select
                value={editFormData.employmentType}
                onChange={(e) => setEditFormData({ ...editFormData, employmentType: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>

            {/* Work Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Location</label>
              <select
                value={editFormData.workLocation}
                onChange={(e) => setEditFormData({ ...editFormData, workLocation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="OFFICE">Office (In-Person)</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>

            {/* Basic Salary */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Basic Salary (INR)</label>
              <input
                type="number"
                value={editFormData.basicSalary}
                onChange={(e) => setEditFormData({ ...editFormData, basicSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* HRA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">HRA (INR)</label>
              <input
                type="number"
                value={editFormData.hra}
                onChange={(e) => setEditFormData({ ...editFormData, hra: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Special Allowance */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Special Allowance (INR)</label>
              <input
                type="number"
                value={editFormData.specialAllowance}
                onChange={(e) => setEditFormData({ ...editFormData, specialAllowance: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* CTC */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Annual CTC (INR)</label>
              <input
                type="number"
                value={editFormData.ctc}
                onChange={(e) => setEditFormData({ ...editFormData, ctc: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
              <input
                type="text"
                value={editFormData.bankName}
                onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                placeholder="HDFC Bank"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
              <input
                type="text"
                value={editFormData.accountNumber}
                onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* IFSC */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">IFSC Code</label>
              <input
                type="text"
                value={editFormData.ifscCode}
                onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value })}
                placeholder="HDFC0001234"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* PAN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PAN Number</label>
              <input
                type="text"
                value={editFormData.panNumber}
                onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value })}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
