import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  QrCode,
  MessageSquare,
  FileSpreadsheet,
  HelpCircle,
  KeyRound,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { SchoolConfig, AdminAccount } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { authenticateAdmin, getAdminAccounts } from '../utils/authService';
import { getAdminWhatsAppUrl, formatDisplayPhone, DEFAULT_ADMIN_WA } from '../utils/whatsapp';
import { getCurrentTimeString } from '../utils/time';

interface AdminLoginViewProps {
  config: SchoolConfig;
  onLoginSuccess: (user: AdminAccount) => void;
  onOpenDeveloperModal?: () => void;
  isDarkMode?: boolean;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  config,
  onLoginSuccess,
  onOpenDeveloperModal,
  isDarkMode = false,
}) => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState<string>(() =>
    getCurrentTimeString(undefined, true, config.timeZone || 'WIT')
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeString(undefined, true, config.timeZone || 'WIT'));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.timeZone]);

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Realistic authentication delay for smooth UI feedback
    setTimeout(() => {
      const result = authenticateAdmin(username, password, rememberMe);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message);
      }
    }, 600);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Gradient Rings & Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/25 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-600/10 blur-[160px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* 1. Top Government Ribbon */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {/* Provincial Maluku Logo */}
            {config.showProvincialLogo && (
              <div className="w-7 h-8 shrink-0 flex items-center justify-center">
                <img
                  src={config.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
                  alt="Logo Provinsi Maluku"
                  className="w-full h-full object-contain filter drop-shadow"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // fallback
                    (e.target as HTMLImageElement).src = '/logo_provinsi_maluku.png';
                  }}
                />
              </div>
            )}
            <div>
              <div className="font-extrabold text-white tracking-wide text-xs sm:text-sm uppercase flex items-center gap-2">
                <span>Pemerintah Provinsi Maluku</span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="hidden sm:inline-block text-slate-400 font-semibold normal-case">
                  Dinas Pendidikan dan Kebudayaan
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Satuan Pendidikan: <strong className="text-slate-200">{config.schoolName}</strong> (NPSN: {config.schoolNpsn})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Live Clock Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono shadow-inner text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wider">{currentTime}</span>
              <span className="text-[10px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {config.timeZone || 'WIT'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Sistem Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Login Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Column: Institutional Identity & Key Features */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* School & Application Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-blue-900/50 to-indigo-900/40 border border-blue-700/40 text-blue-300 shadow-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-wide">PORTAL OTENTIKASI RESMI TERENKRIPSI</span>
            </div>

            {/* School Branding */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-slate-900/90 p-3 border border-slate-700 shadow-2xl flex items-center justify-center shrink-0">
                <SchoolLogo
                  src={config.schoolLogoUrl || '/school_logo.svg'}
                  alt={config.schoolName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  SIADIK
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-blue-400 uppercase tracking-wider mt-0.5">
                  Sistem Absensi Digital Kita
                </p>
                <p className="text-xs text-slate-300 mt-1 font-medium line-clamp-1">
                  {config.schoolName} • T.A. {config.academicYear}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
              Gerbang digitalisasi presensi presisi tinggi berbasis pemindaian QR Code cerdas, pelaporan otomatis orang tua, integrasi spreadsheet awan, dan rekapitulasi standar Dinas Pendidikan.
            </p>

            {/* Key Value Propositions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Scan QR Presisi</h4>
                  <p className="text-[11px] text-slate-400">Pemindaian cepat kartu barcode &amp; QR siswa</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Notifikasi WhatsApp</h4>
                  <p className="text-[11px] text-slate-400">Laporan instan kehadiran ke orang tua</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Ekspor CSV &amp; Excel</h4>
                  <p className="text-[11px] text-slate-400">Format resmi Dinas Pendidikan &amp; Dapodik</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Role-Based Access</h4>
                  <p className="text-[11px] text-slate-400">Akses aman Admin, Operator, &amp; Kepsek</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Professional Admin Login Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
              
              {/* Card Header */}
              <div className="mb-6 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Masuk Administrator</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Sesi Aman SSL
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Autentikasi Pengguna
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan nama pengguna (username) dan kata sandi Anda untuk mengelola sistem SIADIK.
                </p>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4.5 text-left">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nama Pengguna / NIP / Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username (contoh: admin)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs sm:text-sm font-medium placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Kata Sandi (Password)
                    </label>
                    {capsLockActive && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                        <ShieldAlert className="w-3 h-3" />
                        Caps Lock Aktif
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs sm:text-sm font-medium placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer transition-colors"
                      title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Help Links */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700 w-4 h-4 cursor-pointer"
                    />
                    <span>Ingat Saya di Perangkat Ini</span>
                  </label>

                  <a
                    href={getAdminWhatsAppUrl(
                      config.adminWhatsApp || DEFAULT_ADMIN_WA,
                      `Halo Admin SIADIK ${config.schoolName}, saya memerlukan bantuan terkait akun login presensi.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Butuh Bantuan?</span>
                  </a>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 focus:ring-4 focus:ring-blue-500/30 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Kredensial...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem SIADIK</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 3. Quick Demo Credentials Section */}
              <div className="mt-6 pt-5 border-t border-slate-800 text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Akun Terdaftar (Klik untuk Mengisi):</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {getAdminAccounts().slice(0, 3).map((acc) => {
                    const roleColor =
                      acc.role === 'Super Admin'
                        ? 'text-blue-400 group-hover:text-blue-300'
                        : acc.role === 'Operator Presensi'
                        ? 'text-emerald-400 group-hover:text-emerald-300'
                        : 'text-purple-400 group-hover:text-purple-300';

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleQuickFill(acc.username, acc.passwordHash)}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 text-left transition-all cursor-pointer group"
                      >
                        <div className={`text-[10px] font-extrabold ${roleColor} truncate`}>
                          {acc.role}
                        </div>
                        <div className="text-[11px] font-bold text-slate-200 truncate mt-0.5">
                          {acc.fullName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {acc.nip ? `NIP: ${acc.nip}` : `@${acc.username}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Developer & System Meta */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Versi Aplikasi: <strong>v3.2.0 (SIADIK PRO)</strong></span>
                {onOpenDeveloperModal && (
                  <button
                    type="button"
                    onClick={onOpenDeveloperModal}
                    className="text-slate-400 hover:text-slate-200 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Profil Pengembang</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/90 py-3 px-4 sm:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 <strong>SIADIK</strong> • {config.schoolName}. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>Pemerintah Provinsi Maluku</span>
            <span>•</span>
            <span>Dinas Pendidikan dan Kebudayaan</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
