import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  X,
  Check,
  Copy,
  Table,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  FileText,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolConfig } from '../../types';
import { INDONESIAN_MONTHS } from '../../utils/recapUtils';
import {
  MonthlyCsvFormat,
  CsvDelimiter,
  generateMonthlyAttendanceCsv,
  downloadCsvFile,
  copyCsvToClipboard,
} from '../../utils/csvExportUtils';

interface ExportCsvMonthlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  defaultMonth: number;
  defaultYear: number;
  defaultClass?: string;
}

export const ExportCsvMonthlyModal: React.FC<ExportCsvMonthlyModalProps> = ({
  isOpen,
  onClose,
  students,
  records,
  config,
  defaultMonth,
  defaultYear,
  defaultClass = 'ALL',
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [format, setFormat] = useState<MonthlyCsvFormat>('matrix');
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(';');
  const [includeHeaderMetadata, setIncludeHeaderMetadata] = useState<boolean>(true);
  const [includeSummaryFooter, setIncludeSummaryFooter] = useState<boolean>(true);
  const [excelSafeNumbers, setExcelSafeNumbers] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Available classes
  const classList = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className))).sort();
  }, [students]);

  // Compute live CSV result
  const csvResult = useMemo(() => {
    return generateMonthlyAttendanceCsv(students, records, config, {
      month: selectedMonth,
      year: selectedYear,
      format,
      delimiter,
      includeHeaderMetadata,
      includeSummaryFooter,
      excelSafeNumbers,
      selectedClass,
    });
  }, [
    students,
    records,
    config,
    selectedMonth,
    selectedYear,
    format,
    delimiter,
    includeHeaderMetadata,
    includeSummaryFooter,
    excelSafeNumbers,
    selectedClass,
  ]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadCsvFile(csvResult.csvContent, csvResult.fileName);
  };

  const handleCopy = async () => {
    const success = await copyCsvToClipboard(csvResult.csvContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Ekspor Data Presensi Bulanan ke Format CSV
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Laporan Dinas
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Standar berkas CSV untuk laporan Dinas Pendidikan, Pengawas Sekolah, Dapodik, dan integrasi Excel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Filter Periode & Kelas */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Bulan Pelaporan</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500"
              >
                {INDONESIAN_MONTHS.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tahun Ajaran</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 font-mono"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rombongan Belajar (Kelas)</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
                {classList.map((cls) => {
                  const count = students.filter((s) => s.className === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      Kelas {cls} ({count} Siswa)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 2. Pilihan Format Preset CSV */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Pilih Format Laporan CSV</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Pilih struktur kolom sesuai kebutuhan instansi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Preset 1: Matriks Harian 1-31 */}
              <div
                onClick={() => setFormat('matrix')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  format === 'matrix'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-emerald-600" />
                      Matriks Harian (1-31)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      Standar Buku Absen
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Menampilkan kolom tanggal 1 sampai 31 secara horizontal dengan simbol presensi (H, T, S, I, A) dan akumulasi total.
                  </p>
                </div>
                <div className="mt-2.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  Cocok untuk: Buku Induk, Arsip Fisik Bulanan, Dapodik
                </div>
              </div>

              {/* Preset 2: Rekap Agregat per Siswa */}
              <div
                onClick={() => setFormat('summary')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  format === 'summary'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Rekapitulasi Agregat Siswa
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      Format Dinas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tabel ringkas per siswa berisi total Hari Efektif, Hadir, Terlambat, Sakit, Izin, Alpa, persentase ketercapaian, dan catatan evaluasi.
                  </p>
                </div>
                <div className="mt-2.5 text-[10px] font-mono text-blue-700 dark:text-blue-400 font-semibold">
                  Cocok untuk: Laporan Bulanan ke Cabang Dinas Pendidikan
                </div>
              </div>

              {/* Preset 3: Rekap Eksekutif per Rombel */}
              <div
                onClick={() => setFormat('class_summary')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  format === 'class_summary'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      Rekap Eksekutif per Rombel
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                      Laporan Pengawas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Agregasi tingkat kehadiran per rombongan belajar (kelas X, XI, XII IPAS) beserta perbandingan gender (L/P) dan tingkat keaktifan.
                  </p>
                </div>
                <div className="mt-2.5 text-[10px] font-mono text-purple-700 dark:text-purple-400 font-semibold">
                  Cocok untuk: Laporan Rapat Dewan Guru &amp; Pengawas Sekolah
                </div>
              </div>

              {/* Preset 4: Log Transaksi Harian */}
              <div
                onClick={() => setFormat('logs')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  format === 'logs'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-600" />
                      Log Rinci Transaksi Harian
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Detail Scan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Daftar kronologis setiap pemindaian barcode QR masuk &amp; pulang beserta stempel waktu detil dan alasan ketidakhadiran.
                  </p>
                </div>
                <div className="mt-2.5 text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                  Cocok untuk: Audit Kehadiran, Olah Data Python/R/BI
                </div>
              </div>
            </div>
          </div>

          {/* 3. Konfigurasi Delimiter & Opsi Ekspor */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Pemisah Kolom (Delimiter)
                </span>
                <span className="text-[11px] text-slate-500">
                  Pilih format pemisah data CSV yang kompatibel dengan aplikasi pembaca
                </span>
              </div>

              <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDelimiter(';')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    delimiter === ';'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Titik Koma (Paling disukai Microsoft Excel Indonesia)"
                >
                  Titik Koma ( ; ) • Rekomendasi Excel ID
                </button>
                <button
                  type="button"
                  onClick={() => setDelimiter(',')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    delimiter === ','
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Koma (Standar CSV Internasional & Google Sheets)"
                >
                  Koma ( , ) • Internasional
                </button>
                <button
                  type="button"
                  onClick={() => setDelimiter('\t')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    delimiter === '\t'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Tab (TSV format)"
                >
                  Tab (TSV)
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeHeaderMetadata}
                  onChange={(e) => setIncludeHeaderMetadata(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Sertakan Kop Informasi Instansi &amp; Dinas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={excelSafeNumbers}
                  onChange={(e) => setExcelSafeNumbers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Format Aman NISN / NIS (Anti Potong 0)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeSummaryFooter}
                  onChange={(e) => setIncludeSummaryFooter(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Sertakan Baris Ringkasan Total &amp; Rata-rata</span>
              </label>
            </div>
          </div>

          {/* 4. Live Data Preview */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pratinjau Berkas CSV (5 Baris Pertama)
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Total Kolom: <strong className="text-slate-800 dark:text-slate-200">{csvResult.totalColumns}</strong> • Total Baris Data: <strong className="text-slate-800 dark:text-slate-200">{csvResult.totalRows}</strong>
              </div>
            </div>

            <div className="overflow-x-auto max-h-56 p-2">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {csvResult.headers.map((h, i) => (
                      <th key={i} className="py-1.5 px-2 whitespace-nowrap border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {csvResult.sampleRows.length > 0 ? (
                    csvResult.sampleRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-1 px-2 whitespace-nowrap text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 last:border-r-0"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={csvResult.headers.length} className="py-4 text-center text-slate-400 italic font-sans">
                        Tidak ada baris data yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate font-mono font-medium">
                Nama File: <strong className="text-slate-800 dark:text-slate-200">{csvResult.fileName}</strong>
              </span>
              <span className="shrink-0 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Encoding UTF-8 BOM Siap
              </span>
            </div>
          </div>

          {/* 5. Collapsible Education Department Reporting Guidelines (Panduan Dinas) */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 text-xs font-bold text-blue-900 dark:text-blue-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Petunjuk Penggunaan Berkas CSV untuk Laporan Dinas Pendidikan</span>
              </div>
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGuide && (
              <div className="p-4 pt-0 text-xs text-slate-700 dark:text-slate-300 space-y-2 border-t border-blue-100 dark:border-blue-900/40 mt-1">
                <p className="leading-relaxed">
                  <strong>1. Membuka di Microsoft Excel:</strong> Gunakan opsi Delimiter <em>Titik Koma (;)</em> untuk komputer dengan pengaturan regional Bahasa Indonesia. Cukup klik ganda file CSV yang diunduh, Excel akan langsung menampilkan tabel yang rapi.
                </p>
                <p className="leading-relaxed">
                  <strong>2. Membuka di Google Sheets:</strong> Buka Google Spreadsheet baru &gt; Menu <em>File</em> &gt; <em>Impor (Import)</em> &gt; Unggah file CSV &gt; Pilih &quot;Ganti sheet saat ini&quot;.
                </p>
                <p className="leading-relaxed">
                  <strong>3. Integrasi Dapodik / EMIS:</strong> Gunakan format <em>Matriks Harian</em> atau <em>Rekap Agregat Siswa</em> untuk melampirkan bukti kehadiran berkala ke Pengawas Sekolah Pembina atau Operator Dinas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Siap diekspor: <span className="font-bold text-slate-800 dark:text-white">{csvResult.totalRows} baris</span> • Format: <span className="font-bold text-emerald-600">{format.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            {/* Copy CSV to Clipboard */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Salin isi data CSV langsung ke papan klip (clipboard)"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Salin CSV</span>
                </>
              )}
            </button>

            {/* Download CSV */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              title="Unduh berkas CSV resmi laporan presensi bulanan"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas CSV (.csv)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
