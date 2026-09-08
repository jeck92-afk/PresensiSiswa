import { useState } from 'react';
import {
  FileSpreadsheet,
  CloudCheck,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Link2,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  UploadCloud,
  DownloadCloud,
  ShieldCheck,
  TableProperties,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Student, AttendanceRecord, SchoolConfig } from '../types';
import { getCurrentTimeString, getTimeZoneLabel } from '../utils/time';
import {
  googleSignIn,
  logoutGoogle,
  isAuthCancellation,
} from '../services/googleAuth';
import {
  SpreadsheetInfo,
  extractSpreadsheetId,
  getSpreadsheetDetails,
  createAttendanceSpreadsheet,
  pushAllDataToSpreadsheet,
  pullDataFromSpreadsheet,
} from '../services/googleSheetsService';

interface GoogleSheetsDatabaseViewProps {
  user: User | null;
  spreadsheetInfo: SpreadsheetInfo | null;
  config: SchoolConfig;
  students: Student[];
  records: AttendanceRecord[];
  onSetUser: (user: User | null) => void;
  onSetSpreadsheetInfo: (info: SpreadsheetInfo | null) => void;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateRecords: (records: AttendanceRecord[]) => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function GoogleSheetsDatabaseView({
  user,
  spreadsheetInfo,
  config,
  students,
  records,
  onSetUser,
  onSetSpreadsheetInfo,
  onUpdateStudents,
  onUpdateRecords,
  onShowNotification,
}: GoogleSheetsDatabaseViewProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    title?: string;
    sheets?: string[];
    error?: string;
  } | null>(null);

  // Custom confirmation modal states for destructive/mutating operations (Mandatory per Workspace skill)
  const [confirmPushOpen, setConfirmPushOpen] = useState(false);
  const [confirmPullOpen, setConfirmPullOpen] = useState(false);

  // Login handler
  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        onSetUser(res.user);
        onShowNotification(`Berhasil masuk sebagai ${res.user.displayName || res.user.email}`, 'success');
      }
    } catch (err: unknown) {
      if (isAuthCancellation(err)) {
        // User closed or dismissed the popup window, handle silently
        return;
      }
      console.error('Google login error:', err);
      const errMsg = err instanceof Error ? err.message : 'Gagal menghubungkan akun Google';
      onShowNotification(errMsg, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      onSetUser(null);
      onShowNotification('Berhasil keluar dari akun Google.', 'info');
    } catch (err: unknown) {
      console.error(err);
      onShowNotification('Gagal keluar dari akun Google', 'error');
    }
  };

  // 1-Click Create New Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!user) {
      onShowNotification('Silakan masuk dengan Google terlebih dahulu.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const defaultTitle = `Presensi Digital - ${config.schoolName} (${config.academicYear.split(' ')[0]})`;
      const res = await createAttendanceSpreadsheet(defaultTitle, config, students, records);

      if (res.success && res.spreadsheetId && res.spreadsheetUrl) {
        const tz = getTimeZoneLabel(config.timeZone);
        const newInfo: SpreadsheetInfo = {
          id: res.spreadsheetId,
          title: defaultTitle,
          url: res.spreadsheetUrl,
          lastSynced: `${getCurrentTimeString(new Date(), true, tz)} ${tz}`,
          autoSync: true,
        };
        onSetSpreadsheetInfo(newInfo);
        onShowNotification('Basis data Google Spreadsheet berhasil dibuat dan disinkronkan!', 'success');
      } else {
        onShowNotification(res.error || 'Gagal membuat spreadsheet baru', 'error');
      }
    } catch (err: unknown) {
      onShowNotification(err instanceof Error ? err.message : 'Kesalahan saat membuat spreadsheet', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Validate existing spreadsheet URL / ID
  const handleValidateUrl = async () => {
    if (!inputUrl.trim()) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const sId = extractSpreadsheetId(inputUrl);
      const details = await getSpreadsheetDetails(sId);
      if (details.success) {
        setValidationResult({
          valid: true,
          title: details.title,
          sheets: details.sheets,
        });
      } else {
        setValidationResult({
          valid: false,
          error: details.error,
        });
      }
    } catch (err: unknown) {
      setValidationResult({
        valid: false,
        error: err instanceof Error ? err.message : 'Terjadi kesalahan saat memeriksa tautan',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Link existing validated spreadsheet
  const handleLinkExistingSheet = () => {
    if (!validationResult?.valid) return;
    const sId = extractSpreadsheetId(inputUrl);
    const tz = getTimeZoneLabel(config.timeZone);
    const newInfo: SpreadsheetInfo = {
      id: sId,
      title: validationResult.title || 'Spreadsheet Presensi',
      url: `https://docs.google.com/spreadsheets/d/${sId}/edit`,
      lastSynced: `${getCurrentTimeString(new Date(), true, tz)} ${tz}`,
      autoSync: true,
    };
    onSetSpreadsheetInfo(newInfo);
    setInputUrl('');
    setValidationResult(null);
    onShowNotification(`Spreadsheet "${newInfo.title}" berhasil ditautkan sebagai basis data!`, 'success');
  };

  // Execute Push to Google Sheet
  const handleExecutePush = async () => {
    if (!spreadsheetInfo) return;
    setConfirmPushOpen(false);
    setIsSyncing(true);

    try {
      const res = await pushAllDataToSpreadsheet(spreadsheetInfo.id, students, records, config);
      if (res.success) {
        const tz = getTimeZoneLabel(config.timeZone);
        onSetSpreadsheetInfo({
          ...spreadsheetInfo,
          lastSynced: `${getCurrentTimeString(new Date(), true, tz)} ${tz}`,
        });
        onShowNotification('Seluruh data siswa dan presensi berhasil dikirim ke Google Spreadsheet!', 'success');
      } else {
        onShowNotification(res.error || 'Gagal mengirim data ke Google Sheets', 'error');
      }
    } catch (err: unknown) {
      onShowNotification(err instanceof Error ? err.message : 'Kesalahan sinkronisasi data', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Execute Pull from Google Sheet
  const handleExecutePull = async () => {
    if (!spreadsheetInfo) return;
    setConfirmPullOpen(false);
    setIsPulling(true);

    try {
      const res = await pullDataFromSpreadsheet(spreadsheetInfo.id);
      if (res.success && res.students) {
        if (res.students.length > 0) {
          onUpdateStudents(res.students);
        }
        if (res.records && res.records.length > 0) {
          onUpdateRecords(res.records);
        }
        const tz = getTimeZoneLabel(config.timeZone);
        onSetSpreadsheetInfo({
          ...spreadsheetInfo,
          lastSynced: `${getCurrentTimeString(new Date(), true, tz)} ${tz}`,
        });
        onShowNotification(
          `Berhasil menarik ${res.students.length} data siswa dan ${res.records?.length || 0} riwayat presensi dari Google Spreadsheet!`,
          'success'
        );
      } else {
        onShowNotification(res.error || 'Gagal mengambil data dari Google Sheets', 'error');
      }
    } catch (err: unknown) {
      onShowNotification(err instanceof Error ? err.message : 'Kesalahan membaca Google Sheets', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/60">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Database className="w-3.5 h-3.5" />
            Integrasi Basis Data Cloud
          </div>
          <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Basis Data Google Spreadsheet
          </h2>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Gunakan Google Sheets resmi sekolah Anda sebagai media penyimpanan utama. Seluruh log pemindaian kartu siswa, daftar murid, dan status keterlambatan tersimpan langsung di lembar kerja Google Anda secara *real-time*.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {spreadsheetInfo ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Status: Tersambung ke Google Spreadsheet
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs sm:text-sm font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Status: Basis Data Lokal (Belum Terhubung ke Google Sheets)
              </span>
            )}

            {spreadsheetInfo && (
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-emerald-950 text-xs sm:text-sm font-bold hover:bg-emerald-50 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Buka Google Sheets
                <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </a>
            )}
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 opacity-10 pointer-events-none hidden lg:block">
          <FileSpreadsheet className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Account Authentication Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Otorisasi Akun Google Workspace
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {user
                  ? `Terhubung sebagai ${user.displayName || user.email}`
                  : 'Masuk dengan akun Google untuk mengizinkan sinkronisasi data presensi ke Google Drive & Sheets.'}
              </p>
            </div>
          </div>

          <div>
            {!user ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full ring-2 ring-emerald-500"
                  />
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">{user.displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Keluar dari Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spreadsheet Connection Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Option 1: Create New Google Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              1. Buat Spreadsheet Presensi Baru (Otomatis)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Sistem akan membuat berkas Google Spreadsheet baru di Google Drive Anda dengan lembar kerja terstruktur:
            </p>

            <ul className="space-y-2 mb-6 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sheet <strong>DATA_SISWA</strong> (NISN, NIS, Nama, Kelas, Kontak, Alamat)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sheet <strong>REKAP_PRESENSI</strong> (Log masuk/pulang, waktu scan, status)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sheet <strong>KONFIGURASI</strong> (Identitas sekolah, jam toleransi, tahun ajaran)</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleCreateNewSheet}
            disabled={!user || isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sedang Membuat di Google Drive...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Buat Google Spreadsheet Sekarang
              </>
            )}
          </button>
        </div>

        {/* Option 2: Link Existing Google Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              2. Tautkan Google Spreadsheet yang Sudah Ada
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Sudah memiliki spreadsheet khusus sekolah di akun Google Anda? Tempelkan tautan atau ID spreadsheet di bawah ini.
            </p>

            <div className="space-y-3 mb-4">
              <label className="block text-xs font-semibold text-slate-700">
                Tautan / ID Google Spreadsheet:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0..."
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setValidationResult(null);
                  }}
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleValidateUrl}
                  disabled={!user || !inputUrl.trim() || isValidating}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isValidating ? 'Memeriksa...' : 'Cek Akses'}
                </button>
              </div>

              {validationResult && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    validationResult.valid
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {validationResult.valid ? (
                    <div className="space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" /> Spreadsheet Valid Ditemukan!
                      </p>
                      <p className="text-slate-700">Judul: <strong>{validationResult.title}</strong></p>
                      <p className="text-[11px] text-slate-500">
                        Sheet yang terdeteksi: {validationResult.sheets?.join(', ') || 'Belum ada tab'}
                      </p>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      {validationResult.error || 'Spreadsheet tidak dapat diakses atau ID tidak valid.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLinkExistingSheet}
            disabled={!validationResult?.valid}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            <Link2 className="w-4 h-4" />
            Tautkan Spreadsheet Ini
          </button>
        </div>
      </div>

      {/* Active Spreadsheet Management & Sync Controls */}
      {spreadsheetInfo && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Basis Data Terhubung
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{spreadsheetInfo.title}</h3>
              <p className="text-xs font-mono text-slate-400 truncate max-w-md mt-0.5">
                ID: {spreadsheetInfo.id}
              </p>
              {spreadsheetInfo.lastSynced && (
                <p className="text-xs text-slate-500 mt-1">
                  Sinkronisasi Terakhir:{' '}
                  <strong className="text-slate-700">
                    {spreadsheetInfo.lastSynced}
                    {spreadsheetInfo.lastSynced.includes('WIT') || spreadsheetInfo.lastSynced.includes('WIB') || spreadsheetInfo.lastSynced.includes('WITA')
                      ? ''
                      : ` ${getTimeZoneLabel(config.timeZone)}`}
                  </strong>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Buka di Google Sheets
              </a>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Lepaskan tautan Google Spreadsheet dari aplikasi? Data di Google Spreadsheet Anda tetap aman.')) {
                    onSetSpreadsheetInfo(null);
                    onShowNotification('Tautan Google Spreadsheet dilepaskan.', 'info');
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
              >
                Lepaskan
              </button>
            </div>
          </div>

          {/* Sync Actions Grid */}
          <div className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Push Action */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    Kirim Semua Data Lokal ke Spreadsheet (Push)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Menulis seluruh daftar siswa ({students.length} siswa) dan riwayat presensi ({records.length} rekaman) dari aplikasi ini ke Google Spreadsheet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmPushOpen(true)}
                  disabled={isSyncing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sedang Menyinkronkan...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Kirim Data ke Google Sheets
                    </>
                  )}
                </button>
              </div>

              {/* Pull Action */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                    <DownloadCloud className="w-4 h-4 text-blue-600" />
                    Tarik Data dari Spreadsheet ke Aplikasi (Pull)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Mengambil data siswa dan catatan presensi yang ada di Google Spreadsheet untuk dimuat ke dalam aplikasi presensi ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmPullOpen(true)}
                  disabled={isPulling}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPulling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sedang Mengambil Data...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      Tarik Data dari Google Sheets
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Realtime Auto-Sync Scan Setting */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <CloudCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Pencatatan Presensi Otomatis (Real-time Auto-Append)
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Setiap kali siswa memindai kartu QR di pemindai gerbang, baris baru langsung otomatis ditambahkan ke sheet <code>REKAP_PRESENSI</code> di Google Sheets.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={spreadsheetInfo.autoSync}
                  onChange={(e) => {
                    onSetSpreadsheetInfo({
                      ...spreadsheetInfo,
                      autoSync: e.target.checked,
                    });
                    onShowNotification(
                      e.target.checked
                        ? 'Pencatatan presensi otomatis diaktifkan!'
                        : 'Pencatatan presensi otomatis dinonaktifkan.',
                      'info'
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Sheet Structure Guide */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <TableProperties className="w-4 h-4 text-slate-700" />
          Struktur Tabel di Google Spreadsheet
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="font-bold text-emerald-700 mb-1">1. Tab DATA_SISWA</p>
            <p className="text-slate-600 leading-relaxed">
              Menyimpan master data siswa: <code>ID_SISWA</code>, <code>NISN</code>, <code>NIS</code>, <code>NAMA_LENGKAP</code>, <code>JENIS_KELAMIN</code>, <code>KELAS</code>, <code>NO_HP_ORANG_TUA</code>, <code>TANGGAL_LAHIR</code>, <code>ALAMAT</code>.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="font-bold text-blue-700 mb-1">2. Tab REKAP_PRESENSI</p>
            <p className="text-slate-600 leading-relaxed">
              Mencatat seluruh log absensi masuk dan pulang: <code>ID_RECORD</code>, <code>TANGGAL</code>, <code>WAKTU</code>, <code>NISN</code>, <code>NIS</code>, <code>NAMA_SISWA</code>, <code>KELAS</code>, <code>TIPE_PRESENSI</code>, <code>STATUS_KEHADIRAN</code>.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="font-bold text-purple-700 mb-1">3. Tab KONFIGURASI</p>
            <p className="text-slate-600 leading-relaxed">
              Menyimpan parameter sekolah: Nama Sekolah, NPSN, Kepala Sekolah, NIP, Tahun Pelajaran, Batas Toleransi Jam Masuk, dan Jam Kepulangan.
            </p>
          </div>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION DIALOG FOR PUSH (Mutating/Overwriting Remote Data) */}
      {confirmPushOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Konfirmasi Kirim Data ke Google Spreadsheet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Tindakan ini akan memperbarui isi lembar kerja <strong>{spreadsheetInfo?.title}</strong> di Google Spreadsheet dengan data lokal saat ini:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 mb-5 border border-slate-200">
              <p className="flex items-center justify-between text-slate-700">
                <span>Daftar Siswa yang dikirim:</span>
                <strong>{students.length} Siswa</strong>
              </p>
              <p className="flex items-center justify-between text-slate-700">
                <span>Rekap Presensi yang dikirim:</span>
                <strong>{records.length} Log Presensi</strong>
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmPushOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePush}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Ya, Kirim Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION DIALOG FOR PULL (Mutating Local Application Data) */}
      {confirmPullOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-4">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Konfirmasi Tarik Data dari Google Spreadsheet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Aplikasi akan membaca seluruh baris data siswa dan presensi dari Google Spreadsheet <strong>{spreadsheetInfo?.title}</strong> dan memperbarui data di aplikasi ini.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmPullOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePull}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Ya, Tarik Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
