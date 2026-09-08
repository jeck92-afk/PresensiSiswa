import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  FileDown,
  X,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  UserX,
  Sliders,
  Sparkles,
  Award,
} from 'lucide-react';
import { AttendanceRecord, SchoolConfig, Student } from '../../types';
import { formatIndonesianDate, getTodayDateString } from '../../data/initialData';
import { generateAttendancePdf, ReportPdfOptions } from '../../utils/pdfExport';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  students: Student[];
  config: SchoolConfig;
  defaultTitle?: string;
  defaultPeriodLabel?: string;
  defaultClass?: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  records,
  students,
  config,
  defaultTitle = 'LAPORAN REKAPITULASI PRESENSI SISWA',
  defaultPeriodLabel,
  defaultClass = 'Semua Kelas',
}) => {
  const todayStr = getTodayDateString();

  // Printable Document Settings
  const [title, setTitle] = useState<string>(defaultTitle);
  const [periodLabel, setPeriodLabel] = useState<string>(
    defaultPeriodLabel || `Periode: ${formatIndonesianDate(todayStr)}`
  );
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [cityName, setCityName] = useState<string>('Tihulale');
  const [reportDate, setReportDate] = useState<string>(todayStr);

  // Signer configuration
  const [principalName, setPrincipalName] = useState<string>(config.principalName || 'Drs. H. Bambang Sujarwo, M.Pd.');
  const [principalNip, setPrincipalNip] = useState<string>(config.principalNip || '19720415 199803 1 004');
  const [officerName, setOfficerName] = useState<string>('Petugas Presensi Sekolah');
  const [officerNip, setOfficerNip] = useState<string>('-');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Statistics
  const total = records.length;
  const hadir = records.filter((r) => r.status === 'HADIR').length;
  const terlambat = records.filter((r) => r.status === 'TERLAMBAT').length;
  const sakit = records.filter((r) => r.status === 'SAKIT').length;
  const izin = records.filter((r) => r.status === 'IZIN').length;
  const alpa = records.filter((r) => r.status === 'ALPA').length;
  const hadirRate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

  if (!isOpen) return null;

  // Trigger direct PDF generation via jsPDF
  const handleDownloadPdf = () => {
    const options: ReportPdfOptions = {
      title,
      periodLabel,
      selectedClass,
      cityName,
      reportDate,
      signer1Name: principalName,
      signer1Nip: principalNip,
      signer2Name: officerName,
      signer2Nip: officerNip,
      orientation,
    };
    generateAttendancePdf(records, students, config, options);
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-100 dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* 1. Modal Top Bar (Screen Only) */}
        <div className="print:hidden px-6 py-4 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Cetak Dokumen &amp; Ekspor PDF Arsip Presensi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Resmi Sekolah
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format standar arsip fisik dengan Kop Surat resmi, data kehadiran terverifikasi, dan lembar pengesahan
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showConfigDrawer
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pengaturan Kop &amp; TTD</span>
            </button>

            {/* Unduh PDF (.pdf) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
              title="Unduh file PDF secara langsung"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh PDF (.pdf)</span>
            </button>

            {/* Cetak Fisik / Print to PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
              title="Cetak langsung ke printer atau dialog print browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Config Drawer (Collapsible) */}
        {showConfigDrawer && (
          <div className="print:hidden p-4 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Judul Laporan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Label Periode / Waktu
              </label>
              <input
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kota Titimangsa
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={principalNip}
                onChange={(e) => setPrincipalNip(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Petugas / Guru Piket
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* 3. Document Canvas Area (Interactive Paper Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/80 dark:bg-slate-950">
          <div
            ref={printAreaRef}
            id="printable-report-area"
            className="w-full max-w-[280mm] min-h-[190mm] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm border border-slate-300 print:border-none print:shadow-none print:m-0 print:p-0 print:w-full"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* KOP SURAT RESMI */}
            <div className="text-center pb-3 relative border-b-2 border-slate-900">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-slate-800" />
                </div>
                <div className="flex-1 text-center px-4">
                  <div className="text-sm sm:text-base font-bold tracking-wider text-slate-800 uppercase">
                    Pemerintah Provinsi Maluku
                  </div>
                  <div className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 uppercase">
                    Dinas Pendidikan dan Kebudayaan
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black uppercase text-slate-950 tracking-tight my-0.5">
                    {config.schoolName}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-tight">
                    {config.schoolAddress} • NPSN: {config.schoolNpsn}
                  </p>
                </div>
                <div className="w-16 h-16 flex items-center justify-center">
                  <Award className="w-12 h-12 text-blue-900" />
                </div>
              </div>

              {/* Decorative Kop rule */}
              <div className="absolute -bottom-1 left-0 right-0 border-b border-slate-900" />
            </div>

            {/* JUDUL LAPORAN */}
            <div className="text-center mt-6 mb-4">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-950 underline decoration-slate-900 decoration-1 underline-offset-4">
                {title}
              </h2>
              <div className="text-xs text-slate-700 mt-1 flex items-center justify-center gap-3">
                <span>{periodLabel}</span>
                <span>•</span>
                <span>Kelas: {selectedClass}</span>
                <span>•</span>
                <span>T.A: {config.academicYear}</span>
              </div>
            </div>

            {/* STATISTIK RINGKASAN */}
            <div className="grid grid-cols-6 gap-2 mb-5 text-center text-xs font-sans">
              <div className="border border-slate-300 bg-slate-50 p-2 rounded">
                <div className="text-[10px] uppercase font-bold text-slate-500">Total Siswa</div>
                <div className="text-base font-black text-slate-900">{total}</div>
              </div>
              <div className="border border-emerald-300 bg-emerald-50/50 p-2 rounded">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Hadir (H)</div>
                <div className="text-base font-black text-emerald-900">{hadir}</div>
              </div>
              <div className="border border-amber-300 bg-amber-50/50 p-2 rounded">
                <div className="text-[10px] uppercase font-bold text-amber-700">Terlambat (T)</div>
                <div className="text-base font-black text-amber-900">{terlambat}</div>
              </div>
              <div className="border border-sky-300 bg-sky-50/50 p-2 rounded">
                <div className="text-[10px] uppercase font-bold text-sky-700">Sakit (S)</div>
                <div className="text-base font-black text-sky-900">{sakit}</div>
              </div>
              <div className="border border-blue-300 bg-blue-50/50 p-2 rounded">
                <div className="text-[10px] uppercase font-bold text-blue-700">Izin (I)</div>
                <div className="text-base font-black text-blue-900">{izin}</div>
              </div>
              <div className="border border-rose-300 bg-rose-50/50 p-2 rounded">
                <div className="text-[10px] uppercase font-bold text-rose-700">Alpa (A)</div>
                <div className="text-base font-black text-rose-900">{alpa}</div>
              </div>
            </div>

            {/* TABEL DATA PRESENSI */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-800 text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-800 text-center uppercase tracking-wider text-[10px]">
                    <th className="border border-slate-800 py-1.5 px-2 w-8">No</th>
                    <th className="border border-slate-800 py-1.5 px-2 w-20">Tanggal</th>
                    <th className="border border-slate-800 py-1.5 px-2 w-16">Waktu</th>
                    <th className="border border-slate-800 py-1.5 px-2 w-16">NIS</th>
                    <th className="border border-slate-800 py-1.5 px-3 text-left">Nama Siswa</th>
                    <th className="border border-slate-800 py-1.5 px-2 w-16">Kelas</th>
                    <th className="border border-slate-800 py-1.5 px-2 w-10">L/P</th>
                    <th className="border border-slate-800 py-1.5 px-2 w-20">Status</th>
                    <th className="border border-slate-800 py-1.5 px-3 text-left">Keterangan / Alasan Resmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {records.length > 0 ? (
                    records.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50">
                        <td className="border border-slate-800 py-1 px-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-800 py-1 px-2 text-center whitespace-nowrap">{r.date}</td>
                        <td className="border border-slate-800 py-1 px-2 text-center whitespace-nowrap">{r.time}</td>
                        <td className="border border-slate-800 py-1 px-2 text-center font-mono">{r.studentNis}</td>
                        <td className="border border-slate-800 py-1 px-3 font-bold">{r.studentName}</td>
                        <td className="border border-slate-800 py-1 px-2 text-center whitespace-nowrap">{r.studentClass}</td>
                        <td className="border border-slate-800 py-1 px-2 text-center">{r.gender || '-'}</td>
                        <td className="border border-slate-800 py-1 px-2 text-center font-bold whitespace-nowrap">
                          <span
                            className={
                              r.status === 'SAKIT'
                                ? 'text-sky-800'
                                : r.status === 'IZIN'
                                ? 'text-blue-800'
                                : r.status === 'ALPA'
                                ? 'text-rose-800'
                                : r.status === 'TERLAMBAT'
                                ? 'text-amber-800'
                                : 'text-emerald-800'
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="border border-slate-800 py-1 px-3 text-[11px]">
                          {r.note || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="border border-slate-800 py-6 text-center text-slate-500 italic">
                        Tidak ada data catatan presensi untuk kriteria laporan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* LEMBAR PENGESAHAN & TANDA TANGAN */}
            <div className="mt-8 pt-4 flex items-start justify-between text-xs break-inside-avoid">
              {/* Left Sign: Kepala Sekolah */}
              <div className="text-center w-64">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-18" />
                <p className="font-bold underline uppercase">{principalName}</p>
                <p className="text-[11px] text-slate-700">NIP. {principalNip}</p>
              </div>

              {/* Right Sign: Petugas Presensi */}
              <div className="text-center w-64">
                <p>
                  {cityName}, {formatIndonesianDate(reportDate)}
                </p>
                <p className="font-bold">Petugas / Guru Piket</p>
                <div className="h-18" />
                <p className="font-bold underline uppercase">{officerName}</p>
                <p className="text-[11px] text-slate-700">NIP/NUPTK: {officerNip}</p>
              </div>
            </div>

            {/* Footer Dokumen Fisik */}
            <div className="mt-8 pt-2 border-t border-dotted border-slate-400 flex items-center justify-between text-[10px] text-slate-500">
              <span>Dicetak otomatis dari Sistem Presensi Digital {config.schoolName}</span>
              <span>Dokumen sah arsip kurikulum &amp; kesiswaan</span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Actions (Screen Only) */}
        <div className="print:hidden px-6 py-3.5 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total tercantum: <span className="font-bold text-slate-900 dark:text-white">{records.length} baris presensi</span> • Tingkat Kehadiran: <span className="font-bold text-emerald-600">{hadirRate}%</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh File PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak ke Printer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
