import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserX,
  Search,
  Users,
  MessageSquare,
  Calendar,
  Plus,
  Send,
  Sparkles,
  Info,
  HeartPulse,
  FileText,
  Edit3,
  Check,
  RotateCcw,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceType, SchoolConfig } from '../../types';
import { getTodayDateString, formatIndonesianDate, DEFAULT_CLASSES } from '../../data/initialData';
import { getCurrentTimeString } from '../../utils/time';
import { AdminAbsenceModal } from './AdminAbsenceModal';

interface ActiveAttendanceViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateRecordStatus: (recordId: string, newStatus: AttendanceStatus, note?: string) => void;
  onSetStudentAttendance?: (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    note?: string,
    type?: AttendanceType
  ) => void;
  onBatchSetAttendance?: (
    studentIds: string[],
    date: string,
    status: AttendanceStatus,
    note?: string,
    type?: AttendanceType
  ) => void;
  onOpenRecordWa: (record: AttendanceRecord) => void;
  onOpenAbsentWa: (student: Student) => void;
  onOpenScanner: () => void;
}

export const ActiveAttendanceView: React.FC<ActiveAttendanceViewProps> = ({
  students,
  records,
  config,
  onAddAttendance,
  onUpdateRecordStatus,
  onSetStudentAttendance,
  onBatchSetAttendance,
  onOpenRecordWa,
  onOpenAbsentWa,
  onOpenScanner,
}) => {
  const todayStr = getTodayDateString();
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Multi-select state for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Admin Absence Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStudentId, setModalStudentId] = useState<string>('');
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('IZIN');
  const [modalDate, setModalDate] = useState<string>(todayStr);
  const [modalNote, setModalNote] = useState<string>('');
  const [modalBatchIds, setModalBatchIds] = useState<string[]>([]);

  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  // Records for the currently viewed date
  const activeDateRecords = useMemo(() => {
    return records.filter((r) => r.date === selectedDate);
  }, [records, selectedDate]);

  // Student status mapping for the selected date
  const studentStatusList = useMemo(() => {
    return students.map((student) => {
      const masukRecord = activeDateRecords.find((r) => r.studentId === student.id && r.type === 'MASUK');
      const pulangRecord = activeDateRecords.find((r) => r.studentId === student.id && r.type === 'PULANG');

      let currentStatus: AttendanceStatus | 'BELUM_HADIR' = 'BELUM_HADIR';
      let recordTime = '-';
      let note = '';

      if (masukRecord) {
        currentStatus = masukRecord.status;
        recordTime = masukRecord.time;
        note = masukRecord.note || '';
      }

      return {
        student,
        currentStatus,
        recordTime,
        note,
        masukRecord,
        pulangRecord,
      };
    });
  }, [students, activeDateRecords]);

  // Filtered student list
  const filteredList = useMemo(() => {
    return studentStatusList.filter(({ student, currentStatus }) => {
      const matchesClass = selectedClass === 'ALL' || student.className === selectedClass;
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nis.includes(searchQuery) ||
        student.nisn.includes(searchQuery);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'HADIR' && currentStatus === 'HADIR') ||
        (statusFilter === 'TERLAMBAT' && currentStatus === 'TERLAMBAT') ||
        (statusFilter === 'ALPA' && (currentStatus === 'ALPA' || currentStatus === 'BELUM_HADIR')) ||
        (statusFilter === 'IZIN' && currentStatus === 'IZIN') ||
        (statusFilter === 'SAKIT' && currentStatus === 'SAKIT') ||
        (statusFilter === 'BELUM_HADIR' && currentStatus === 'BELUM_HADIR');

      return matchesClass && matchesSearch && matchesStatus;
    });
  }, [studentStatusList, selectedClass, searchQuery, statusFilter]);

  // Summary counts for current date
  const hadirCount = studentStatusList.filter((s) => s.currentStatus === 'HADIR').length;
  const terlambatCount = studentStatusList.filter((s) => s.currentStatus === 'TERLAMBAT').length;
  const izinCount = studentStatusList.filter((s) => s.currentStatus === 'IZIN').length;
  const sakitCount = studentStatusList.filter((s) => s.currentStatus === 'SAKIT').length;
  const alpaCount = studentStatusList.filter((s) => s.currentStatus === 'ALPA').length;
  const belumHadirCount = studentStatusList.filter((s) => s.currentStatus === 'BELUM_HADIR').length;

  // Open modal for a specific student
  const handleOpenStudentModal = (student: Student, defaultStatus: AttendanceStatus = 'IZIN') => {
    const existing = activeDateRecords.find((r) => r.studentId === student.id && r.type === 'MASUK');
    setModalStudentId(student.id);
    setModalStatus(existing ? existing.status : defaultStatus);
    setModalDate(selectedDate);
    setModalNote(existing?.note || '');
    setModalBatchIds([]);
    setIsModalOpen(true);
  };

  // Open modal for bulk actions
  const handleOpenBulkModal = (status: AttendanceStatus = 'IZIN') => {
    if (selectedStudentIds.length === 0) return;
    setModalStatus(status);
    setModalDate(selectedDate);
    setModalNote('');
    setModalBatchIds(selectedStudentIds);
    setIsModalOpen(true);
  };

  // Open empty modal from top button
  const handleOpenGeneralModal = () => {
    setModalStudentId(students[0]?.id || '');
    setModalStatus('IZIN');
    setModalDate(selectedDate);
    setModalNote('');
    setModalBatchIds([]);
    setIsModalOpen(true);
  };

  // Handle single save from modal
  const handleSaveSingle = (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    note: string,
    type: AttendanceType = 'MASUK'
  ) => {
    if (onSetStudentAttendance) {
      onSetStudentAttendance(studentId, date, status, note, type);
    } else {
      const existing = records.find(
        (r) => r.studentId === studentId && r.date === date && r.type === type
      );
      if (existing) {
        onUpdateRecordStatus(existing.id, status, note);
      } else {
        const student = students.find((s) => s.id === studentId);
        if (!student) return;
        const timeStr = getCurrentTimeString(new Date(), true, config.timeZone || 'WIT');
        onAddAttendance({
          id: 'ATT-MANUAL-' + Date.now(),
          studentId: student.id,
          studentNis: student.nis,
          studentNisn: student.nisn,
          studentName: student.name,
          studentClass: student.className,
          gender: student.gender,
          date,
          time: timeStr,
          type,
          status,
          note,
          timestamp: Date.now(),
        });
      }
    }
  };

  // Handle batch save from modal
  const handleSaveBatch = (
    studentIds: string[],
    date: string,
    status: AttendanceStatus,
    note: string,
    type: AttendanceType = 'MASUK'
  ) => {
    if (onBatchSetAttendance) {
      onBatchSetAttendance(studentIds, date, status, note, type);
    } else {
      studentIds.forEach((sId) => handleSaveSingle(sId, date, status, note, type));
    }
    setSelectedStudentIds([]);
  };

  // Quick 1-click status change
  const handleQuickMark = (student: Student, status: AttendanceStatus) => {
    const existing = activeDateRecords.find((r) => r.studentId === student.id && r.type === 'MASUK');
    const defaultNote =
      status === 'SAKIT'
        ? 'Sakit (Dicatat admin)'
        : status === 'IZIN'
        ? 'Izin (Dicatat admin)'
        : status === 'ALPA'
        ? 'Alpa / Tanpa keterangan'
        : status === 'TERLAMBAT'
        ? 'Terlambat masuk'
        : 'Hadir tepat waktu';

    if (onSetStudentAttendance) {
      onSetStudentAttendance(student.id, selectedDate, status, defaultNote, 'MASUK');
    } else if (existing) {
      onUpdateRecordStatus(existing.id, status, defaultNote);
    } else {
      const timeStr = getCurrentTimeString(new Date(), true, config.timeZone || 'WIT');
      onAddAttendance({
        id: 'ATT-QUICK-' + Date.now(),
        studentId: student.id,
        studentNis: student.nis,
        studentNisn: student.nisn,
        studentName: student.name,
        studentClass: student.className,
        gender: student.gender,
        date: selectedDate,
        time: timeStr,
        type: 'MASUK',
        status,
        note: defaultNote,
        timestamp: Date.now(),
      });
    }
  };

  // Toggle single row selection
  const handleToggleRowSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Select / Deselect all filtered rows
  const handleToggleSelectAll = () => {
    const filteredIds = filteredList.map((item) => item.student.id);
    const allSelected = filteredIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const isAllFilteredSelected =
    filteredList.length > 0 &&
    filteredList.every((item) => selectedStudentIds.includes(item.student.id));

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-slate-750">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 mb-1">
              <CheckSquare className="w-3.5 h-3.5" />
              Sistem Manajemen Kehadiran Siswa
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Absensi Harian &amp; Pengaturan Status
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Admin dapat langsung mencatat, mengubah, dan mengelola status <span className="font-bold text-sky-600 dark:text-sky-400">Sakit</span>, <span className="font-bold text-blue-600 dark:text-blue-400">Izin</span>, dan <span className="font-bold text-rose-600 dark:text-rose-400">Alpa</span> beserta keterangan resmi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Action: Atur Sakit, Izin & Alpa */}
            <button
              type="button"
              onClick={handleOpenGeneralModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-sky-200" />
              <span>Atur Sakit, Izin &amp; Alpa</span>
            </button>

            {/* Scan QR Button */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <span>Scan QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        {/* SEMUA */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`bg-white dark:bg-slate-850 p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/20 shadow-xs'
              : 'border-slate-200/90 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Total Siswa</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {students.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Semua data</div>
        </div>

        {/* HADIR */}
        <div
          onClick={() => setStatusFilter('HADIR')}
          className={`bg-white dark:bg-slate-850 p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'HADIR'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs bg-emerald-50/20'
              : 'border-slate-200/90 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>Hadir</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950 dark:text-emerald-200 mt-1">
            {hadirCount}
          </div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">Tepat waktu</div>
        </div>

        {/* TERLAMBAT */}
        <div
          onClick={() => setStatusFilter('TERLAMBAT')}
          className={`bg-white dark:bg-slate-850 p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'TERLAMBAT'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs bg-amber-50/20'
              : 'border-slate-200/90 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>Terlambat</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-950 dark:text-amber-200 mt-1">
            {terlambatCount}
          </div>
          <div className="text-[10px] text-amber-600/70 mt-0.5">Koreksi jam</div>
        </div>

        {/* SAKIT */}
        <div
          onClick={() => setStatusFilter('SAKIT')}
          className={`bg-white dark:bg-slate-850 p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'SAKIT'
              ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-xs bg-sky-50/40 dark:bg-sky-950/30'
              : 'border-slate-200/90 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-[11px] font-bold text-sky-700 dark:text-sky-400 flex items-center justify-between">
            <span>Sakit (S)</span>
            <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-950 dark:text-sky-200 mt-1">
            {sakitCount}
          </div>
          <div className="text-[10px] text-sky-600/70 mt-0.5">Surat dokter</div>
        </div>

        {/* IZIN */}
        <div
          onClick={() => setStatusFilter('IZIN')}
          className={`bg-white dark:bg-slate-850 p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'IZIN'
              ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-xs bg-blue-50/40 dark:bg-blue-950/30'
              : 'border-slate-200/90 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center justify-between">
            <span>Izin (I)</span>
            <FileText className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-950 dark:text-blue-200 mt-1">
            {izinCount}
          </div>
          <div className="text-[10px] text-blue-600/70 mt-0.5">Surat orang tua</div>
        </div>

        {/* ALPA / BELUM HADIR */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ALPA' ? 'ALL' : 'ALPA')}
          className={`bg-white dark:bg-slate-850 p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALPA' || statusFilter === 'BELUM_HADIR'
              ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-xs bg-rose-50/40 dark:bg-rose-950/30'
              : 'border-slate-200/90 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between">
            <span>Alpa / Belum</span>
            <UserX className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-950 dark:text-rose-200 mt-1">
            {alpaCount + belumHadirCount}
          </div>
          <div className="text-[10px] text-rose-600/80 font-bold mt-0.5">
            {alpaCount > 0 ? `${alpaCount} Alpa` : 'Tanpa kabar'}
          </div>
        </div>
      </div>

      {/* 3. Search, Class Filter, and Date Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa, NIS, atau nama..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Class Selector */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">Semua Kelas</option>
            {classList.map((c) => (
              <option key={c} value={c}>
                Kelas {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="HADIR">Hadir Saja</option>
            <option value="TERLAMBAT">Terlambat Saja</option>
            <option value="SAKIT">Sakit (S) Saja</option>
            <option value="IZIN">Izin (I) Saja</option>
            <option value="ALPA">Alpa (A) Saja</option>
            <option value="BELUM_HADIR">Belum Presensi Saja</option>
          </select>

          {/* Date Picker */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white pr-2 py-0.5 focus:outline-none cursor-pointer"
            />
            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 rounded cursor-pointer"
                title="Kembali ke Hari Ini"
              >
                Hari Ini
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Table of Students with Status & Quick Actions */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-750 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Pilih semua siswa di tabel"
                  />
                </th>
                <th className="py-3 px-2 w-10 text-center">No</th>
                <th className="py-3 px-3">Identitas Siswa</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3 text-center">Jam</th>
                <th className="py-3 px-3 text-center">Status Kehadiran</th>
                <th className="py-3 px-3">Keterangan / Alasan</th>
                <th className="py-3 px-3 text-center">Atur Status</th>
                <th className="py-3 px-3 text-center w-24">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredList.length > 0 ? (
                filteredList.map(({ student, currentStatus, recordTime, note, masukRecord }, idx) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRowSelection(student.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Number */}
                      <td className="py-3 px-2 text-center font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Student Identity */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {student.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          NIS: {student.nis} • {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {student.className}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-3 text-center font-mono text-xs whitespace-nowrap">
                        {recordTime !== '-' ? (
                          <span className="font-bold text-slate-900 dark:text-white">
                            {recordTime}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenStudentModal(student)}
                          className="cursor-pointer group focus:outline-none"
                          title="Klik untuk mengubah status presensi siswa ini"
                        >
                          {currentStatus === 'HADIR' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 group-hover:ring-2 group-hover:ring-emerald-500/20 transition-all">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hadir</span>
                            </span>
                          )}
                          {currentStatus === 'TERLAMBAT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 group-hover:ring-2 group-hover:ring-amber-500/20 transition-all">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Terlambat</span>
                            </span>
                          )}
                          {currentStatus === 'IZIN' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500/30 transition-all">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Izin (I)</span>
                            </span>
                          )}
                          {currentStatus === 'SAKIT' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs group-hover:ring-2 group-hover:ring-sky-500/30 transition-all">
                              <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
                              <span>Sakit (S)</span>
                            </span>
                          )}
                          {currentStatus === 'ALPA' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs group-hover:ring-2 group-hover:ring-rose-500/30 transition-all">
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                              <span>Alpa (A)</span>
                            </span>
                          )}
                          {currentStatus === 'BELUM_HADIR' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:border-slate-400 transition-all">
                              <span>Belum Hadir</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Note / Keterangan (Clickable to edit) */}
                      <td className="py-3 px-3">
                        <div
                          onClick={() => handleOpenStudentModal(student)}
                          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 group max-w-xs"
                          title="Klik untuk mengubah keterangan/alasan siswa ini"
                        >
                          <span className="truncate">
                            {note || (
                              <span className="text-slate-400 italic">
                                Belum ada keterangan (Klik untuk isi)
                              </span>
                            )}
                          </span>
                          <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>

                      {/* Atur Status Buttons */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          {/* Sakit (S) */}
                          <button
                            type="button"
                            onClick={() => handleOpenStudentModal(student, 'SAKIT')}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              currentStatus === 'SAKIT'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950'
                            }`}
                            title="Atur Sakit (S)"
                          >
                            S
                          </button>

                          {/* Izin (I) */}
                          <button
                            type="button"
                            onClick={() => handleOpenStudentModal(student, 'IZIN')}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              currentStatus === 'IZIN'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950'
                            }`}
                            title="Atur Izin (I)"
                          >
                            I
                          </button>

                          {/* Alpa (A) */}
                          <button
                            type="button"
                            onClick={() => handleOpenStudentModal(student, 'ALPA')}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              currentStatus === 'ALPA'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950'
                            }`}
                            title="Atur Alpa (A)"
                          >
                            A
                          </button>

                          {/* Hadir (H) */}
                          <button
                            type="button"
                            onClick={() => handleQuickMark(student, 'HADIR')}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              currentStatus === 'HADIR'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                            }`}
                            title="Tandai Hadir (H)"
                          >
                            H
                          </button>

                          {/* More / Detailed Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStudentModal(student)}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors cursor-pointer"
                            title="Buka form detail status & keterangan"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* WhatsApp Button */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {masukRecord ? (
                          <button
                            type="button"
                            onClick={() => onOpenRecordWa(masukRecord)}
                            className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors cursor-pointer"
                            title="Kirim notifikasi presensi ke WA orang tua"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenAbsentWa(student)}
                            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 border border-rose-200/80 dark:border-rose-800/60 transition-colors cursor-pointer"
                            title="Kirim konfirmasi belum hadir ke WA orang tua"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Sticky Floating Batch Action Bar when students are selected */}
      {selectedStudentIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-750 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="text-xs font-bold whitespace-nowrap">
            <span className="bg-blue-600 px-2 py-0.5 rounded-lg text-white font-mono mr-1.5">
              {selectedStudentIds.length}
            </span>
            Siswa Dipilih:
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenBulkModal('SAKIT')}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Sakit (S)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkModal('IZIN')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Izin (I)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkModal('ALPA')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Alpa (A)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer ml-1"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 6. Admin Absence Modal */}
      <AdminAbsenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        students={students}
        records={records}
        config={config}
        initialStudentId={modalStudentId}
        initialStatus={modalStatus}
        initialDate={modalDate}
        initialNote={modalNote}
        initialSelectedStudentIds={modalBatchIds}
        onSaveSingle={handleSaveSingle}
        onSaveBatch={handleSaveBatch}
      />
    </div>
  );
};
