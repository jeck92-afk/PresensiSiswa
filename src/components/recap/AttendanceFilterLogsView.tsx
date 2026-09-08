import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarRange,
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
  X,
  RotateCcw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  Sparkles,
  Layers,
  HeartPulse,
  Info,
  Printer,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceType, SchoolConfig } from '../../types';
import { formatIndonesianDate, getTodayDateString, DEFAULT_CLASSES } from '../../data/initialData';
import { parseYMDToDate, formatDateToYMD, exportRecapToExcel } from '../../utils/recapUtils';
import { BulkWhatsAppTargetType } from '../BulkWhatsAppModal';
import { formatDisplayPhone } from '../../utils/whatsapp';
import { PrintReportModal } from './PrintReportModal';

interface AttendanceFilterLogsViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  onUpdateRecordStatus: (recordId: string, newStatus: AttendanceStatus, note?: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onOpenManualModal: () => void;
  onOpenRecordWa: (record: AttendanceRecord) => void;
  onOpenBulkWa: (target: BulkWhatsAppTargetType) => void;
  onEditRecord: (record: AttendanceRecord) => void;
}

type SortField = 'timestamp-desc' | 'timestamp-asc' | 'name-asc' | 'name-desc' | 'class-asc' | 'status-asc';

export const AttendanceFilterLogsView: React.FC<AttendanceFilterLogsViewProps> = ({
  students,
  records,
  config,
  onUpdateRecordStatus,
  onDeleteRecord,
  onOpenManualModal,
  onOpenRecordWa,
  onOpenBulkWa,
  onEditRecord,
}) => {
  const todayStr = getTodayDateString();

  // 1. Filter States
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL'); // 'ALL' | 'MASUK' | 'PULANG'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date Range state
  // Default to 7 days ago to today for optimal initial overview
  const defaultStartDate = useMemo(() => {
    const d = parseYMDToDate(todayStr);
    d.setDate(d.getDate() - 6);
    return formatDateToYMD(d);
  }, [todayStr]);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [activeDatePreset, setActiveDatePreset] = useState<'today' | 'last7' | 'last30' | 'thisMonth' | 'all' | 'custom'>('last7');

  // Sorting & Pagination States (Large Dataset Optimization)
  const [sortField, setSortField] = useState<SortField>('timestamp-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Student class list
  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  // Handle Preset Date Ranges
  const handleApplyDatePreset = (preset: 'today' | 'last7' | 'last30' | 'thisMonth' | 'all') => {
    setActiveDatePreset(preset);
    setCurrentPage(1);

    const now = parseYMDToDate(todayStr);

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'last7') {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      setStartDate(formatDateToYMD(past));
      setEndDate(todayStr);
    } else if (preset === 'last30') {
      const past = new Date(now);
      past.setDate(now.getDate() - 29);
      setStartDate(formatDateToYMD(past));
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const [y, m] = todayStr.split('-').map(Number);
      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedClass('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setSearchQuery('');
    handleApplyDatePreset('last7');
    setSortField('timestamp-desc');
    setCurrentPage(1);
  };

  const isFiltered = useMemo(() => {
    return (
      selectedClass !== 'ALL' ||
      selectedStatus !== 'ALL' ||
      selectedType !== 'ALL' ||
      searchQuery.trim() !== '' ||
      activeDatePreset !== 'last7'
    );
  }, [selectedClass, selectedStatus, selectedType, searchQuery, activeDatePreset]);

  // 2. Filter records according to all criteria
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Date range filter
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      // Class filter
      if (selectedClass !== 'ALL' && r.studentClass !== selectedClass) return false;

      // Status filter (HADIR, TERLAMBAT, ALPA, IZIN, SAKIT)
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'ALPA') {
          if (r.status !== 'ALPA') return false;
        } else if (r.status !== selectedStatus) {
          return false;
        }
      }

      // Type filter (MASUK, PULANG)
      if (selectedType !== 'ALL' && r.type !== selectedType) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesNis = r.studentNis.includes(q);
        const matchesNisn = r.studentNisn.includes(q);
        const matchesClass = r.studentClass.toLowerCase().includes(q);
        const matchesNote = (r.note || '').toLowerCase().includes(q);
        if (!matchesName && !matchesNis && !matchesNisn && !matchesClass && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [records, startDate, endDate, selectedClass, selectedStatus, selectedType, searchQuery]);

  // 3. Sort records
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];

    switch (sortField) {
      case 'timestamp-desc':
        return list.sort((a, b) => b.timestamp - a.timestamp);
      case 'timestamp-asc':
        return list.sort((a, b) => a.timestamp - b.timestamp);
      case 'name-asc':
        return list.sort((a, b) => a.studentName.localeCompare(b.studentName));
      case 'name-desc':
        return list.sort((a, b) => b.studentName.localeCompare(a.studentName));
      case 'class-asc':
        return list.sort((a, b) => a.studentClass.localeCompare(b.studentClass) || b.timestamp - a.timestamp);
      case 'status-asc':
        return list.sort((a, b) => a.status.localeCompare(b.status) || b.timestamp - a.timestamp);
      default:
        return list;
    }
  }, [filteredRecords, sortField]);

  // 4. Statistics of filtered dataset
  const stats = useMemo(() => {
    const total = sortedRecords.length;
    const hadir = sortedRecords.filter((r) => r.status === 'HADIR').length;
    const terlambat = sortedRecords.filter((r) => r.status === 'TERLAMBAT').length;
    const alpa = sortedRecords.filter((r) => r.status === 'ALPA').length;
    const izin = sortedRecords.filter((r) => r.status === 'IZIN').length;
    const sakit = sortedRecords.filter((r) => r.status === 'SAKIT').length;
    const izinSakit = izin + sakit;

    const uniqueStudents = new Set(sortedRecords.map((r) => r.studentId)).size;

    return {
      total,
      hadir,
      terlambat,
      alpa,
      izin,
      sakit,
      izinSakit,
      uniqueStudents,
      hadirRate: total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0,
    };
  }, [sortedRecords]);

  // 5. Pagination Calculation for Large Datasets
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    if (itemsPerPage >= 9999) return sortedRecords;
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedRecords, safeCurrentPage, itemsPerPage]);

  const startRecordIdx = sortedRecords.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endRecordIdx = Math.min(safeCurrentPage * itemsPerPage, sortedRecords.length);

  // 6. Export Filtered Data to Excel
  const handleExportExcel = () => {
    const dateRangeLabel =
      startDate && endDate
        ? `${startDate} s.d. ${endDate}`
        : startDate
        ? `Sejak ${startDate}`
        : endDate
        ? `Sampai ${endDate}`
        : 'Semua Periode';

    const title = `LOG PRESENSI SISWA - KELAS: ${selectedClass} | STATUS: ${selectedStatus} | PERIODE: ${dateRangeLabel}`;
    const filename = `Log_Presensi_${config.schoolName.replace(/\s+/g, '_')}_${selectedClass}_${selectedStatus}_${startDate || 'awal'}_sd_${endDate || 'akhir'}`;

    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'NIS',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'L/P',
      'Tipe Presensi',
      'Status Kehadiran',
      'Keterangan',
    ];

    const rows = sortedRecords.map((r, idx) => [
      idx + 1,
      r.date,
      r.time,
      `'${r.studentNis}`,
      `'${r.studentNisn}`,
      r.studentName,
      r.studentClass,
      r.gender,
      r.type,
      r.status,
      r.note || '',
    ]);

    exportRecapToExcel(title, filename, headers, rows, config);
  };

  // Export Filtered Data to CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'NIS',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'L/P',
      'Tipe Presensi',
      'Status Kehadiran',
      'Keterangan',
    ];

    const rows = sortedRecords.map((r, idx) => [
      idx + 1,
      r.date,
      r.time,
      `'${r.studentNis}`,
      `'${r.studentNisn}`,
      `"${r.studentName.replace(/"/g, '""')}"`,
      r.studentClass,
      r.gender,
      r.type,
      r.status,
      `"${(r.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Log_Presensi_${config.schoolName.replace(/\s+/g, '_')}_${startDate || 'awal'}_sd_${endDate || 'akhir'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 1. Main Filter Panel Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Filter className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Penyaringan &amp; Log Riwayat Presensi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filter presensi berdasarkan kelas, status kehadiran (Hadir, Terlambat, Alpa), dan rentang tanggal untuk dataset besar
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools: Manual Entry, Bulk WA & Exports */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              disabled={sortedRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cetak & ekspor data tabel presensi ke dokumen PDF resmi untuk arsip fisik sekolah"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan ({sortedRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenManualModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Presensi Manual</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={sortedRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ekspor data hasil filter ke file Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel ({sortedRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={sortedRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ekspor CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Criteria Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter 1: Student Class */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Kelas Siswa</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Status (Hadir, Terlambat, Alpa, Izin, Sakit) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status Kehadiran</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">Hadir (Tepat Waktu)</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="ALPA">Alpa / Alpha (Belum Ada Keterangan)</option>
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
            </select>
          </div>

          {/* Filter 3: Tipe Presensi (Masuk / Pulang) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tipe Presensi</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Tipe (Masuk &amp; Pulang)</option>
              <option value="MASUK">Presensi Masuk Saja</option>
              <option value="PULANG">Presensi Pulang Saja</option>
            </select>
          </div>

          {/* Filter 4: Sorting Option */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
              <span>Urutan Tampilan</span>
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="timestamp-desc">Waktu Terbaru (Terbaru ke Terlama)</option>
              <option value="timestamp-asc">Waktu Terlama (Terlama ke Terbaru)</option>
              <option value="name-asc">Nama Siswa (A - Z)</option>
              <option value="name-desc">Nama Siswa (Z - A)</option>
              <option value="class-asc">Kelas Siswa</option>
              <option value="status-asc">Status Kehadiran</option>
            </select>
          </div>
        </div>

        {/* 3. Date Range Filter Section with Presets & Date Inputs */}
        <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pilihan Cepat Rentang Tanggal:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyDatePreset('today')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDatePreset === 'today'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('last7')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDatePreset === 'last7'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('last30')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDatePreset === 'last30'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('thisMonth')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDatePreset === 'thisMonth'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDatePreset === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua Waktu
              </button>
            </div>
          </div>

          {/* Date Picker Range Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveDatePreset('custom');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-0 font-bold text-slate-900 text-xs focus:ring-0 p-0 cursor-pointer"
                />
              </div>
            </div>

            <span className="text-slate-400 font-bold text-xs">s/d</span>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveDatePreset('custom');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-0 font-bold text-slate-900 text-xs focus:ring-0 p-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Search Bar & Reset Filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama siswa, NIS, NISN, atau keterangan..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Pill Bar & Reset */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors border border-rose-200/80 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}

            <div className="text-xs text-slate-500 font-medium">
              Ditemukan <strong className="font-mono text-slate-900">{sortedRecords.length}</strong> data presensi
            </div>
          </div>
        </div>
      </div>

      {/* 2. Statistical Metrics of Current Filtered Dataset */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setSelectedStatus('ALL');
            setCurrentPage(1);
          }}
          className={`bg-white p-3 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'ALL'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Semua Data</span>
            <Layers className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {stats.uniqueStudents} siswa unik
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedStatus('HADIR');
            setCurrentPage(1);
          }}
          className={`bg-emerald-50/70 p-3 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'HADIR'
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-emerald-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <span>Hadir Tepat Waktu</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">
            {stats.hadir}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            {stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0}% dari total
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedStatus('TERLAMBAT');
            setCurrentPage(1);
          }}
          className={`bg-amber-50/70 p-3 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'TERLAMBAT'
              ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-amber-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span>Terlambat</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">
            {stats.terlambat}
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
            {stats.total > 0 ? Math.round((stats.terlambat / stats.total) * 100) : 0}% dari total
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedStatus('ALPA');
            setCurrentPage(1);
          }}
          className={`bg-rose-50/70 p-3 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'ALPA'
              ? 'border-rose-600 ring-2 ring-rose-500/20 shadow-xs'
              : 'border-rose-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-800">
            <span>Alpa / Alpha</span>
            <UserX className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-950 mt-0.5">
            {stats.alpa}
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
            {stats.total > 0 ? Math.round((stats.alpa / stats.total) * 100) : 0}% dari total
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === 'IZIN' ? 'SAKIT' : 'IZIN');
            setCurrentPage(1);
          }}
          className={`bg-blue-50/70 p-3 rounded-2xl border transition-all cursor-pointer ${
            ['IZIN', 'SAKIT'].includes(selectedStatus)
              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-blue-200/80 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
            <span>Izin &amp; Sakit</span>
            <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">
            {stats.izinSakit}
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
            {stats.izin} Izin • {stats.sakit} Sakit
          </div>
        </div>
      </div>

      {/* 3. Main Data Table Container (Large Dataset Friendly) */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden">
        {/* Table Header Controls: Items per page & Showing summary */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-bold">Baris per halaman:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={9999}>Semua ({sortedRecords.length})</option>
            </select>
          </div>

          <div className="text-slate-600 font-medium">
            Menampilkan <strong className="font-mono text-slate-900">{startRecordIdx}</strong> –{' '}
            <strong className="font-mono text-slate-900">{endRecordIdx}</strong> dari{' '}
            <strong className="font-mono text-slate-900">{sortedRecords.length}</strong> total rekor
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                <th className="py-3 px-3">Identitas Siswa</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3 text-center">Tipe</th>
                <th className="py-3 px-3 text-center">Status Kehadiran</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-700 text-sm">Tidak ada data yang cocok</div>
                      <p className="text-xs text-slate-400">
                        Tidak ditemukan rekor presensi yang memenuhi kriteria filter kelas, status, atau rentang tanggal yang dipilih.
                      </p>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Semua Filter</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record, index) => {
                  const rowNumber = (safeCurrentPage - 1) * itemsPerPage + index + 1;
                  const student = students.find((s) => s.id === record.studentId);

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                        {rowNumber}
                      </td>

                      {/* Tanggal & Waktu */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatIndonesianDate(record.date)}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{record.time}</span>
                          <span className="text-[10px] text-slate-400">({config.timeZone || 'WIT'})</span>
                        </div>
                      </td>

                      {/* Siswa */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {record.studentName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-0.5">
                          <span>NIS: {record.studentNis}</span>
                          <span className="text-slate-300">•</span>
                          <span>NISN: {record.studentNisn}</span>
                          <span className="text-slate-300">•</span>
                          <span className={record.gender === 'L' ? 'text-blue-600 font-bold' : 'text-pink-600 font-bold'}>
                            {record.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {record.studentClass}
                        </span>
                      </td>

                      {/* Tipe Presensi */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {record.type === 'MASUK' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                            Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/70">
                            Pulang
                          </span>
                        )}
                      </td>

                      {/* Status Kehadiran */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {record.status === 'HADIR' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Hadir</span>
                          </span>
                        )}
                        {record.status === 'TERLAMBAT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Terlambat</span>
                          </span>
                        )}
                        {record.status === 'ALPA' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-3 h-3 text-rose-600" />
                            <span>Alpa</span>
                          </span>
                        )}
                        {record.status === 'IZIN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Info className="w-3 h-3 text-blue-600" />
                            <span>Izin</span>
                          </span>
                        )}
                        {record.status === 'SAKIT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <HeartPulse className="w-3 h-3 text-sky-600" />
                            <span>Sakit</span>
                          </span>
                        )}
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-3 text-slate-600">
                        <span className="text-xs italic text-slate-500">
                          {record.note || '-'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* WhatsApp Notify Button */}
                          <button
                            type="button"
                            onClick={() => onOpenRecordWa(record)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60 transition-colors"
                            title={`Kirim notifikasi presensi ke WhatsApp orang tua (${record.studentName})`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Status Button */}
                          <button
                            type="button"
                            onClick={() => onEditRecord(record)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200/60 transition-colors"
                            title="Ubah status kehadiran siswa ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Record Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus rekor presensi ${record.studentName} pada ${record.date}?`)) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200/60 transition-colors"
                            title="Hapus rekor presensi ini"
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

        {/* Table Footer with Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Halaman <strong className="font-mono text-slate-900">{safeCurrentPage}</strong> dari{' '}
              <strong className="font-mono text-slate-900">{totalPages}</strong>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              {/* Page Number Pills */}
              <div className="hidden sm:flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (safeCurrentPage <= 3) {
                    pageNum = i + 1;
                  } else if (safeCurrentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = safeCurrentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                        safeCurrentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Official Print & PDF Archive Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={sortedRecords}
        students={students}
        config={config}
        defaultTitle={`LAPORAN PRESENSI SISWA - ${selectedClass === 'ALL' ? 'SEMUA KELAS' : `KELAS ${selectedClass}`}`}
        defaultPeriodLabel={
          startDate && endDate
            ? `Periode: ${startDate} s.d. ${endDate}`
            : startDate
            ? `Periode: Sejak ${startDate}`
            : endDate
            ? `Periode: Sampai ${endDate}`
            : `Periode: Semua Tanggal (${formatIndonesianDate(todayStr)})`
        }
        defaultClass={selectedClass === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClass}`}
      />
    </div>
  );
};
