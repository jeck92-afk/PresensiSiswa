import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Image,
  Camera,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Users,
  User,
  Sparkles,
  FileImage,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Student } from '../../types';
import {
  validateJpgFile,
  processJpgImageToDataUrl,
  matchStudentByFilename,
} from '../../utils/imageUtils';

interface StudentPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  initialSelectedStudentId?: string | null;
  onUpdateStudent?: (id: string, updated: Partial<Student>) => void;
  onBatchUpdateStudents?: (updates: { id: string; avatarUrl: string }[]) => void;
}

interface BatchPhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  dataUrl: string;
  matchedStudentId: string | null;
  status: 'matched' | 'unmatched' | 'error';
  errorMessage?: string;
}

export const StudentPhotoUploadModal: React.FC<StudentPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  students,
  initialSelectedStudentId,
  onUpdateStudent,
  onBatchUpdateStudents,
}) => {
  const [activeMode, setActiveMode] = useState<'single' | 'batch'>('single');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId || (students[0]?.id ?? '')
  );
  const [studentSearch, setStudentSearch] = useState('');

  // Single upload state
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Batch upload state
  const [batchItems, setBatchItems] = useState<BatchPhotoItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchDragActive, setBatchDragActive] = useState(false);
  const [batchNotification, setBatchNotification] = useState<string | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Filter students for single mode selector
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.includes(studentSearch) ||
      s.className.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Handle single file pick
  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSingleError(null);
    const check = validateJpgFile(file);
    if (!check.valid) {
      setSingleError(check.message || 'File harus bertipe JPG atau JPEG (.jpg/.jpeg).');
      if (singleFileInputRef.current) singleFileInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessingSingle(true);
      const dataUrl = await processJpgImageToDataUrl(file);
      setSinglePreview(dataUrl);
      setSingleFile(file);
    } catch (err: any) {
      setSingleError(err.message || 'Gagal memproses gambar JPG/JPEG');
    } finally {
      setIsProcessingSingle(false);
    }
  };

  const handleSaveSinglePhoto = () => {
    if (!selectedStudentId || !singlePreview) return;
    if (onUpdateStudent) {
      onUpdateStudent(selectedStudentId, { avatarUrl: singlePreview });
    }
    setSingleFile(null);
    setSinglePreview(null);
    setSingleError(null);
    if (singleFileInputRef.current) singleFileInputRef.current.value = '';
    onClose();
  };

  const handleRemoveSinglePhoto = (studentId: string) => {
    if (onUpdateStudent) {
      onUpdateStudent(studentId, { avatarUrl: undefined });
    }
    setSinglePreview(null);
    setSingleFile(null);
    if (singleFileInputRef.current) singleFileInputRef.current.value = '';
  };

  // Handle batch files pick
  const handleBatchFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsProcessingBatch(true);
    setBatchNotification(null);

    const newItems: BatchPhotoItem[] = [];

    for (const file of fileArray) {
      const check = validateJpgFile(file);
      if (!check.valid) {
        newItems.push({
          id: `batch-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: '',
          dataUrl: '',
          matchedStudentId: null,
          status: 'error',
          errorMessage: check.message || 'Bukan format JPG/JPEG',
        });
        continue;
      }

      try {
        const dataUrl = await processJpgImageToDataUrl(file);
        const matched = matchStudentByFilename(file.name, students);

        newItems.push({
          id: `batch-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: dataUrl,
          dataUrl,
          matchedStudentId: matched ? matched.id : null,
          status: matched ? 'matched' : 'unmatched',
        });
      } catch (err: any) {
        newItems.push({
          id: `batch-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: '',
          dataUrl: '',
          matchedStudentId: null,
          status: 'error',
          errorMessage: err.message || 'Gagal memproses gambar',
        });
      }
    }

    setBatchItems((prev) => [...newItems, ...prev]);
    setIsProcessingBatch(false);
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
  };

  const handleApplyBatchPhotos = () => {
    const validMatches = batchItems.filter(
      (item) => item.status === 'matched' && item.matchedStudentId && item.dataUrl
    );

    if (validMatches.length === 0) {
      setBatchNotification('Tidak ada foto yang cocok dengan data siswa.');
      return;
    }

    if (onBatchUpdateStudents) {
      const updates = validMatches.map((item) => ({
        id: item.matchedStudentId!,
        avatarUrl: item.dataUrl,
      }));
      onBatchUpdateStudents(updates);
    } else if (onUpdateStudent) {
      validMatches.forEach((item) => {
        onUpdateStudent(item.matchedStudentId!, { avatarUrl: item.dataUrl });
      });
    }

    onClose();
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateBatchMatch = (itemId: string, studentId: string) => {
    setBatchItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            matchedStudentId: studentId || null,
            status: studentId ? 'matched' : 'unmatched',
          };
        }
        return i;
      })
    );
  };

  const matchedCount = batchItems.filter((i) => i.status === 'matched' && i.matchedStudentId).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-academic text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Unggah Foto Siswa (JPG / JPEG)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih foto berformat <span className="font-bold text-rose-600 dark:text-rose-400">.jpg</span> atau <span className="font-bold text-rose-600 dark:text-rose-400">.jpeg</span> (Maksimal <strong className="text-slate-800 dark:text-slate-200">1 MB</strong> per file)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Single vs Batch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('single')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeMode === 'single'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Unggah Per Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('batch')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeMode === 'batch'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Unggah Massal (Banyak File JPG/JPEG)</span>
            {batchItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {batchItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Format & Size Badge Notice */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Format: <strong>JPG (.jpg)</strong> / <strong>JPEG (.jpeg)</strong> • Ukuran Maksimal: <strong>1 MB</strong>. Otomatis disesuaikan rasio 3x4 pasfoto.
              </span>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
              JPG/JPEG • MAKS 1 MB
            </span>
          </div>

          {/* MODE 1: SINGLE STUDENT PHOTO */}
          {activeMode === 'single' && (
            <div className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Siswa Target:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Cari nama atau NIS siswa..."
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setSinglePreview(null);
                      setSingleFile(null);
                      setSingleError(null);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    {filteredStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nis} - {st.name} ({st.className})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Card & Photo Uploader Area */}
              {currentStudent && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 flex flex-col sm:flex-row items-center gap-5">
                  {/* Photo Preview Frame (3x4) */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-28 aspect-3/4 rounded-2xl p-1 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 shadow-md relative overflow-hidden flex items-center justify-center">
                      {singlePreview || currentStudent.avatarUrl ? (
                        <img
                          src={singlePreview || currentStudent.avatarUrl}
                          alt={currentStudent.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div
                          className={`w-full h-full rounded-xl flex flex-col items-center justify-center text-center p-2 ${
                            currentStudent.gender === 'L'
                              ? 'bg-gradient-to-b from-blue-700 to-blue-900 text-white'
                              : 'bg-gradient-to-b from-rose-700 to-rose-900 text-white'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-bold text-lg mb-1">
                            {currentStudent.name.charAt(0)}
                          </div>
                          <span className="text-[9px] font-bold opacity-90">
                            {currentStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </div>
                      )}

                      {/* Live uploading spinner */}
                      {isProcessingSingle && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                          <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] font-mono font-bold mt-1 text-slate-500">
                      Rasio Pasfoto 3:4
                    </span>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {currentStudent.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        NIS: <strong className="font-mono">{currentStudent.nis}</strong> • Kelas:{' '}
                        <strong>{currentStudent.className}</strong>
                      </p>
                    </div>

                    {/* Hidden input strictly accepting JPG / JPEG */}
                    <input
                      ref={singleFileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      onChange={handleSingleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => singleFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Pilih Foto JPG / JPEG (Maks. 1 MB)</span>
                      </button>

                      {(singlePreview || currentStudent.avatarUrl) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSinglePhoto(currentStudent.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Foto</span>
                        </button>
                      )}
                    </div>

                    {singleFile && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-medium">
                            {singleFile.name} ({(singleFile.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-200">
                          JPG Terverifikasi
                        </span>
                      </div>
                    )}

                    {singleError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{singleError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: BATCH MULTI-FILE UPLOAD */}
          {activeMode === 'batch' && (
            <div className="space-y-4">
              {/* Dropzone for Multiple JPG/JPEG files */}
              <input
                ref={batchFileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,image/jpeg"
                onChange={(e) => {
                  if (e.target.files) handleBatchFiles(e.target.files);
                }}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setBatchDragActive(true);
                }}
                onDragLeave={() => setBatchDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setBatchDragActive(false);
                  if (e.dataTransfer.files) handleBatchFiles(e.dataTransfer.files);
                }}
                onClick={() => batchFileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  batchDragActive
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Tarik & Lepas File Foto JPG / JPEG ke Sini
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Atau klik untuk memilih beberapa file JPG sekaligus. Beri nama file foto sesuai NIS siswa (contoh: <strong className="font-mono text-slate-700 dark:text-slate-300">1001.jpg</strong>, <strong className="font-mono text-slate-700 dark:text-slate-300">1002.jpeg</strong>) agar otomatis terhubung ke siswa yang bersangkutan.
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  <FileImage className="w-3.5 h-3.5 text-rose-500" />
                  Mendukung multi-select .jpg dan .jpeg (Maksimal 1 MB / file)
                </div>
              </div>

              {batchNotification && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{batchNotification}</span>
                </div>
              )}

              {/* Batch list preview */}
              {batchItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Daftar Foto ({batchItems.length} file, {matchedCount} terhubung ke siswa):
                    </span>
                    <button
                      type="button"
                      onClick={() => setBatchItems([])}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                    >
                      Bersihkan Daftar
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {batchItems.map((item) => {
                      const matchedStudent = students.find((s) => s.id === item.matchedStudentId);

                      return (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="w-9 h-12 object-cover rounded-lg border border-slate-300 dark:border-slate-600 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <FileImage className="w-4 h-4 text-slate-400" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                {item.file.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {(item.file.size / 1024).toFixed(0)} KB
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.status === 'error' ? (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                {item.errorMessage}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  value={item.matchedStudentId || ''}
                                  onChange={(e) => handleUpdateBatchMatch(item.id, e.target.value)}
                                  className={`px-2 py-1 text-[11px] rounded-lg border font-semibold focus:outline-none ${
                                    item.matchedStudentId
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                                      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                                  }`}
                                >
                                  <option value="">-- Pilih Siswa --</option>
                                  {students.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      {st.nis} - {st.name} ({st.className})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveBatchItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hapus item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>

          {activeMode === 'single' ? (
            <button
              type="button"
              disabled={!singlePreview}
              onClick={handleSaveSinglePhoto}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs transition-colors shadow-xs ${
                singlePreview
                  ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-98'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Foto Siswa</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={matchedCount === 0}
              onClick={handleApplyBatchPhotos}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs transition-colors shadow-xs ${
                matchedCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-98'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Terapkan {matchedCount} Foto Siswa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
