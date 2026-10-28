import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  BarChart3,
  Users,
  CheckCircle2,
  Building2,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanySettingsContext';
import staticLogo from '../assets/company-logo.png';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { settings } = useCompanySettings();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const currentLogo = settings.companyLogo || staticLogo;
  const companyName = settings.companyName || 'DivineCore Technologies Pvt. Ltd.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success(`Welcome to ${companyName}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 flex items-stretch text-slate-800 font-sans relative overflow-hidden select-none">
      {/* Decorative Soft Ambient Gradients */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[30%] w-[500px] h-[500px] bg-indigo-100/60 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-5%] w-[450px] h-[450px] bg-sky-100/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Micro-Grid Layer */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full flex flex-col lg:flex-row relative z-10">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Clean Executive Showcase                      */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:w-[54%] xl:w-[56%] flex-col justify-between p-12 xl:p-16 border-r border-slate-200/80 bg-white/60 backdrop-blur-md">
          {/* Top Brand Tag */}
          <div className="flex items-center">
            <img
              src={currentLogo}
              alt={companyName}
              className="h-12 sm:h-14 w-auto max-w-[280px] object-contain"
            />
          </div>

          {/* Central Hero Pitch & Dynamic Visual Highlights */}
          <div className="my-auto py-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span>Enterprise HRMS &bull; Real-Time Workforce Suite</span>
            </div>

            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Streamline operations, <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                empower your workforce.
              </span>
            </h1>

            <p className="mt-4 text-sm xl:text-base text-slate-600 leading-relaxed">
              Unified workplace suite for precision attendance tracking, automated leave workflows,
              department governance, and real-time organizational analytics.
            </p>

            {/* Feature Bento Grid (Clean White Cards) */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-900 tracking-wide">Automated Attendance</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Instant punch-ins, overtime calculations, and shift grace policies.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-900 tracking-wide">Department Rosters</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Hierarchical team structures, manager approvals &amp; leave balance audits.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-900 tracking-wide">Analytics &amp; Exports</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  One-click salary sheets, compliance logs, and exportable attendance reports.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all group">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-900 tracking-wide">Enterprise Security</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Role-based access governance with immutable audit trail records.
                </p>
              </div>
            </div>

            {/* Live Uptime Badge */}
            <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
                    AD
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
                    HR
                  </div>
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
                    EM
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">99.98% System Uptime</p>
                  <p className="text-[10px] text-slate-500">Verified shift sync across all devices</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Bottom Security / Copyright Banner */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>&copy; {new Date().getFullYear()} {companyName}</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> 256-bit SSL Encrypted
              </span>
              <span>&bull;</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Pristine White Auth Card                     */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 sm:px-12 xl:px-16 relative">
          <div className="w-full max-w-md">
            {/* Mobile Header Brand (Visible on mobile & tablet) */}
            <div className="text-center lg:hidden mb-8">
              <img
                src={currentLogo}
                alt={companyName}
                className="h-12 sm:h-14 w-auto max-w-[240px] mx-auto object-contain mb-3"
              />
              <h2 className="text-xl font-bold text-slate-900">{companyName}</h2>
              <p className="text-xs text-slate-500 mt-1">Enterprise Workplace HRMS Suite</p>
            </div>

            {/* Auth Pure White Card */}
            <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/60">
              {/* Form Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  Sign in with your corporate credentials to access your portal.
                </p>
              </div>

              {/* Main Login Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Official Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Account Password
                    </label>
                    <span className="text-[11px] text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-50 border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition"
                    />
                    <span className="text-xs text-slate-600 font-medium">Remember on this device</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">TLS 1.3 Secure</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Workplace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Hint */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500">
                  Protected by multi-factor security and encrypted session tokens.
                </p>
                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Authorized organizational personnel only</span>
                </div>
              </div>
            </div>

            {/* Bottom Help Footer */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Need assistance? Contact your system HR administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
