import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Clock,
  Save,
  ImagePlus,
  Trash2,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanySettingsContext';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { settings, refresh } = useCompanySettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);

  // Logo state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoChanged, setLogoChanged] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!loading) return;
    setCompanyName(settings.companyName);
    setWorkStartTime(settings.workStartTime);
    setWorkEndTime(settings.workEndTime);
    setGracePeriodMinutes(settings.gracePeriodMinutes);
    setLogoPreview(settings.companyLogo);
    setLoading(false);
  }, [settings]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, SVG, WEBP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      setLogoChanged(true);
      setLogoRemoved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoChanged(false);
    setLogoRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('SUPER_ADMIN')) {
      toast.error('Only Super Admins can update organizational settings');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        companyName,
        workStartTime,
        workEndTime,
        gracePeriodMinutes: Number(gracePeriodMinutes),
      };

      if (logoChanged) {
        payload.companyLogo = logoPreview; // base64 data URL
      } else if (logoRemoved) {
        payload.companyLogo = null;
      }

      const res = await api.put('/settings', payload);
      if (res.data.success) {
        toast.success('Company settings saved successfully!');
        setLogoChanged(false);
        setLogoRemoved(false);
        await refresh(); // Update global context instantly
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = hasRole('SUPER_ADMIN');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Company &amp; System Settings
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Configure your organization's identity, branding, and attendance shift parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── Organization Identity ─── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Organization Identity</h2>
              <p className="text-xs text-slate-500">Name and branding used across portals, slips, and reports</p>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Company / Organization Legal Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!isAdmin}
              placeholder="e.g. Acme Global Technologies Pvt. Ltd."
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          {/* Company Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Company Logo
            </label>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Preview Box */}
              <div className="flex-shrink-0">
                <div className="w-36 h-20 rounded-2xl bg-slate-100 dark:bg-[#0E1B2D] border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Company Logo Preview"
                        className="w-full h-full object-contain p-2"
                      />
                      {isAdmin && (
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 rounded-lg bg-blue-600/90 text-white hover:bg-blue-500 transition-colors"
                            title="Change logo"
                          >
                            <ImagePlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 transition-colors"
                            title="Remove logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-slate-400 p-3">
                      <ImagePlus className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="text-[10px] leading-tight">No logo</p>
                    </div>
                  )}
                </div>
                {logoPreview && (
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">Current logo</p>
                )}
              </div>

              {/* Drop Zone / Upload Area */}
              {isAdmin && (
                <div
                  className={`flex-1 min-h-[80px] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 p-4 text-center
                    ${dragOver
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50 dark:bg-[#0E1B2D]/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Drop your logo here, or <span className="text-blue-500">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG, WEBP — max 2 MB</p>
                  </div>
                  {logoChanged && (
                    <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      New logo ready — save to apply
                    </div>
                  )}
                  {logoRemoved && (
                    <p className="text-amber-400 text-[11px] font-semibold">Logo will be removed on save</p>
                  )}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={!isAdmin}
            />

            <p className="mt-2 text-[11px] text-slate-400">
              The logo appears in the sidebar navigation. Recommended size: 300 × 80 px, transparent background.
            </p>
          </div>
        </div>

        {/* ─── Shift Timings & Attendance Policy ─── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Shift Timings &amp; Attendance Policy</h2>
              <p className="text-xs text-slate-500">Working hours and grace period used for late arrival tags</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Work Start Time (Shift In)
              </label>
              <input
                type="time"
                required
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Work End Time (Shift Out)
              </label>
              <input
                type="time"
                required
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                required
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value, 10) || 0)}
                disabled={!isAdmin}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Policy Rules Applied:</p>
            <p>&bull; Punches arriving after {workStartTime} + {gracePeriodMinutes} minutes are tagged as <strong>Late Arrival</strong>.</p>
            <p>&bull; <strong>Super Admins are exempt</strong> from punching in/out and are excluded from employee attendance rosters.</p>
          </div>
        </div>

        {/* Action Button */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Organization Settings</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
