import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  UserX,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Plus,
  Send,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  BarChart3,
  ListFilter,
  TrendingUp,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceType, SchoolConfig } from '../../types';
import { formatIndonesianDate, getTodayDateString, DEFAULT_CLASSES } from '../../data/initialData';
import { getCurrentTimeString } from '../../utils/time';
import { parseYMDToDate, formatDateToYMD, exportRecapToExcel } from '../../utils/recapUtils';
import { BulkWhatsAppTargetType } from '../BulkWhatsAppModal';
import { formatDisplayPhone } from '../../utils/whatsapp';
import { PrintReportModal } from './PrintReportModal';

interface RecapDailyViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onUpdateRecordStatus: (recordId: string, newStatus: AttendanceStatus, note?: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onOpenManualModal: () => void;
  onOpenRecordWa: (record: AttendanceRecord) => void;
  onOpenAbsentWa: (student: Student) => void;
  onOpenBulkWa: (target: BulkWhatsAppTargetType) => void;
  onEditRecord: (record: AttendanceRecord) => void;
}

export const RecapDailyView: React.FC<RecapDailyViewProps> = ({
  students,
  records,
  config,
  selectedDate,
  onSelectDate,
  onUpdateRecordStatus,
  onDeleteRecord,
  onOpenManualModal,
  onOpenRecordWa,
  onOpenAbsentWa,
  onOpenBulkWa,
  onEditRecord,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'absent' | 'classSummary' | 'chart'>('records');
  const [isStacked, setIsStacked] = useState<boolean>(false);
  const [showBulkWaMenu, setShowBulkWaMenu] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  // Navigate dates
  const handlePrevDay = () => {
    const d = parseYMDToDate(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(formatDateToYMD(d));
  };

  const handleNextDay = () => {
    const d = parseYMDToDate(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(formatDateToYMD(d));
  };

  const handleToday = () => {
    onSelectDate(getTodayDateString());
  };

  const handleYesterday = () => {
    const d = parseYMDToDate(getTodayDateString());
    d.setDate(d.getDate() - 1);
    onSelectDate(formatDateToYMD(d));
  };

  // Filter records by selected date
  const dateRecords = useMemo(() => {
    return records.filter((r) => r.date === selectedDate);
  }, [records, selectedDate]);

  // Unrecorded / absent students for this date
  const unrecordedStudents = useMemo(() => {
    const recordedStudentIds = new Set(dateRecords.map((r) => r.studentId));
    return students
      .filter((s) => (selectedClass === 'ALL' || s.className === selectedClass) && !recordedStudentIds.has(s.id))
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.nis.includes(q) ||
          s.nisn.includes(q) ||
          s.className.toLowerCase().includes(q)
        );
      });
  }, [students, dateRecords, selectedClass, searchQuery]);

  // Daily metrics
  const metrics = useMemo(() => {
    const activeStudents =
      selectedClass === 'ALL'
        ? students
        : students.filter((s) => s.className === selectedClass);

    const activeRecords =
      selectedClass === 'ALL'
        ? dateRecords
        : dateRecords.filter((r) => r.studentClass === selectedClass);

    const attendedStudentIds = new Set(
      activeRecords.filter((r) => ['HADIR', 'TERLAMBAT'].includes(r.status)).map((r) => r.studentId)
    );
    const izinSakitIds = new Set(
      activeRecords.filter((r) => ['IZIN', 'SAKIT'].includes(r.status)).map((r) => r.studentId)
    );

    const totalStudents = activeStudents.length;
    const hadirOnTime = activeRecords.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
    const terlambat = activeRecords.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
    const izin = activeRecords.filter((r) => r.status === 'IZIN').length;
    const sakit = activeRecords.filter((r) => r.status === 'SAKIT').length;
    const belumHadir = Math.max(
      0,
      totalStudents - attendedStudentIds.size - izinSakitIds.size
    );

    const totalHadirMasuk = hadirOnTime + terlambat;
    const attendancePercent = totalStudents > 0 ? Math.round((totalHadirMasuk / totalStudents) * 100) : 0;

    return {
      total: totalStudents,
      hadirOnTime,
      terlambat,
      izinSakit: izin + sakit,
      izin,
      sakit,
      belumHadir,
      totalHadirMasuk,
      attendancePercent,
    };
  }, [students, dateRecords, selectedClass]);

  // Class by class summary comparison for this date
  const classComparison = useMemo(() => {
    return classList.map((cls) => {
      const clsStudents = students.filter((s) => s.className === cls);
      const clsRecords = dateRecords.filter((r) => r.studentClass === cls);
      const attendedIds = new Set(
        clsRecords.filter((r) => ['HADIR', 'TERLAMBAT'].includes(r.status)).map((r) => r.studentId)
      );
      const izinSakitIds = new Set(
        clsRecords.filter((r) => ['IZIN', 'SAKIT'].includes(r.status)).map((r) => r.studentId)
      );

      const hadir = clsRecords.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = clsRecords.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izin = clsRecords.filter((r) => r.status === 'IZIN').length;
      const sakit = clsRecords.filter((r) => r.status === 'SAKIT').length;
      const alpa = Math.max(0, clsStudents.length - attendedIds.size - izinSakitIds.size);
      const percent = clsStudents.length > 0 ? Math.round(((hadir + terlambat) / clsStudents.length) * 100) : 0;

      return {
        className: cls,
        total: clsStudents.length,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa,
        percent,
      };
    });
  }, [classList, students, dateRecords]);

  // Filtered records for table
  const filteredRecords = useMemo(() => {
    return dateRecords.filter((r) => {
      const matchesClass = selectedClass === 'ALL' || r.studentClass === selectedClass;
      const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentNis.includes(searchQuery) ||
        r.studentNisn.includes(searchQuery);
      return matchesClass && matchesStatus && matchesSearch;
    });
  }, [dateRecords, selectedClass, selectedStatus, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'NIS',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Jenis Kelamin',
      'Tipe Presensi',
      'Status Kehadiran',
      'Keterangan',
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.date,
      r.time,
      r.studentNis,
      r.studentNisn,
      r.studentName,
      r.studentClass,
      r.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      r.type,
      r.status,
      r.note || '',
    ]);

    exportRecapToExcel(
      `REKAPITULASI KEHADIRAN HARIAN (${formatIndonesianDate(selectedDate)})`,
      `Rekap_Harian_${selectedDate}_${config.schoolName.replace(/\s+/g, '_')}`,
      headers,
      rows,
      config
    );
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'NIS',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Jenis Kelamin',
      'Tipe Presensi',
      'Status Kehadiran',
      'Keterangan',
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.date,
      r.time,
      `'${r.studentNis}`,
      `'${r.studentNisn}`,
      `"${r.studentName}"`,
      r.studentClass,
      r.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      r.type,
      r.status,
      `"${r.note || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rekap_Harian_${selectedDate}_${config.schoolName.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const isToday = selectedDate === getTodayDateString();

  return (
    <div className="space-y-6">
      {/* 1. Date Selector and Controls Ribbon */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Date Navigation */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="relative flex items-center px-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onSelectDate(e.target.value)}
                  className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToday}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isToday
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleYesterday}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Kemarin
              </button>
            </div>

            <div className="hidden sm:block text-xs font-semibold text-slate-500">
              {formatIndonesianDate(selectedDate)}
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk WhatsApp Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBulkWaMenu((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                title="Kirim Notifikasi WhatsApp Massal ke Orang Tua"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Notifikasi WA</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {showBulkWaMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Kirim Notifikasi Orang Tua
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkWaMenu(false);
                      onOpenBulkWa('BELUM_HADIR');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Siswa Belum Hadir / Alpa</span>
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      {metrics.belumHadir}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkWaMenu(false);
                      onOpenBulkWa('TERLAMBAT');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Siswa Terlambat Hari Ini</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      {metrics.terlambat}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkWaMenu(false);
                      onOpenBulkWa('HADIR');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Siswa Hadir Tepat Waktu</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      {metrics.hadirOnTime}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Attendance */}
            <button
              type="button"
              onClick={onOpenManualModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Manual</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              title="Unduh file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Unduh file CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Cetak & Ekspor Laporan Presensi Harian ke Dokumen PDF"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filters: Class, Status, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
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

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Presensi
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">Hadir Tepat Waktu</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
              <option value="ALPA">Alpa</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pencarian Siswa
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama, NIS, atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Daily Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total Siswa</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa terdaftar</div>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800">Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-950 mt-1">{metrics.hadirOnTime}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Sebelum jam masuk</div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">Terlambat</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-950 mt-1">{metrics.terlambat}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Setelah jam batas</div>
        </div>

        <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800">Izin &amp; Sakit</span>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-950 mt-1">{metrics.izinSakit}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">
            I: {metrics.izin} | S: {metrics.sakit}
          </div>
        </div>

        <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-800">Alpa / Belum</span>
            <UserX className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-950 mt-1">{metrics.belumHadir}</div>
          <div className="text-[10px] text-red-700 mt-0.5">Belum scan kartu</div>
        </div>

        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300">Tingkat Hadir</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{metrics.attendancePercent}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, metrics.attendancePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Navigator */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('records')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'records'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Log Detail Presensi ({filteredRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('absent')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'absent'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Siswa Belum Hadir / Alpa ({unrecordedStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('classSummary')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'classSummary'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Perbandingan Per Kelas ({classList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('chart')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'chart'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Diagram Batang Harian</span>
        </button>
      </div>

      {/* 4. Sub-Tab Content */}
      {activeSubTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">NIS/NISN</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Keterangan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold">Belum ada rekaman presensi untuk filter ini.</p>
                      <p className="text-[11px] mt-0.5">Gunakan tombol "Input Manual" untuk menambah presensi langsung.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, index) => {
                    const statusBg =
                      rec.status === 'HADIR'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'TERLAMBAT'
                        ? 'bg-amber-100 text-amber-800'
                        : rec.status === 'IZIN'
                        ? 'bg-blue-100 text-blue-800'
                        : rec.status === 'SAKIT'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-red-100 text-red-800';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{index + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{rec.time}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          <div>{rec.studentNis}</div>
                          <div className="text-[10px] text-slate-400">{rec.studentNisn}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {rec.studentName}
                          <span className="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                            {rec.gender}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{rec.studentClass}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.type === 'MASUK'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {rec.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBg}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {rec.note || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenRecordWa(rec)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Kirim Notifikasi WhatsApp ke Orang Tua"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditRecord(rec)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ubah Status Presensi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus catatan presensi untuk ${rec.studentName}?`)) {
                                  onDeleteRecord(rec.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab: Absent Students */}
      {activeSubTab === 'absent' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-red-900 text-sm">
                Daftar Siswa Belum Hadir / Belum Tercatat ({unrecordedStudents.length})
              </h3>
              <p className="text-[11px] text-red-700 mt-0.5">
                Tanggal: {formatIndonesianDate(selectedDate)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenBulkWa('BELUM_HADIR')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Pengingat WA ke Semua</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">NIS</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3">L/P</th>
                  <th className="py-3 px-3">No. HP Orang Tua</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unrecordedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      Semua siswa pada kelas yang dipilih telah tercatat hadir!
                    </td>
                  </tr>
                ) : (
                  unrecordedStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{st.nis}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{st.name}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{st.className}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{st.gender}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {st.parentPhone ? formatDisplayPhone(st.parentPhone) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenAbsentWa(st)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab: Class by Class Summary */}
      {activeSubTab === 'classSummary' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">
              Rekapitulasi Kehadiran Antar Kelas ({formatIndonesianDate(selectedDate)})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tinjau komparasi disiplin dan persentase kehadiran setiap rombel pada hari ini
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3 text-center">Total Siswa</th>
                  <th className="py-3 px-3 text-center text-emerald-700">Tepat Waktu (H)</th>
                  <th className="py-3 px-3 text-center text-amber-700">Terlambat (T)</th>
                  <th className="py-3 px-3 text-center text-blue-700">Izin (I)</th>
                  <th className="py-3 px-3 text-center text-purple-700">Sakit (S)</th>
                  <th className="py-3 px-3 text-center text-red-700">Alpa (A)</th>
                  <th className="py-3 px-3 text-right">Persentase Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classComparison.map((row) => (
                  <tr key={row.className} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{row.className}</td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-800">{row.total}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                      {row.hadir}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/40">
                      {row.terlambat}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-blue-700">{row.izin}</td>
                    <td className="py-3 px-3 text-center font-medium text-purple-700">{row.sakit}</td>
                    <td className="py-3 px-3 text-center font-bold text-red-700 bg-red-50/40">{row.alpa}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              row.percent >= 90
                                ? 'bg-emerald-500'
                                : row.percent >= 75
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 font-mono text-xs">{row.percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab: Bar Charts (Diagram Batang Harian) */}
      {activeSubTab === 'chart' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Diagram Batang Kehadiran per Kelas ({formatIndonesianDate(selectedDate)})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Komparasi rincian status Hadir, Terlambat, Izin, Sakit, dan Alpa setiap rombongan belajar
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStacked(!isStacked)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isStacked
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isStacked ? 'Batang Tumpuk' : 'Berdampingan'}</span>
                </button>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classComparison.map((c) => ({
                    name: `Kls ${c.className}`,
                    className: c.className,
                    hadir: c.hadir,
                    terlambat: c.terlambat,
                    izin: c.izin,
                    sakit: c.sakit,
                    alpa: c.alpa,
                    percent: c.percent,
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs space-y-1 z-50 min-w-[160px]">
                            <div className="font-bold border-b border-slate-700 pb-1 text-slate-200">{label}</div>
                            {payload.map((entry: any, index: number) => (
                              <div key={`daily-tip-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                                <span className="flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                                  <span>{entry.name}:</span>
                                </span>
                                <span className="font-mono font-bold text-white">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar
                    dataKey="hadir"
                    name="Hadir (Tepat Waktu)"
                    fill="#10b981"
                    stackId={isStacked ? 'a' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="terlambat"
                    name="Terlambat"
                    fill="#f59e0b"
                    stackId={isStacked ? 'a' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="izin"
                    name="Izin"
                    fill="#3b82f6"
                    stackId={isStacked ? 'a' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="sakit"
                    name="Sakit"
                    fill="#8b5cf6"
                    stackId={isStacked ? 'a' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="alpa"
                    name="Alpa"
                    fill="#ef4444"
                    stackId={isStacked ? 'a' : undefined}
                    radius={isStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Diagram Persentase Tingkat Kehadiran per Kelas (%)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target kehadiran standar adalah minimal 90% (garis merah)
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classComparison.map((c) => ({
                    name: `Kls ${c.className}`,
                    percent: c.percent,
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/95 text-white p-2.5 rounded-xl text-xs font-mono">
                            <span className="text-slate-300">{label}:</span>{' '}
                            <span className="font-bold text-emerald-400">{payload[0].value}%</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Target 90%', fill: '#ef4444', fontSize: 10 }} />
                  <Bar dataKey="percent" name="Persentase Hadir (%)" radius={[6, 6, 0, 0]}>
                    {classComparison.map((entry, index) => (
                      <Cell
                        key={`cell-bar-${index}`}
                        fill={entry.percent >= 90 ? '#10b981' : entry.percent >= 75 ? '#0284c7' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Official Daily Print & PDF Archive Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={dateRecords}
        students={students}
        config={config}
        defaultTitle={`LAPORAN PRESENSI HARIAN SISWA - ${formatIndonesianDate(selectedDate).toUpperCase()}`}
        defaultPeriodLabel={`Tanggal: ${formatIndonesianDate(selectedDate)}`}
        defaultClass={selectedClass === 'ALL' ? 'Semua Rombongan Belajar' : `Kelas ${selectedClass}`}
      />
    </div>
  );
};
