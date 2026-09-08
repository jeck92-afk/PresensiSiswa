import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  HeartPulse,
  Info,
  UserX,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Check,
  Search,
  MessageSquare,
  Send,
  FileText,
  Sparkles,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceType, SchoolConfig } from '../../types';
import { getTodayDateString, formatIndonesianDate } from '../../data/initialData';
import { getCurrentTimeString } from '../../utils/time';
import { formatDisplayPhone, isValidWhatsAppPhone, openWhatsAppChat } from '../../utils/whatsapp';

interface AdminAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  initialStudentId?: string;
  initialStatus?: AttendanceStatus;
  initialDate?: string;
  initialNote?: string;
  initialSelectedStudentIds?: string[];
  onSaveSingle: (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    note: string,
    type?: AttendanceType
  ) => void;
  onSaveBatch: (
    studentIds: string[],
    date: string,
    status: AttendanceStatus,
    note: string,
    type?: AttendanceType
  ) => void;
}

export const AdminAbsenceModal: React.FC<AdminAbsenceModalProps> = ({
  isOpen,
  onClose,
  students,
  records,
  config,
  initialStudentId,
  initialStatus = 'IZIN',
  initialDate,
  initialNote = '',
  initialSelectedStudentIds = [],
  onSaveSingle,
  onSaveBatch,
}) => {
  const todayStr = getTodayDateString();

  // Mode: 'single' for 1 student, 'batch' for multiple students
  const [mode, setMode] = useState<'single' | 'batch'>(
    initialSelectedStudentIds.length > 1 ? 'batch' : 'single'
  );

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialSelectedStudentIds);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');
  const [date, setDate] = useState<string>(initialDate || todayStr);
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [note, setNote] = useState<string>(initialNote);
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(true);

  // Sync props when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedStudentIds.length > 1) {
        setMode('batch');
        setSelectedStudentIds(initialSelectedStudentIds);
      } else {
        setMode('single');
        setSelectedStudentId(initialStudentId || (students[0]?.id ?? ''));
      }
      setStatus(initialStatus);
      setDate(initialDate || todayStr);
      setNote(initialNote);
    }
  }, [isOpen, initialStudentId, initialStatus, initialDate, initialNote, initialSelectedStudentIds, students, todayStr]);

  // Distinct classes
  const classList = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className))).sort();
  }, [students]);

  // Filtered students for single select
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClass === 'ALL' || s.className === selectedClass;
      const matchQuery =
        s.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        s.nis.includes(searchStudentQuery);
      return matchClass && matchQuery;
    });
  }, [students, selectedClass, searchStudentQuery]);

  // Selected student object in single mode
  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Quick preset notes based on status
  const presetNotes: Record<AttendanceStatus, string[]> = {
    SAKIT: [
      'Surat Dokter / Puskesmas',
      'Demam tinggi & flu',
      'Sakit gigi / berobat',
      'Rawat inap di Rumah Sakit',
      'Istirahat di rumah (Sakit)',
    ],
    IZIN: [
      'Acara keluarga',
      'Izin urusan keluarga mendesak',
      'Lomba / kegiatan siswa sekolah',
      'Izin bepergian ke luar kota',
      'Keluarga berduka',
    ],
    ALPA: [
      'Tanpa keterangan / Tidak masuk',
      'Tidak ada pemberitahuan orang tua',
      'Tidak hadir tanpa kabar',
      'Meninggalkan kelas / Bolos',
    ],
    HADIR: ['Hadir tepat waktu', 'Diverifikasi hadir oleh admin'],
    TERLAMBAT: ['Terlambat masuk', 'Ada kendala transportasi'],
  };

  const currentPresets = presetNotes[status] || [];

  if (!isOpen) return null;

  // Handle toggling student in batch mode
  const handleToggleStudentBatch = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllInClass = () => {
    const classStudentIds = filteredStudents.map((s) => s.id);
    const allSelected = classStudentIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      // Unselect this class
      setSelectedStudentIds((prev) => prev.filter((id) => !classStudentIds.includes(id)));
    } else {
      // Select all in this class
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...classStudentIds])));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalNote = note.trim() || `Tercatat ${status} oleh admin`;

    if (mode === 'single') {
      if (!selectedStudentId) return;
      onSaveSingle(selectedStudentId, date, status, finalNote, 'MASUK');

      // WhatsApp notification
      if (sendWhatsApp && currentStudent && currentStudent.parentPhone && isValidWhatsAppPhone(currentStudent.parentPhone)) {
        const tzLabel = config.timeZone || 'WIT';
        const msg = `*PEMBERITAHUAN PRESENSI SISWA*\n*${config.schoolName}*\n\nYth. Bapak/Ibu Orang Tua/Wali,\nKami menginformasikan data kehadiran siswa:\n- Nama: *${currentStudent.name}*\n- Kelas: *${currentStudent.className}*\n- NIS: *${currentStudent.nis}*\n- Tanggal: *${formatIndonesianDate(date)}*\n- Status: *${status}*\n- Keterangan: _${finalNote}_\n\nCatatan resmi telah tercatat pada sistem absensi digital sekolah.\nTerima kasih atas kerja samanya.\n_Admin Presensi ${config.schoolName}_`;
        openWhatsAppChat(currentStudent.parentPhone, msg);
      }
    } else {
      if (selectedStudentIds.length === 0) return;
      onSaveBatch(selectedStudentIds, date, status, finalNote, 'MASUK');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* 1. Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                status === 'SAKIT'
                  ? 'bg-sky-600 shadow-sky-600/30'
                  : status === 'IZIN'
                  ? 'bg-blue-600 shadow-blue-600/30'
                  : status === 'ALPA'
                  ? 'bg-rose-600 shadow-rose-600/30'
                  : 'bg-emerald-600 shadow-emerald-600/30'
              }`}
            >
              {status === 'SAKIT' ? (
                <HeartPulse className="w-5 h-5" />
              ) : status === 'IZIN' ? (
                <FileText className="w-5 h-5" />
              ) : status === 'ALPA' ? (
                <UserX className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Kelola Presensi: Sakit, Izin &amp; Alpa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan resmi oleh admin untuk siswa yang tidak dapat hadir
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Mode Selector Pill: Single vs Batch */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40">
          <div className="inline-flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Perorangan (1 Siswa)
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'batch'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Masal ({selectedStudentIds.length > 0 ? `${selectedStudentIds.length} Siswa` : 'Banyak Siswa'})
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {formatIndonesianDate(date)}
          </div>
        </div>

        {/* 3. Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              1. Pilih Status Presensi:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {/* SAKIT */}
              <button
                type="button"
                onClick={() => setStatus('SAKIT')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                  status === 'SAKIT'
                    ? 'border-sky-500 bg-sky-50/90 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <HeartPulse
                  className={`w-6 h-6 mb-1 ${
                    status === 'SAKIT' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-black">Sakit (S)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Surat Dokter</span>
              </button>

              {/* IZIN */}
              <button
                type="button"
                onClick={() => setStatus('IZIN')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                  status === 'IZIN'
                    ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileText
                  className={`w-6 h-6 mb-1 ${
                    status === 'IZIN' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-black">Izin (I)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Surat Wali</span>
              </button>

              {/* ALPA */}
              <button
                type="button"
                onClick={() => setStatus('ALPA')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                  status === 'ALPA'
                    ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <UserX
                  className={`w-6 h-6 mb-1 ${
                    status === 'ALPA' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-black">Alpa (A)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Tanpa Kabar</span>
              </button>

              {/* HADIR (Koreksi) */}
              <button
                type="button"
                onClick={() => setStatus('HADIR')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                  status === 'HADIR'
                    ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CheckCircle2
                  className={`w-6 h-6 mb-1 ${
                    status === 'HADIR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-black">Hadir (H)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Tepat Waktu</span>
              </button>

              {/* TERLAMBAT (Koreksi) */}
              <button
                type="button"
                onClick={() => setStatus('TERLAMBAT')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                  status === 'TERLAMBAT'
                    ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Clock
                  className={`w-6 h-6 mb-1 ${
                    status === 'TERLAMBAT' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-black">Terlambat (T)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Koreksi Jam</span>
              </button>
            </div>
          </div>

          {/* Date Picker Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                2. Tanggal Presensi:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white cursor-pointer w-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => setDate(todayStr)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    date === todayStr
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Hari Ini
                </button>
              </div>
            </div>

            {/* In Single Mode: Selected Student Card */}
            {mode === 'single' && currentStudent && (
              <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750">
                <div className="text-[10px] font-bold uppercase text-slate-400">Siswa Terpilih</div>
                <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {currentStudent.name}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    Kelas {currentStudent.className}
                  </span>
                  <span>•</span>
                  <span>NIS: {currentStudent.nis}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Student Selection */}
          {mode === 'single' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                3. Pilih Siswa:
              </label>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer sm:w-44"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classList.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                    placeholder="Cari nama atau NIS siswa..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Student Dropdown / Selection List */}
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const isSelected = s.id === selectedStudentId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold truncate">{s.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Kelas {s.className} • NIS: {s.nis}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Tidak ditemukan siswa yang sesuai filter.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Batch Mode: Multi-Select Students */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  3. Pilih Siswa (Masal):
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {classList.map((c) => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSelectAllInClass}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Pilih Semua Kelas Ini
                  </button>
                </div>
              </div>

              <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850 p-1">
                {filteredStudents.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleStudentBatch(s.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Kelas {s.className} • NIS: {s.nis}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {selectedStudentIds.length} siswa terpilih
              </div>
            </div>
          )}

          {/* 4. Reason / Keterangan Input with Quick Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>4. Keterangan / Alasan Resmi:</span>
              </label>
              <span className="text-[11px] text-slate-400">Klik tombol cepat untuk mengisi</span>
            </div>

            {/* Quick Preset Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {currentPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNote(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    note === preset
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Masukkan keterangan rinci (misal: ${
                status === 'SAKIT'
                  ? 'Surat dokter Puskesmas / Demam'
                  : status === 'IZIN'
                  ? 'Acara keluarga di luar kota'
                  : 'Tidak masuk tanpa keterangan dari orang tua'
              })...`}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            />
          </div>

          {/* 5. WhatsApp Notification Checkbox (Only in single mode) */}
          {mode === 'single' && currentStudent && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Kirim Notifikasi Otomatis ke WhatsApp Orang Tua
                </span>
              </label>

              {currentStudent.parentPhone ? (
                <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                  {formatDisplayPhone(currentStudent.parentPhone)}
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100/80 px-2 py-0.5 rounded">
                  No. WA belum tersedia
                </span>
              )}
            </div>
          )}
        </form>

        {/* 4. Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={mode === 'single' ? !selectedStudentId : selectedStudentIds.length === 0}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              status === 'SAKIT'
                ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30'
                : status === 'IZIN'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                : status === 'ALPA'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {mode === 'single'
                ? `Simpan Presensi (${status})`
                : `Simpan ${selectedStudentIds.length} Siswa (${status})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
