import React, { useState, useRef, useId } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  Database,
  FileCheck,
  CreditCard,
  QrCode,
  Users,
  RefreshCw,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import {
  parseStudentFile,
  ParseResult,
  downloadStudentExcelTemplate,
  downloadStudentCsvTemplate,
} from '../utils/studentParser';

interface StudentImportViewProps {
  currentStudentsCount: number;
  onImportStudents: (
    students: Omit<Student, 'id'>[],
    mode: 'append' | 'replace'
  ) => void;
  onNavigateToStudents: () => void;
  onNavigateToCards: () => void;
  onNavigateToScanner: () => void;
}

export const StudentImportView: React.FC<StudentImportViewProps> = ({
  currentStudentsCount,
  onImportStudents,
  onNavigateToStudents,
  onNavigateToCards,
  onNavigateToScanner,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid'>('all');
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah berkas Excel (.xlsx, .xls) atau CSV (.csv).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setImportSuccessCount(null);

    try {
      const result = await parseStudentFile(file);
      setParseResult(result);
      if (result.validRows.length === 0) {
        setErrorMessage('Tidak ditemukan baris data siswa yang valid di dalam berkas.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membaca berkas. Pastikan format tabel sesuai.');
      setParseResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (!parseResult || parseResult.validRows.length === 0) return;

    if (
      importMode === 'replace' &&
      !confirm(
        `PERINGATAN: Mode "Ganti Semua" akan MENGHAPUS ${currentStudentsCount} data siswa yang ada saat ini dan menggantikannya dengan ${parseResult.validRows.length} siswa baru dari berkas ini.\n\nLanjutkan?`
      )
    ) {
      return;
    }

    const studentsToImport = parseResult.validRows.map((r) => r.data);
    onImportStudents(studentsToImport, importMode);

    setImportSuccessCount(studentsToImport.length);

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setParseResult(null);
    setErrorMessage(null);
    setImportSuccessCount(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 mb-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            Integrasi & Migrasi Data Siswa
          </div>
          <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Upload File Data Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Impor data siswa secara massal melalui berkas Microsoft Excel (.xlsx, .xls) atau format CSV. Sistem akan otomatis mendeteksi kolom dan mengenerate QR Code untuk masing-masing siswa.
          </p>
        </div>

        {/* Action / Current count badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-right">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Data Saat Ini
            </div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {currentStudentsCount}{' '}
              <span className="text-xs font-normal text-slate-500">Siswa Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {importSuccessCount !== null && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  Import Berhasil Disimpan!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                  Sebanyak <strong>{importSuccessCount} siswa</strong> telah berhasil dimasukkan ke database sistem dengan mode{' '}
                  <span className="font-mono font-bold uppercase">
                    {importMode === 'replace' ? 'Ganti Semua' : 'Gabung/Update'}
                  </span>
                  . Semua siswa kini telah memiliki kode QR presensi unik.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onNavigateToCards}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Cetak Kartu QR
              </button>
              <button
                type="button"
                onClick={onNavigateToStudents}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-600" />
                Lihat Daftar Siswa
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                title="Tutup & Unggah Berkas Baru"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Download & Guide Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-cyan-300">
                Gunakan Template Resmi Sekolah
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Agar proses pembacaan data berjalan tanpa kendala, Anda dapat mengunduh format template tabel yang telah dilengkapi contoh data siswa (Nama, NIS, NISN, Kelas, Gender, dan Kontak).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-200">Kolom Wajib:</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-200 font-mono">Nama Lengkap</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-200 font-mono">NIS (Kunci QR)</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-200 font-mono">Kelas</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Kolom Opsional: NISN, JK (L/P), No HP Wali, Tgl Lahir, Alamat</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={downloadStudentExcelTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Template (.XLSX)
            </button>
            <button
              type="button"
              onClick={downloadStudentCsvTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              Download Format (.CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Main Upload Dropzone */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/90">
        <input
          ref={fileInputRef}
          type="file"
          id={fileInputId}
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <label
          htmlFor={fileInputId}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer block ${
            dragActive
              ? 'border-blue-500 bg-blue-50/70 scale-[1.005]'
              : parseResult
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
          }`}
        >
          {isLoading ? (
            <div className="py-6 flex flex-col items-center">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <div className="text-sm font-bold text-slate-800">Sedang Membaca & Memvalidasi Berkas...</div>
              <div className="text-xs text-slate-500 mt-1">Menganalisis baris, header, dan kode unik NIS</div>
            </div>
          ) : parseResult ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                <FileCheck className="w-7 h-7" />
              </div>
              <div className="text-base font-extrabold text-slate-900">
                {parseResult.fileName}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                Ukuran: {(parseResult.fileSize / 1024).toFixed(1)} KB • Total Baris: {parseResult.totalRows} Baris
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                <span>Klik di sini jika ingin mengganti berkas</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="text-base sm:text-lg font-extrabold text-slate-900">
                Tarik & Lepaskan Berkas Siswa ke Sini
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                atau <span className="text-blue-600 font-bold underline">klik untuk memilih berkas</span> dari komputer Anda
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-4 flex items-center gap-2">
                <span>Mendukung: .XLSX (Excel)</span>
                <span>•</span>
                <span>.XLS</span>
                <span>•</span>
                <span>.CSV (Nilai Terpisah Koma)</span>
              </div>
            </div>
          )}
        </label>

        {/* Error message if parse failed */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Terjadi Kendala pada Berkas:</div>
              <div className="mt-0.5">{errorMessage}</div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Parse Preview & Execution Panel */}
      {parseResult && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/90 space-y-6 animate-in fade-in duration-200">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Baris Terbaca
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {parseResult.totalRows}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Header: {parseResult.headersFound.slice(0, 4).join(', ')}...
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Data Siap Diimpor
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                {parseResult.validRows.length}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Memenuhi syarat (Nama, NIS unik, Kelas)
              </div>
            </div>

            <div
              className={`rounded-xl p-4 border ${
                parseResult.invalidRows.length > 0
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  parseResult.invalidRows.length > 0 ? 'text-amber-800' : 'text-slate-500'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Baris Bermasalah
              </div>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  parseResult.invalidRows.length > 0 ? 'text-amber-700' : 'text-slate-400'
                }`}
              >
                {parseResult.invalidRows.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {parseResult.invalidRows.length > 0
                  ? 'Akan dilewati saat proses impor'
                  : 'Semua baris valid dan bersih'}
              </div>
            </div>
          </div>

          {/* Import Mode Selector */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Pilih Metode Penyimpanan ke Database
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: Append */}
              <label
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  importMode === 'append'
                    ? 'border-blue-600 bg-white shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Gabungkan & Perbarui (Append & Merge)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Siswa baru akan ditambahkan ke daftar. Jika ditemukan NIS yang sama, data siswa tersebut akan diperbarui tanpa menghapus siswa lainnya.
                  </p>
                </div>
              </label>

              {/* Option 2: Replace */}
              <label
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  importMode === 'replace'
                    ? 'border-rose-600 bg-white shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-extrabold text-rose-900">
                    Ganti Seluruh Database (Replace All)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Menghapus seluruh {currentStudentsCount} data siswa yang ada saat ini dan menggantikannya sepenuhnya dengan data dari berkas baru ini.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Table Preview Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Baris ({parseResult.totalRows})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('valid')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'valid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valid ({parseResult.validRows.length})
                </button>
                {parseResult.invalidRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('invalid')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'invalid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-600 hover:text-rose-700'
                    }`}
                  >
                    Bermasalah ({parseResult.invalidRows.length})
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Menampilkan pratinjau data sebelum disimpan
              </div>
            </div>

            {/* Responsive Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Baris</th>
                    <th className="px-3.5 py-2.5">Nama Siswa</th>
                    <th className="px-3.5 py-2.5 font-mono">NIS (Kunci QR)</th>
                    <th className="px-3.5 py-2.5 font-mono">NISN</th>
                    <th className="px-3.5 py-2.5">Kelas</th>
                    <th className="px-3.5 py-2.5">JK</th>
                    <th className="px-3.5 py-2.5">No HP / Wali</th>
                    <th className="px-3.5 py-2.5 text-right">Status Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(activeTab === 'all'
                    ? [...parseResult.validRows, ...parseResult.invalidRows].sort(
                        (a, b) => a.rowNumber - b.rowNumber
                      )
                    : activeTab === 'valid'
                    ? parseResult.validRows
                    : parseResult.invalidRows
                  ).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.isValid
                          ? 'hover:bg-slate-50/80 transition-colors'
                          : 'bg-rose-50/40 hover:bg-rose-50/70 transition-colors'
                      }
                    >
                      <td className="px-3.5 py-2.5 font-mono text-slate-400 text-[11px]">
                        #{row.rowNumber}
                      </td>
                      <td className="px-3.5 py-2.5 font-extrabold text-slate-900">
                        {row.data.name || (
                          <span className="text-rose-500 italic">[Kosong]</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                        {row.data.nis || (
                          <span className="text-rose-500 italic">[Kosong]</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">
                        {row.data.nisn || '-'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {row.data.className || '-'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            row.data.gender === 'L'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {row.data.gender}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-mono text-[11px]">
                        {row.data.parentPhone || '-'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Valid
                          </span>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Error
                            </span>
                            <span className="text-[10px] text-rose-600 mt-0.5 text-right">
                              {row.errors.join(', ')}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Execution Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Ganti Berkas / Batalkan
            </button>

            <button
              type="button"
              disabled={parseResult.validRows.length === 0}
              onClick={handleExecuteImport}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-black transition-all shadow-md cursor-pointer ${
                parseResult.validRows.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : importMode === 'replace'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 active:scale-98'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 active:scale-98'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>
                Simpan {parseResult.validRows.length} Siswa ke Database (
                {importMode === 'replace' ? 'Ganti Semua' : 'Gabung/Update'})
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
