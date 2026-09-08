import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  MessageCircle,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Check,
  Copy,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Phone,
  UserX,
  Filter,
  Sparkles,
  CheckSquare,
  Square,
  Edit3,
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolConfig } from '../types';
import {
  formatDisplayPhone,
  normalizeIndonesianPhone,
  isValidWhatsAppPhone,
  openWhatsAppChat,
  buildWhatsAppMessage,
  buildAbsentReminderMessage,
} from '../utils/whatsapp';
import { formatIndonesianDate } from '../data/initialData';
import { getCurrentTimeString } from '../utils/time';

export type BulkWhatsAppTargetType = 'BELUM_HADIR' | 'TERLAMBAT';

export interface BulkRecipientItem {
  id: string; // student id or record id
  student: Student;
  record?: AttendanceRecord;
  targetType: BulkWhatsAppTargetType;
  message: string;
  hasValidPhone: boolean;
  formattedPhone: string;
  sentAt?: number;
}

interface BulkWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetType?: BulkWhatsAppTargetType;
  selectedDate: string;
  selectedClass?: string;
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  onUpdateStudentPhone?: (studentId: string, newPhone: string) => void;
}

export const BulkWhatsAppModal: React.FC<BulkWhatsAppModalProps> = ({
  isOpen,
  onClose,
  initialTargetType = 'BELUM_HADIR',
  selectedDate,
  selectedClass = 'ALL',
  students,
  records,
  config,
  onUpdateStudentPhone,
}) => {
  if (!isOpen) return null;

  const [targetType, setTargetType] = useState<BulkWhatsAppTargetType>(initialTargetType);
  const [viewMode, setViewMode] = useState<'queue' | 'table'>('queue');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [phoneFilter, setPhoneFilter] = useState<'ALL' | 'VALID_ONLY' | 'UNSENT_ONLY'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sentMap, setSentMap] = useState<Map<string, number>>(new Map()); // id -> timestamp
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);
  const [editingPhoneStudentId, setEditingPhoneStudentId] = useState<string | null>(null);
  const [tempPhoneInput, setTempPhoneInput] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedCurrentMsg, setCopiedCurrentMsg] = useState<boolean>(false);

  // Auto-batch interval state
  const [isAutoSending, setIsAutoSending] = useState<boolean>(false);
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter records for selected date
  const dateRecords = useMemo(() => {
    return records.filter((r) => r.date === selectedDate);
  }, [records, selectedDate]);

  // Compute unrecorded / absent students for selected date
  const unrecordedRecipients = useMemo((): BulkRecipientItem[] => {
    const recordedStudentIds = new Set(dateRecords.map((r) => r.studentId));
    return students
      .filter((s) => (selectedClass === 'ALL' || s.className === selectedClass) && !recordedStudentIds.has(s.id))
      .map((student) => {
        const hasValid = isValidWhatsAppPhone(student.parentPhone);
        const msg = buildAbsentReminderMessage(student, config, selectedDate);
        return {
          id: student.id,
          student,
          targetType: 'BELUM_HADIR',
          message: msg,
          hasValidPhone: hasValid,
          formattedPhone: formatDisplayPhone(student.parentPhone),
          sentAt: sentMap.get(student.id),
        };
      });
  }, [students, dateRecords, selectedClass, config, selectedDate, sentMap]);

  // Compute late students for selected date
  const lateRecipients = useMemo((): BulkRecipientItem[] => {
    return dateRecords
      .filter((r) => r.status === 'TERLAMBAT' && (selectedClass === 'ALL' || r.studentClass === selectedClass))
      .map((record) => {
        const student = students.find((s) => s.id === record.studentId) || {
          id: record.studentId,
          nis: record.studentNis,
          nisn: record.studentNisn,
          name: record.studentName,
          className: record.studentClass,
          gender: record.gender || 'L',
        };
        const hasValid = isValidWhatsAppPhone(student.parentPhone);
        const msg = buildWhatsAppMessage(student, record, config);
        return {
          id: student.id,
          student,
          record,
          targetType: 'TERLAMBAT',
          message: msg,
          hasValidPhone: hasValid,
          formattedPhone: formatDisplayPhone(student.parentPhone),
          sentAt: sentMap.get(student.id),
        };
      });
  }, [dateRecords, selectedClass, students, config, sentMap]);

  // Active pool according to targetType
  const currentPool = targetType === 'BELUM_HADIR' ? unrecordedRecipients : lateRecipients;

  // Initialize selected IDs on targetType change or first load
  useEffect(() => {
    // Select all items that have valid phone numbers by default
    const validIds = currentPool.filter((item) => item.hasValidPhone).map((item) => item.id);
    setSelectedIds(new Set(validIds.length > 0 ? validIds : currentPool.map((i) => i.id)));
    setActiveQueueIndex(0);
  }, [targetType, currentPool.length]);

  // Filtered pool based on search and phoneFilter
  const filteredPool = useMemo(() => {
    return currentPool.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.nis.includes(searchQuery) ||
        item.student.className.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (phoneFilter === 'VALID_ONLY') {
        return item.hasValidPhone;
      }
      if (phoneFilter === 'UNSENT_ONLY') {
        return !item.sentAt;
      }
      return true;
    });
  }, [currentPool, searchQuery, phoneFilter]);

  // Selected items list for queue sending
  const selectedItemsInQueue = useMemo(() => {
    return currentPool.filter((item) => selectedIds.has(item.id));
  }, [currentPool, selectedIds]);

  // Clamp queue index
  useEffect(() => {
    if (activeQueueIndex >= selectedItemsInQueue.length && selectedItemsInQueue.length > 0) {
      setActiveQueueIndex(selectedItemsInQueue.length - 1);
    }
  }, [selectedItemsInQueue.length, activeQueueIndex]);

  const currentQueueItem = selectedItemsInQueue[activeQueueIndex];

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredPool.map((i) => i.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredPool.forEach((i) => next.delete(i.id));
      return next;
    });
  };

  // Send WhatsApp for a specific recipient
  const handleSendSingle = (item: BulkRecipientItem, advanceQueue = false) => {
    if (!item.hasValidPhone || !item.student.parentPhone) {
      setEditingPhoneStudentId(item.student.id);
      setTempPhoneInput(item.student.parentPhone || '');
      return;
    }

    const opened = openWhatsAppChat(item.student.parentPhone, item.message);
    if (opened) {
      setSentMap((prev) => new Map(prev).set(item.id, Date.now()));
      if (advanceQueue && activeQueueIndex < selectedItemsInQueue.length - 1) {
        setActiveQueueIndex((prev) => prev + 1);
      }
    }
  };

  // Save updated phone number
  const handleSavePhone = (studentId: string) => {
    if (onUpdateStudentPhone && tempPhoneInput.trim()) {
      onUpdateStudentPhone(studentId, tempPhoneInput.trim());
    }
    setEditingPhoneStudentId(null);
  };

  // Automated batch sending loop
  const handleStopAutoSend = () => {
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }
    setIsAutoSending(false);
  };

  const handleStartAutoSend = () => {
    if (selectedItemsInQueue.length === 0) return;
    setIsAutoSending(true);

    let currentIndex = activeQueueIndex;

    const sendNext = () => {
      if (currentIndex >= selectedItemsInQueue.length) {
        setIsAutoSending(false);
        return;
      }

      const item = selectedItemsInQueue[currentIndex];
      if (item.hasValidPhone && item.student.parentPhone) {
        openWhatsAppChat(item.student.parentPhone, item.message);
        setSentMap((prev) => new Map(prev).set(item.id, Date.now()));
      }

      currentIndex += 1;
      setActiveQueueIndex(currentIndex < selectedItemsInQueue.length ? currentIndex : selectedItemsInQueue.length - 1);

      if (currentIndex < selectedItemsInQueue.length) {
        autoSendTimeoutRef.current = setTimeout(sendNext, 2000); // 2 second pause between window opens to prevent browser blockage
      } else {
        setIsAutoSending(false);
      }
    };

    sendNext();
  };

  // Clean up auto sending on unmount
  useEffect(() => {
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, []);

  // Copy all recipients summary to clipboard
  const handleCopySummary = () => {
    const lines = selectedItemsInQueue.map((item, idx) => {
      return `${idx + 1}. ${item.student.name} (${item.student.className}) - ${item.student.parentPhone || 'No WA Kosong'}\nPesan:\n${item.message}\n------------------------`;
    });
    const header = `REKAP PESAN WHATSAPP MASSAL - ${config.schoolName}\nTanggal: ${formatIndonesianDate(selectedDate)}\nKategori: ${targetType === 'BELUM_HADIR' ? 'Siswa Belum Hadir' : 'Siswa Terlambat'}\nTotal: ${selectedItemsInQueue.length} Siswa\n========================\n\n`;
    navigator.clipboard.writeText(header + lines.join('\n\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Copy current preview message
  const handleCopyCurrentMsg = () => {
    if (currentQueueItem) {
      navigator.clipboard.writeText(currentQueueItem.message);
      setCopiedCurrentMsg(true);
      setTimeout(() => setCopiedCurrentMsg(false), 2000);
    }
  };

  // Counters
  const totalInCurrentPool = currentPool.length;
  const validPhoneCount = currentPool.filter((i) => i.hasValidPhone).length;
  const sentCount = currentPool.filter((i) => sentMap.has(i.id)).length;
  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/90 overflow-hidden relative my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  Kirim Pesan WhatsApp Massal
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 border border-emerald-400/40">
                  Resmi wa.me
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Tanggal: <strong>{formatIndonesianDate(selectedDate)}</strong>
                {selectedClass !== 'ALL' && <span> • Kelas: <strong>{selectedClass}</strong></span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Category Tabs (Belum Hadir vs Terlambat) */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetType('BELUM_HADIR');
                handleStopAutoSend();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                targetType === 'BELUM_HADIR'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>Siswa Belum Hadir</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  targetType === 'BELUM_HADIR'
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {unrecordedRecipients.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetType('TERLAMBAT');
                handleStopAutoSend();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                targetType === 'TERLAMBAT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Siswa Terlambat</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  targetType === 'TERLAMBAT'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {lateRecipients.length}
              </span>
            </button>
          </div>

          {/* View Mode Switcher: Antrean Interaktif vs Daftar Lengkap */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'queue'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Berurutan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Lengkap ({currentPool.length})</span>
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between text-xs gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-slate-600">
            <div>
              Total Target: <strong className="text-slate-900 font-mono">{totalInCurrentPool}</strong> Siswa
            </div>
            <div>
              Terpilih: <strong className="text-emerald-700 font-mono">{selectedCount}</strong>
            </div>
            <div>
              No. WA Valid: <strong className="text-emerald-700 font-mono">{validPhoneCount}</strong>
              {totalInCurrentPool - validPhoneCount > 0 && (
                <span className="text-rose-600 ml-1">({totalInCurrentPool - validPhoneCount} Tanpa No)</span>
              )}
            </div>
            <div>
              Sudah Terkirim:{' '}
              <strong className="text-blue-700 font-mono">{sentCount}</strong> / {totalInCurrentPool}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Salin rekap nomor & teks pesan semua siswa yang dipilih"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-emerald-600" />
                  <span>Salin Rekap Pesan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {totalInCurrentPool === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-base font-extrabold text-slate-800">
                {targetType === 'BELUM_HADIR'
                  ? 'Tidak Ada Siswa Belum Hadir!'
                  : 'Tidak Ada Siswa Terlambat!'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {targetType === 'BELUM_HADIR'
                  ? `Seluruh siswa pada tanggal ${formatIndonesianDate(selectedDate)} telah tercatat presensinya.`
                  : `Tidak ada catatan keterlambatan siswa untuk tanggal ${formatIndonesianDate(selectedDate)}.`}
              </p>
            </div>
          ) : viewMode === 'queue' ? (
            /* ============================================================ */
            /* MODE 1: STEP-BY-STEP QUEUE RUNNER                            */
            /* ============================================================ */
            selectedItemsInQueue.length === 0 ? (
              <div className="text-center py-12 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-sm">Tidak ada siswa yang dipilih dalam antrean.</p>
                <p className="text-xs text-amber-700 mt-1">
                  Beralihlah ke tab "Daftar Lengkap" atau centang siswa untuk memulai pengiriman.
                </p>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 cursor-pointer"
                >
                  Pilih Semua Siswa
                </button>
              </div>
            ) : currentQueueItem ? (
              <div className="space-y-4">
                {/* Progress Bar & Counter */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      Antrean Pengiriman: Siswa {activeQueueIndex + 1} dari {selectedItemsInQueue.length}
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {Math.round(((activeQueueIndex + 1) / selectedItemsInQueue.length) * 100)}% Selesai
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${((activeQueueIndex + 1) / selectedItemsInQueue.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Main Card: Active Recipient & WhatsApp Bubble */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left Column: Student Details & Controls (5 cols) */}
                  <div className="md:col-span-5 space-y-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          Penerima Aktif
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            targetType === 'BELUM_HADIR'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {targetType === 'BELUM_HADIR' ? 'Belum Hadir' : 'Terlambat'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                          {currentQueueItem.student.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700">
                            {currentQueueItem.student.className}
                          </span>
                          <span>NIS: {currentQueueItem.student.nis}</span>
                        </div>
                      </div>

                      {/* Phone Number Box with Edit option */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> No. WhatsApp Wali
                          </span>
                          {editingPhoneStudentId !== currentQueueItem.student.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPhoneStudentId(currentQueueItem.student.id);
                                setTempPhoneInput(currentQueueItem.student.parentPhone || '');
                              }}
                              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Edit3 className="w-2.5 h-2.5" /> Ubah
                            </button>
                          )}
                        </div>

                        {editingPhoneStudentId === currentQueueItem.student.id ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={tempPhoneInput}
                              onChange={(e) => setTempPhoneInput(e.target.value)}
                              placeholder="08xxxxxxxxxx"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-400 rounded-lg focus:outline-none font-mono"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingPhoneStudentId(null)}
                                className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSavePhone(currentQueueItem.student.id)}
                                className="px-2.5 py-1 text-[10px] bg-blue-600 text-white font-bold rounded cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        ) : currentQueueItem.hasValidPhone ? (
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-emerald-800">
                              {currentQueueItem.formattedPhone}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Valid
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Nomor belum diisi atau tidak valid!</span>
                          </div>
                        )}
                      </div>

                      {/* Status Terkirim Badge */}
                      {currentQueueItem.sentAt ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Pesan Sudah Dikirim
                          </span>
                          <span className="font-mono text-[10px] text-emerald-600">
                            {getCurrentTimeString(currentQueueItem.sentAt, false, config.timeZone || 'WIT')} {config.timeZone || 'WIT'}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>Status: Menunggu Dikirim</span>
                        </div>
                      )}

                      {/* Big CTA Action Button */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendSingle(currentQueueItem, true)}
                          disabled={!currentQueueItem.hasValidPhone}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer ${
                            currentQueueItem.hasValidPhone
                              ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-98'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                          <span>
                            {currentQueueItem.sentAt
                              ? 'Kirim Ulang & Siswa Berikutnya'
                              : 'Buka WhatsApp & Kirim (Lanjut)'}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </button>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveQueueIndex((prev) => Math.max(0, prev - 1))}
                            disabled={activeQueueIndex === 0}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              activeQueueIndex === 0
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActiveQueueIndex((prev) =>
                                Math.min(selectedItemsInQueue.length - 1, prev + 1)
                              )
                            }
                            disabled={activeQueueIndex === selectedItemsInQueue.length - 1}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              activeQueueIndex === selectedItemsInQueue.length - 1
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            Lewati / Berikutnya <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Auto batch sequential sender helper */}
                    <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                          <Play className="w-3 h-3 text-blue-600" /> Buka Tab Otomatis Bertahap
                        </span>
                        {isAutoSending && (
                          <span className="text-[10px] font-bold text-blue-700 animate-pulse">
                            Sedang Berjalan...
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-blue-800/80 leading-relaxed">
                        Membuka jendela WhatsApp setiap 2 detik secara berurutan. Pastikan perizinan <em>Pop-up</em> pada browser Anda diizinkan.
                      </p>
                      {isAutoSending ? (
                        <button
                          type="button"
                          onClick={handleStopAutoSend}
                          className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Pause className="w-3.5 h-3.5" /> Hentikan Proses Otomatis
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartAutoSend}
                          className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" /> Mulai Buka Semua Tab Bertahap
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live WhatsApp Bubble Preview (7 cols) */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Pratinjau Pesan Personal ({currentQueueItem.student.name})
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCurrentMsg}
                        className="text-[11px] text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCurrentMsg ? (
                          <>
                            <Check className="w-3 h-3" /> Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Salin Teks
                          </>
                        )}
                      </button>
                    </div>

                    {/* WhatsApp Background Chat Container */}
                    <div className="rounded-2xl border border-slate-200 bg-[#EFEAE2] p-4 sm:p-5 shadow-inner min-h-[300px] flex flex-col justify-between relative overflow-hidden">
                      {/* WhatsApp Watermark Doodle Effect */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

                      {/* Date Pill inside WhatsApp Chat */}
                      <div className="flex justify-center mb-3">
                        <span className="bg-white/80 backdrop-blur-xs text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs border border-slate-200/50">
                          {formatIndonesianDate(selectedDate)}
                        </span>
                      </div>

                      {/* Outgoing Message Bubble */}
                      <div className="flex justify-end relative z-10 mb-2">
                        <div className="bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-3.5 max-w-md shadow-xs border border-[#C5E8BF] text-slate-800 text-xs leading-relaxed space-y-2">
                          <div className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed select-text">
                            {currentQueueItem.message}
                          </div>

                          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-1 font-mono">
                            <span>
                              {currentQueueItem.record?.time?.slice(0, 5) ||
                                getCurrentTimeString(new Date(), false, config.timeZone || 'WIT')}
                            </span>
                            <Check className="w-3 h-3 text-blue-500" />
                          </div>
                        </div>
                      </div>

                      {/* Info footer inside phone mockup */}
                      <div className="text-center text-[10px] text-slate-500 bg-white/70 py-1.5 px-3 rounded-xl border border-slate-200/60 mt-auto">
                        Teks di atas dihasilkan otomatis dari template pengaturan presensi dengan token nama siswa, kelas, dan status kehadiran.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          ) : (
            /* ============================================================ */
            /* MODE 2: FULL TABLE / BATCH SELECTION LIST                     */
            /* ============================================================ */
            <div className="space-y-3">
              {/* Table Toolbar: Search, Filters, Select All */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>Batal Pilih</span>
                  </button>

                  <select
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value as any)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                  >
                    <option value="ALL">Semua Nomor</option>
                    <option value="VALID_ONLY">Hanya No. WA Valid</option>
                    <option value="UNSENT_ONLY">Hanya Belum Terkirim</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau NIS..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Table of Targets */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[440px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 z-10">
                      <tr className="text-slate-600 uppercase font-bold text-[11px]">
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredPool.length > 0 &&
                              filteredPool.every((item) => selectedIds.has(item.id))
                            }
                            onChange={(e) => {
                              if (e.target.checked) handleSelectAll();
                              else handleDeselectAll();
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3">Nama Siswa</th>
                        <th className="py-2.5 px-3">Kelas</th>
                        <th className="py-2.5 px-3">NIS</th>
                        <th className="py-2.5 px-3">No. WhatsApp Wali</th>
                        <th className="py-2.5 px-3">Status Pengiriman</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPool.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Tidak ada siswa yang sesuai kriteria pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredPool.map((item) => {
                          const isSelected = selectedIds.has(item.id);
                          const isSent = !!item.sentAt;

                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors ${
                                isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(item.id)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-extrabold text-slate-900">
                                  {item.student.name}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {item.student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </div>
                              </td>

                              <td className="py-3 px-3 font-semibold text-slate-700">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                                  {item.student.className}
                                </span>
                              </td>

                              <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                                {item.student.nis}
                              </td>

                              <td className="py-3 px-3">
                                {editingPhoneStudentId === item.student.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={tempPhoneInput}
                                      onChange={(e) => setTempPhoneInput(e.target.value)}
                                      placeholder="08xxxxxxxxxx"
                                      className="w-28 px-2 py-1 text-xs bg-white border border-blue-400 rounded focus:outline-none font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSavePhone(item.student.id)}
                                      className="p-1 bg-blue-600 text-white rounded cursor-pointer"
                                      title="Simpan"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : item.hasValidPhone ? (
                                  <div className="flex items-center gap-1.5 font-mono text-emerald-800 font-bold text-xs">
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-current shrink-0" />
                                    <span>{item.formattedPhone}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPhoneStudentId(item.student.id);
                                        setTempPhoneInput(item.student.parentPhone || '');
                                      }}
                                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer"
                                      title="Edit No WA"
                                    >
                                      <Edit3 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPhoneStudentId(item.student.id);
                                      setTempPhoneInput(item.student.parentPhone || '');
                                    }}
                                    className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold cursor-pointer hover:bg-rose-100 flex items-center gap-1"
                                  >
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span>Isi No WA</span>
                                  </button>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                {isSent ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3 text-emerald-600" /> Terkirim
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3 text-slate-400" /> Belum
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleSendSingle(item, false)}
                                  disabled={!item.hasValidPhone}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    item.hasValidPhone
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95'
                                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                  title="Kirim Pesan WhatsApp Langsung"
                                >
                                  <MessageCircle className="w-3 h-3 fill-current" />
                                  <span>Kirim</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Terpilih <strong>{selectedCount}</strong> dari <strong>{totalInCurrentPool}</strong> siswa •{' '}
            <span className="text-emerald-700 font-bold">{sentCount} telah terkirim</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {viewMode === 'table' && (
              <button
                type="button"
                onClick={() => setViewMode('queue')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buka Antrean Kirim Berurutan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
