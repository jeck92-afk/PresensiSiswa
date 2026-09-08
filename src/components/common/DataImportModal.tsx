import React, { useState, useRef, useId } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
  Info,
  Check,
  ArrowRight,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GenericParseResult, ParsedItemRow } from '../../utils/dataImportUtils';

interface DataImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityName: string;
  description: string;
  icon?: React.ReactNode;
  currentCount: number;
  onDownloadTemplate: (format: 'xlsx' | 'csv') => void;
  onParseFile: (file: File) => Promise<GenericParseResult<T>>;
  onImportData: (validData: T[], mode: 'append' | 'replace') => void;
  renderPreviewRow: (item: T, index: number) => React.ReactNode;
  previewHeaders: string[];
}

export function DataImportModal<T>({
  isOpen,
  onClose,
  title,
  entityName,
  description,
  icon,
  currentCount,
  onDownloadTemplate,
  onParseFile,
  onImportData,
  renderPreviewRow,
  previewHeaders,
}: DataImportModalProps<T>) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<GenericParseResult<T> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid'>('all');
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  if (!isOpen) return null;

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
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah berkas Excel (.xlsx, .xls) atau CSV (.csv).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setImportSuccessCount(null);

    try {
      const result = await onParseFile(file);
      setParseResult(result);
      if (result.validRows.length === 0) {
        setErrorMessage(`Tidak ditemukan baris ${entityName} yang valid di dalam berkas.`);
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
        `PERINGATAN: Mode "Ganti Semua" akan MENGHAPUS ${currentCount} ${entityName} yang ada saat ini dan menggantikannya dengan ${parseResult.validRows.length} data baru dari berkas ini.\n\nLanjutkan?`
      )
    ) {
      return;
    }

    const dataToImport = parseResult.validRows.map((r) => r.data);
    onImportData(dataToImport, importMode);
    setImportSuccessCount(dataToImport.length);

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

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* 1. Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
              {icon || <FileSpreadsheet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Template Download & Help Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/20 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Unduh Format Template Siap Pakai
                </h4>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Gunakan format kolom resmi agar seluruh baris data terdeteksi dan tersimpan otomatis tanpa error.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => onDownloadTemplate('xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Format Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadTemplate('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Format CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Success State */}
          {importSuccessCount !== null ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  Impor {entityName} Berhasil!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                  Sebanyak <strong className="font-mono">{importSuccessCount}</strong> data {entityName} telah berhasil diproses ke dalam database aplikasi SIADIK.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                >
                  Selesai &amp; Tutup
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-850 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 font-bold text-xs cursor-pointer"
                >
                  Unggah Berkas Lain
                </button>
              </div>
            </div>
          ) : !parseResult ? (
            /* Upload Drop Area */
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50/70 dark:hover:bg-slate-850/50'
                } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  {isLoading ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isLoading
                      ? 'Sedang membaca dan menganalisis berkas...'
                      : 'Tarik & Letakkan Berkas di Sini, atau Klik untuk Memilih'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Mendukung berkas Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Preview State */
            <div className="space-y-5">
              {/* Parse Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Total Baris Terdeteksi</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {parseResult.totalRows}
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    Data Valid (Siap Impor)
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {parseResult.validRows.length}
                  </div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-800">
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                    Data Tidak Valid / Error
                  </div>
                  <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                    {parseResult.invalidRows.length}
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Pilih Mode Impor Data
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold">Tambahkan ke Data yang Ada (Rekomendasi)</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Memperbarui data jika kode/NIP/identitas sudah ada, dan menambahkan jika data baru.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Ganti Semua Data (Replace)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Menghapus seluruh {currentCount} data saat ini dan menggantinya dengan isi berkas ini.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Semua ({parseResult.totalRows})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('valid')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'valid'
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Valid ({parseResult.validRows.length})
                    </button>
                    {parseResult.invalidRows.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('invalid')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'invalid'
                            ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-2xs'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        Error ({parseResult.invalidRows.length})
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Berkas: <strong className="text-slate-700 dark:text-slate-300">{parseResult.fileName}</strong>
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3 w-20 text-center">Status</th>
                        {previewHeaders.map((h, i) => (
                          <th key={i} className="py-2.5 px-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850">
                      {(activeTab === 'all'
                        ? [...parseResult.validRows, ...parseResult.invalidRows]
                        : activeTab === 'valid'
                        ? parseResult.validRows
                        : parseResult.invalidRows
                      ).map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            !row.isValid
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }
                        >
                          <td className="py-2 px-3 text-center font-mono text-slate-400">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                                title={row.errors.join(', ')}
                              >
                                <AlertTriangle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                          {renderPreviewRow(row.data, idx)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-850/80 shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs cursor-pointer"
          >
            Batal
          </button>

          {parseResult && importSuccessCount === null && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-750 text-xs font-bold cursor-pointer"
              >
                Ganti Berkas
              </button>
              <button
                type="button"
                disabled={parseResult.validRows.length === 0}
                onClick={handleExecuteImport}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>
                  Impor {parseResult.validRows.length} {entityName} Sekarang
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
