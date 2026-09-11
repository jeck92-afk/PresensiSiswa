import React, { useState, useEffect } from 'react';
import {
  School,
  QrCode,
  CreditCard,
  FileSpreadsheet,
  Users,
  UploadCloud,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  ShieldCheck,
  UserCheck,
  UserX,
  FileText,
  BarChart3,
  Building2,
  Layers,
  ChevronRight,
  Printer,
  Download,
  Activity,
  Zap,
  Database,
  HardDrive,
  CloudCheck,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolConfig } from '../types';
import { SpreadsheetInfo } from '../services/googleSheetsService';
import { getTodayDateString } from '../data/initialData';
import { getCurrentTimeString, getTimeZoneIana, getTimeZoneLabel } from '../utils/time';
import { downloadStudentExcelTemplate } from '../utils/studentParser';
import {
  getAdminWhatsAppUrl,
  formatDisplayPhone,
  DEFAULT_ADMIN_WA,
} from '../utils/whatsapp';
import { SchoolAttendance2DIllustration } from './illustrations/SchoolAttendance2DIllustration';
import { SchoolLogo } from './SchoolLogo';
import { AttendanceTrendChart } from './AttendanceTrendChart';
import { PWAInstallButton } from './common/PWAInstallButton';

interface AdminLandingViewProps {
  config: SchoolConfig;
  students: Student[];
  records: AttendanceRecord[];
  spreadsheetInfo?: SpreadsheetInfo | null;
  onNavigate: (tab: 'dashboard' | 'scanner' | 'cards' | 'logs' | 'students' | 'import' | 'sheets' | 'settings' | 'database') => void;
  onNavigateToCards: (studentId?: string) => void;
  onOpenDeveloperModal?: () => void;
}

export const AdminLandingView: React.FC<AdminLandingViewProps> = ({
  config,
  students,
  records,
  spreadsheetInfo,
  onNavigate,
  onNavigateToCards,
  onOpenDeveloperModal,
}) => {
  // Real-time digital clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayDateString();

  // Filter records for today
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayCheckInRecords = todayRecords.filter((r) => r.type === 'MASUK');
  const todayCheckOutRecords = todayRecords.filter((r) => r.type === 'PULANG');

  // Unique student check-in IDs
  const checkedInStudentIds = new Set(
    todayCheckInRecords
      .filter((r) => ['HADIR', 'TERLAMBAT'].includes(r.status))
      .map((r) => r.studentId)
  );

  const lateStudentIds = new Set(
    todayCheckInRecords
      .filter((r) => r.status === 'TERLAMBAT')
      .map((r) => r.studentId)
  );

  const onTimeStudentIds = new Set(
    todayCheckInRecords
      .filter((r) => r.status === 'HADIR')
      .map((r) => r.studentId)
  );

  const totalStudents = students.length;
  const attendedCount = checkedInStudentIds.size;
  const lateCount = lateStudentIds.size;
  const onTimeCount = onTimeStudentIds.size;
  const absentCount = Math.max(0, totalStudents - attendedCount);
  const attendanceRate = totalStudents > 0 ? Math.round((attendedCount / totalStudents) * 100) : 0;

  // Gender breakdown
  const maleStudentsCount = students.filter((s) => s.gender === 'L').length;
  const femaleStudentsCount = students.filter((s) => s.gender === 'P').length;

  // Class breakdown
  const classList = Array.from(new Set(students.map((s) => s.className))).sort();
  const classStats = classList.map((cls) => {
    const studentsInClass = students.filter((s) => s.className === cls);
    const attendedInClass = studentsInClass.filter((s) => checkedInStudentIds.has(s.id)).length;
    const rate = studentsInClass.length > 0 ? Math.round((attendedInClass / studentsInClass.length) * 100) : 0;
    return {
      name: cls,
      total: studentsInClass.length,
      attended: attendedInClass,
      rate,
    };
  });

  // Recent 6 attendance scans
  const recentActivities = [...todayRecords]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  // Formatted date and time strings in school timezone (default WIT)
  const tzIana = getTimeZoneIana(config.timeZone);
  const tzLabel = getTimeZoneLabel(config.timeZone);

  const formattedDateIndo = currentTime.toLocaleDateString('id-ID', {
    timeZone: tzIana,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTimeIndo = getCurrentTimeString(currentTime, true, tzLabel);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Executive Welcome & Institutional Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-lg border border-slate-800">
        {/* Background Subtle Gradient Accents */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-9">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-4">
              {/* Institution & SIADIK Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-extrabold tracking-wide">SIADIK • SISTEM ABSENSI DIGITAL KITA</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300">NPSN {config.schoolNpsn}</span>
              </div>

              {/* Title & Subtitle */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Logo Provinsi Maluku */}
                <div
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white/95 border-2 border-slate-700/80 p-1.5 shadow-lg shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-emerald-500/30"
                  title="Pemerintah Provinsi Maluku"
                >
                  <img
                    src={config.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
                    alt="Lambang Provinsi Maluku"
                    className="w-full h-full object-contain drop-shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Logo Satuan Pendidikan */}
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border-2 border-slate-700/80 p-1.5 shadow-lg shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-blue-500/20">
                  <SchoolLogo
                    src={config.schoolLogoUrl}
                    alt={config.schoolName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-emerald-400">
                    Pemerintah Provinsi Maluku
                  </div>
                  <h1 className="font-serif-academic text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                    {config.schoolName}
                  </h1>
                  <div className="text-xs sm:text-sm font-black tracking-wide text-cyan-300 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>SIADIK (SISTEM ABSENSI DIGITAL KITA)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                <strong className="text-white font-semibold">SIADIK (SISTEM ABSENSI DIGITAL KITA)</strong> adalah sistem presensi cerdas berbasis QR Code digital terpadu. Pantau kehadiran siswa real-time, cetak kartu tanda pelajar resmi berbarcode, kirim laporan WhatsApp wali murid, dan sinkronisasi otomatis dengan Google Sheets.
              </p>

              {/* Academic info chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
                <div className="inline-flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>T.A. {config.academicYear} ({config.semester})</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Batas Masuk: <strong className="text-white font-mono">{config.entryTimeLimit || config.checkInDeadline || '07:15'} {tzLabel}</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kepsek: {config.headmasterName}</span>
                </div>
                {/* Admin WhatsApp Direct Link Chip */}
                <a
                  href={getAdminWhatsAppUrl(
                    config.adminWhatsApp || DEFAULT_ADMIN_WA,
                    `Halo Admin Presensi ${config.schoolName}, saya membutuhkan bantuan terkait sistem presensi.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-950/90 hover:bg-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-500/50 text-emerald-300 hover:text-white transition-all shadow-xs group"
                  title="Klik untuk membuka chat WhatsApp Admin secara langsung"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>WA Admin: <strong className="font-mono font-bold text-white">{formatDisplayPhone(config.adminWhatsApp || DEFAULT_ADMIN_WA)}</strong></span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded font-bold">Langsung</span>
                </a>
              </div>

              {/* Professional Hero Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer border border-blue-400/30"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-cyan-200 group-hover:scale-110 transition-transform">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span>Buka Pemindai QR Gerbang</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToCards()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 hover:text-white text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Cetak Kartu Siswa</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('logs')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 hover:text-white text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Rekap Presensi</span>
                </button>

                {/* Direct WhatsApp Admin Action Button */}
                <a
                  href={getAdminWhatsAppUrl(
                    config.adminWhatsApp || DEFAULT_ADMIN_WA,
                    `Halo Admin Presensi ${config.schoolName}, saya membutuhkan bantuan terkait sistem presensi.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm border border-emerald-400/50 transition-all cursor-pointer shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
                  title="Hubungi Admin WhatsApp Langsung (085211798843)"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-100" />
                  <span>Chat WA Admin</span>
                </a>
              </div>
            </div>

            {/* Right Side: Attractive 2D Vector Illustration & Live Digital Clock */}
            <div className="lg:col-span-5 flex flex-col items-center">
              {/* Clock Floating Header */}
              <div className="w-full flex items-center justify-between mb-3 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/70 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Waktu Real-Time
                  </span>
                </div>
                <div className="text-sm font-black font-mono text-emerald-400">
                  {formattedTimeIndo} <span className="text-[10px] text-slate-400 font-sans">{tzLabel}</span>
                </div>
              </div>

              {/* 2D Vector Art Container */}
              <div className="relative w-full rounded-2xl p-2 bg-gradient-to-b from-slate-800/50 to-slate-900/80 border border-slate-700/60 shadow-inner group">
                <SchoolAttendance2DIllustration className="w-full h-auto max-h-[260px] drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.01]" />
                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-cyan-300 border border-cyan-500/30 backdrop-blur-xs">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Siswa Hadir Hari Ini: {attendedCount} dari {totalStudents} ({attendanceRate}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Offline App Banner */}
      <PWAInstallButton variant="banner" />

      {/* Quick Interactive Command Toolbar (Menu Tombol Cepat) */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-slate-200/90">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Aksi Cepat Presensi & Administrasi
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Klik tombol untuk navigasi instan
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="truncate font-extrabold text-blue-900">Pemindai QR</div>
              <div className="text-[10px] text-blue-700/80 truncate">Scan Gerbang</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToCards()}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-purple-900 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="truncate font-extrabold text-purple-900">Cetak Kartu</div>
              <div className="text-[10px] text-purple-700/80 truncate">{totalStudents} Siswa</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('logs')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-900 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="truncate font-extrabold text-emerald-900">Rekap Presensi</div>
              <div className="text-[10px] text-emerald-700/80 truncate">Harian, Bulanan</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-900 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="truncate font-extrabold text-indigo-900">Data Siswa</div>
              <div className="text-[10px] text-indigo-700/80 truncate">X, XI, XII IPAS</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('import')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="truncate font-extrabold text-amber-900">Upload Data</div>
              <div className="text-[10px] text-amber-700/80 truncate">Excel & CSV</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('database')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100/80 text-cyan-900 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="truncate font-extrabold text-cyan-900">Database Lokal</div>
              <div className="text-[10px] text-cyan-700/80 truncate">Offline & Backup</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('sheets')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 text-teal-900 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Database className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="truncate font-extrabold text-teal-900">Google Sheets</div>
              <div className="text-[10px] text-teal-700/80 truncate">
                {spreadsheetInfo ? 'Tersinkron' : 'Hubungkan'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Siswa */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Siswa Terdaftar
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalStudents}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="font-semibold text-blue-700">{maleStudentsCount} L</span>
              <span>•</span>
              <span className="font-semibold text-pink-700">{femaleStudentsCount} P</span>
              <span>•</span>
              <span>{classList.length} Kelas</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <span>Kelola Data Siswa</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Metric 2: Tingkat Kehadiran Hari Ini */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Presensi Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {attendanceRate}%
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                ({attendedCount}/{totalStudents} Siswa)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('logs')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>Buka Rekapitulasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Metric 3: Rincian Ketepatan Waktu */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kualitas Kehadiran
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Tepat Waktu:
              </span>
              <span className="font-bold font-mono text-slate-900">{onTimeCount} Siswa</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Terlambat:
              </span>
              <span className="font-bold font-mono text-amber-700">{lateCount} Siswa</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Belum Scan:
              </span>
              <span className="font-bold font-mono text-slate-500">{absentCount} Siswa</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('logs')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
          >
            <span>Daftar Siswa Terlambat</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Metric 4: Kartu Pelajar & QR Code */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Kartu Pelajar
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalStudents}{' '}
              <span className="text-xs font-normal text-slate-500">Kartu Siap</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Setiap siswa telah dilengkapi kode QR presensi unik & stempel resmi.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToCards()}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 hover:text-purple-800 transition-colors cursor-pointer"
          >
            <span>Cetak Kartu Siswa</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2b. Visualisasi Data Tren Kehadiran Siswa 7 Hari Terakhir (Recharts) */}
      <AttendanceTrendChart
        students={students}
        records={records}
        config={config}
        onNavigateToRecap={() => onNavigate('logs')}
      />

      {/* 3. Status Database Cloud Google Spreadsheet Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xs border border-emerald-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Basis Data Google Spreadsheet
              </h3>
              {spreadsheetInfo ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Terhubung & Sinkron
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Mode Lokal
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
              {spreadsheetInfo
                ? `Tersambung ke lembar kerja "${spreadsheetInfo.title}". Presensi baru otomatis dicatat ke Google Sheets.`
                : 'Simpan daftar siswa dan log presensi harian langsung ke Google Drive & Sheets resmi sekolah Anda secara online.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          {spreadsheetInfo?.url && (
            <a
              href={spreadsheetInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/15"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Sheets</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => onNavigate('sheets')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-950" />
            <span>{spreadsheetInfo ? 'Kelola Database' : 'Hubungkan Sheets'}</span>
          </button>
        </div>
      </div>

      {/* 4. Pusat Aksi Cepat Admin (Admin Hub Shortcuts) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Pusat Aksi Cepat Administrator
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Pilih menu kerja utama untuk mengelola operasional presensi sekolah harian Anda
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
            7 Modul Terhubung
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Action 1: Scanner Gerbang */}
          <div
            onClick={() => onNavigate('scanner')}
            className="group p-5 rounded-2xl border border-slate-200/90 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
              Pemindai QR Gerbang
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Buka kamera pemindai gerbang kedatangan dan kepulangan dengan viewfinder optik dan verifikasi audio.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Buka Terminal Scanner</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Action 2: Upload File Siswa */}
          <div
            onClick={() => onNavigate('import')}
            className="group p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Upload File Data Siswa
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Baru
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Impor massal dari file Microsoft Excel (.xlsx, .xls) atau CSV dengan deteksi kolom otomatis dan template.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
              <span>Unggah Berkas Siswa</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Action 3: Cetak Kartu Pelajar */}
          <div
            onClick={() => onNavigateToCards()}
            className="group p-5 rounded-2xl border border-slate-200/90 hover:border-purple-400 bg-white hover:bg-purple-50/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
              Cetak Kartu Tanda Pelajar
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Desain kartu identitas siswa resmi siap cetak lengkap dengan barcode QR NIS, kop sekolah, dan stempel kepala sekolah.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform">
              <span>Pratinjau & Cetak Kartu</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Action 4: Rekapitulasi Presensi */}
          <div
            onClick={() => onNavigate('logs')}
            className="group p-5 rounded-2xl border border-slate-200/90 hover:border-amber-400 bg-white hover:bg-amber-50/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
              Rekapitulasi & Laporan Kehadiran
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pantau log kehadiran harian, filter menurut tanggal dan kelas, serta ekspor file laporan ke Excel (.XLSX) dan CSV.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
              <span>Lihat Log & Ekspor Laporan</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Action 5: Kelola Siswa */}
          <div
            onClick={() => onNavigate('students')}
            className="group p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
              Database Siswa & Rombel
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Manajemen master data siswa: tambah data perorangan, perbarui kelas, nomor wali murid, dan pencarian NIS/NISN.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform">
              <span>Buka Master Siswa ({students.length})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Action 6: Pengaturan Sekolah */}
          <div
            onClick={() => onNavigate('settings')}
            className="group p-5 rounded-2xl border border-slate-200/90 hover:border-slate-400 bg-white hover:bg-slate-50/70 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-800 text-slate-700 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-slate-800 transition-colors">
              Pengaturan & Jam Operasional
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Atur batas waktu keterlambatan ({config.checkInDeadline || '07:15'} {tzLabel}), jam kepulangan, nama kepala sekolah, NIP, dan identitas institusi.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-slate-700 group-hover:translate-x-1 transition-transform">
              <span>Buka Konfigurasi Sekolah</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Action 7: Basis Data Google Spreadsheet */}
          <div
            onClick={() => onNavigate('sheets')}
            className="group p-5 rounded-2xl border border-slate-200/90 hover:border-teal-400 bg-white hover:bg-teal-50/40 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative sm:col-span-2 lg:col-span-1"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 group-hover:bg-teal-600 text-teal-600 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">
                Basis Data Google Spreadsheet
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                spreadsheetInfo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {spreadsheetInfo ? 'Online' : 'Cloud'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sinkronisasi real-time dua arah ke Google Sheets. Simpan data siswa & rekap presensi otomatis ke Google Drive sekolah.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
              <span>{spreadsheetInfo ? 'Kelola Database Sheets' : 'Hubungkan Spreadsheet'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Monitoring Kehadiran Per Kelas & Feed Aktivitas Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Kehadiran Per Kelas */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Monitoring Kehadiran Per Kelas (Rombel)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Hari Ini: {todayStr}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {classStats.map((c) => (
              <div key={c.name} className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-32">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{c.name}</span>
                    {c.rate === 100 && (
                      <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        100% Hadir
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Total: {c.total} Siswa
                  </div>
                </div>

                {/* Progress bar in middle */}
                <div className="flex-1 max-w-xs hidden sm:block">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        c.rate >= 80
                          ? 'bg-emerald-500'
                          : c.rate >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${c.rate}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black font-mono text-slate-800">
                    {c.attended} / {c.total}
                  </div>
                  <div
                    className={`text-[10px] font-bold font-mono ${
                      c.rate >= 80 ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {c.rate}% Hadir
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rombel terdaftar diperbarui otomatis dari master data</span>
            <button
              type="button"
              onClick={() => onNavigate('logs')}
              className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Filter Berdasarkan Kelas →
            </button>
          </div>
        </div>

        {/* Right 1 Col: Live Activity Stream */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Aktivitas Presensi Terkini
                </h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live stream aktif" />
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                Belum ada siswa yang melakukan pemindaian presensi hari ini.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {act.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {act.className} • NIS {act.nis}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono font-bold text-slate-700">
                        {getCurrentTimeString(act.timestamp, false, tzLabel)} {tzLabel}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          act.status === 'HADIR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.status === 'TERLAMBAT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Total {todayRecords.length} Catatan Hari Ini
            </span>
            <button
              type="button"
              onClick={() => onNavigate('logs')}
              className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Semua Log Presensi →
            </button>
          </div>
        </div>
      </div>

      {/* 5. Panduan Singkat Prosedur Operasional Presensi Sekolah */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-cyan-200">
                Prosedur & Alur Kerja Standar Operasional (SOP Presensi)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Ikuti 4 tahapan ringkas berikut untuk menjalankan siklus presensi harian di sekolah Anda:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadStudentExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Template Siswa (.XLSX)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl relative">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs font-mono mb-3">
              01
            </div>
            <div className="text-xs font-extrabold text-white">1. Siapkan & Unggah Data</div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Unduh template Excel resmi, isi daftar nama, NIS, dan kelas siswa, lalu unggah melalui menu Upload Siswa.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl relative">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs font-mono mb-3">
              02
            </div>
            <div className="text-xs font-extrabold text-white">2. Cetak Kartu Pelajar QR</div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Buka menu Kartu Pelajar, pilih kelas, dan cetak kartu siswa dengan kop resmi dan QR Code unik NIS.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono mb-3">
              03
            </div>
            <div className="text-xs font-extrabold text-white">3. Jalankan Terminal Gerbang</div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Arahkan layar monitor atau webcam di pos gerbang sekolah pada menu Pemindai QR saat jam masuk siswa.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl relative">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs font-mono mb-3">
              04
            </div>
            <div className="text-xs font-extrabold text-white">4. Rekap & Ekspor Laporan</div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Pantau siswa yang terlambat atau belum hadir secara real-time, lalu unduh laporan harian ke format Excel.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Pusat Layanan & Pengembang Aplikasi (Jecky Marantika, S.Pd., Gr) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Developer Photo */}
          <div
            className="relative group shrink-0 cursor-pointer"
            onClick={onOpenDeveloperModal}
            title="Klik untuk melihat profil lengkap pengembang"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-lg ring-2 ring-emerald-500/80 overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src={config.developerPhotoUrl || '/developer_jecky.svg'}
                alt={config.developerName || 'Jecky Marantika, S.Pd., Gr'}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-slate-900"
              title="Guru Profesional Terverifikasi (Gr)"
            >
              ✓
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Pengembang Aplikasi Presensi
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                Guru Profesional (Gr)
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">
                Provinsi Maluku
              </span>
            </div>
            <h3
              className="text-base sm:text-xl font-bold text-white mt-1 font-serif-academic cursor-pointer hover:text-emerald-300 transition-colors flex items-center gap-2"
              onClick={onOpenDeveloperModal}
            >
              <span>{config.developerName || 'Jecky Marantika, S.Pd., Gr'}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              {config.developerTitle || 'Pengembang Aplikasi & Fasilitator Digitalisasi Pembelajaran'}. Siap memberikan pendampingan teknis scanner presensi QR, cetak kartu pelajar ISO 7810 ID-1, dan sinkronisasi Google Sheets.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-3">
          <a
            href={getAdminWhatsAppUrl(
              config.developerWhatsApp || config.adminWhatsApp || DEFAULT_ADMIN_WA,
              `Halo Bapak Jecky Marantika, S.Pd., Gr, saya menghubungi Anda terkait Aplikasi Presensi ${config.schoolName}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-slate-950" />
            <span>Chat WhatsApp Pengembang</span>
          </a>

          {onOpenDeveloperModal && (
            <button
              type="button"
              onClick={onOpenDeveloperModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <span>Detail Profil</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
