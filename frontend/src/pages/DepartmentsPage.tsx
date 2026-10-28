import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Shield, Briefcase } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Department, Designation } from '../types';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const DepartmentsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);

  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [desigForm, setDesigForm] = useState({ name: '', code: '', level: 1, departmentId: '' });

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
        if (res.data.data.length > 0 && !desigForm.departmentId) {
          setDesigForm((prev) => ({ ...prev, departmentId: res.data.data[0].id }));
        }
      }
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/departments', deptForm);
      if (res.data.success) {
        toast.success('Department created!');
        setIsDeptModalOpen(false);
        setDeptForm({ name: '', code: '', description: '' });
        fetchDepartments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleCreateDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/departments/designations', desigForm);
      if (res.data.success) {
        toast.success('Designation created!');
        setIsDesigModalOpen(false);
        setDesigForm({ name: '', code: '', level: 1, departmentId: departments[0]?.id || '' });
        fetchDepartments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create designation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Departments & Designations
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure company divisions, organizational hierarchies, and job bands.
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'HR_ADMIN') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
            <button
              onClick={() => setIsDesigModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              <span>Add Designation</span>
            </button>
          </div>
        )}
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {dept.code}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                    {dept.name}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                  {dept._count?.employees || 0}
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {dept.description || 'Core organizational business division.'}
              </p>

              {/* Designations list */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Active Designations ({dept.designations?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {dept.designations?.map((des) => (
                    <div
                      key={des.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-[#0E1B2D]"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {des.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Level {des.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>{dept._count?.employees || 0} Employees</span>
              </span>
              <span className="text-emerald-500 font-semibold text-[11px]">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add New Department"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Artificial Intelligence & Data"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Code (2-6 letters) *
            </label>
            <input
              type="text"
              required
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              placeholder="AID"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white uppercase font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder="Primary responsibilities and mandate..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md"
            >
              Create Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Designation Modal */}
      <Modal
        isOpen={isDesigModalOpen}
        onClose={() => setIsDesigModalOpen(false)}
        title="Add Designation / Title"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDesig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Department *
            </label>
            <select
              value={desigForm.departmentId}
              onChange={(e) => setDesigForm({ ...desigForm, departmentId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Designation Title *
            </label>
            <input
              type="text"
              required
              value={desigForm.name}
              onChange={(e) => setDesigForm({ ...desigForm, name: e.target.value })}
              placeholder="e.g. Lead DevOps Engineer"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation Code *
              </label>
              <input
                type="text"
                required
                value={desigForm.code}
                onChange={(e) => setDesigForm({ ...desigForm, code: e.target.value.toUpperCase() })}
                placeholder="LDE"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hierarchy Level (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={desigForm.level}
                onChange={(e) => setDesigForm({ ...desigForm, level: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDesigModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md"
            >
              Create Designation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
