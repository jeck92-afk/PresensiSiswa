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
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  FileText,
  BarChart3,
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
import { Student, AttendanceRecord, AttendanceStatus, SchoolConfig } from '../../types';
import { DEFAULT_CLASSES, formatIndonesianDate } from '../../data/initialData';
import {
  getMonthDates,
  INDONESIAN_MONTHS,
  computeStudentsRecap,
  exportRecapToExcel,
} from '../../utils/recapUtils';
import {
  generateMonthlyAttendanceCsv,
  downloadCsvFile,
} from '../../utils/csvExportUtils';
import { PrintReportModal } from './PrintReportModal';
import { ExportCsvMonthlyModal } from './ExportCsvMonthlyModal';

interface RecapMonthlyViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
}

export const RecapMonthlyView: React.FC<RecapMonthlyViewProps> = ({
  students,
  records,
  config,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1 - 12
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showChart, setShowChart] = useState<boolean>(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);

  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleThisMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // Month days
  const monthDays = useMemo(() => {
    return getMonthDates(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // School effective dates (exclude Sundays)
  const effectiveSchoolDates = useMemo(() => {
    return monthDays.filter((d) => !d.isSunday).map((d) => d.date);
  }, [monthDays]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => selectedClass === 'ALL' || s.className === selectedClass)
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
  }, [students, selectedClass, searchQuery]);

  // Compute student monthly summary
  const studentsRecap = useMemo(() => {
    return computeStudentsRecap(
      filteredStudents,
      records,
      effectiveSchoolDates,
      effectiveSchoolDates.length
    );
  }, [filteredStudents, records, effectiveSchoolDates]);

  // Records in current month for PDF export
  const monthRecords = useMemo(() => {
    const datesInMonth = monthDays.map((d) => d.date);
    return records.filter(
      (r) => datesInMonth.includes(r.date) && (selectedClass === 'ALL' || r.studentClass === selectedClass)
    );
  }, [records, monthDays, selectedClass]);

  // Monthly metrics
  const monthlyMetrics = useMemo(() => {
    const totalEffective = effectiveSchoolDates.length;
    const totalPossibleAttendance = filteredStudents.length * totalEffective;
    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlpa = 0;
    let perfectAttendanceCount = 0;

    studentsRecap.forEach((sr) => {
      totalHadir += sr.hadir;
      totalTerlambat += sr.terlambat;
      totalIzin += sr.izin;
      totalSakit += sr.sakit;
      totalAlpa += sr.alpa;
      if (sr.attendancePercent === 100 && sr.alpa === 0) {
        perfectAttendanceCount++;
      }
    });

    const totalMasuk = totalHadir + totalTerlambat;
    const avgAttendancePercent =
      totalPossibleAttendance > 0
        ? Math.round((totalMasuk / totalPossibleAttendance) * 100)
        : 0;

    return {
      totalStudents: filteredStudents.length,
      totalEffectiveDays: totalEffective,
      avgAttendancePercent,
      perfectAttendanceCount,
      totalHadir,
      totalTerlambat,
      totalIzinSakit: totalIzin + totalSakit,
      totalAlpa,
    };
  }, [filteredStudents, effectiveSchoolDates, studentsRecap]);

  // Monthly daily stats for BarChart
  const monthlyDayStats = useMemo(() => {
    return effectiveSchoolDates.map((dateStr) => {
      const dayNum = parseInt(dateStr.split('-')[2], 10);
      const dRecs = records.filter(
        (r) => r.date === dateStr && (selectedClass === 'ALL' || r.studentClass === selectedClass)
      );

      const totalSt = filteredStudents.length;
      const hadir = dRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = dRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izin = dRecs.filter((r) => r.status === 'IZIN').length;
      const sakit = dRecs.filter((r) => r.status === 'SAKIT').length;
      const totalMasuk = hadir + terlambat;
      const percent = totalSt > 0 ? Math.round((totalMasuk / totalSt) * 100) : 0;
      const alpa = Math.max(0, totalSt - totalMasuk - izin - sakit);

      return {
        name: `Tgl ${dayNum}`,
        day: dayNum,
        date: dateStr,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa,
        totalMasuk,
        percent,
      };
    });
  }, [effectiveSchoolDates, records, filteredStudents, selectedClass]);

  // Export to Excel
  const handleExportExcel = () => {
    const dayHeaders = monthDays.map((d) => `Tgl ${d.dayNum}`);
    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'L/P',
      ...dayHeaders,
      'Hadir (H)',
      'Terlambat (T)',
      'Sakit (S)',
      'Izin (I)',
      'Alpa (A)',
      'Total Masuk',
      '% Kehadiran',
    ];

    const rows = studentsRecap.map((sr, idx) => {
      const dayCells = monthDays.map((d) => {
        if (d.isSunday) return 'Libur';
        const st = sr.dailyStatusMap[d.date];
        if (!st) return 'A';
        if (st === 'HADIR') return 'H';
        if (st === 'TERLAMBAT') return 'T';
        if (st === 'IZIN') return 'I';
        if (st === 'SAKIT') return 'S';
        return 'A';
      });

      return [
        idx + 1,
        sr.student.nis,
        sr.student.name,
        sr.student.className,
        sr.student.gender,
        ...dayCells,
        sr.hadir,
        sr.terlambat,
        sr.sakit,
        sr.izin,
        sr.alpa,
        sr.totalMasuk,
        `${sr.attendancePercent}%`,
      ];
    });

    exportRecapToExcel(
      `REKAPITULASI KEHADIRAN BULANAN (${INDONESIAN_MONTHS[selectedMonth - 1]} ${selectedYear})`,
      `Rekap_Bulanan_${INDONESIAN_MONTHS[selectedMonth - 1]}_${selectedYear}`,
      headers,
      rows,
      config
    );
  };

  // Quick Export to CSV using standard Dapodik Matrix layout
  const handleQuickExportCsv = () => {
    const res = generateMonthlyAttendanceCsv(students, records, config, {
      month: selectedMonth,
      year: selectedYear,
      format: 'matrix',
      delimiter: ';',
      includeHeaderMetadata: true,
      includeSummaryFooter: true,
      excelSafeNumbers: true,
      selectedClass,
    });
    downloadCsvFile(res.csvContent, res.fileName);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Ribbon */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month & Year Navigator */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer p-0 pr-1"
                >
                  {INDONESIAN_MONTHS.map((mName, idx) => (
                    <option key={mName} value={idx + 1}>
                      {mName}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer p-0 font-mono"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleThisMonth}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Bulan Ini
            </button>

            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              {effectiveSchoolDates.length} Hari Efektif Sekolah
            </span>
          </div>

          {/* Right: Export & Print Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary CSV Export Button for Education Agency (Dinas) */}
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer group"
              title="Buka Menu Ekspor Data Presensi Bulanan ke Format CSV (Laporan Dinas & Pengawas)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-100 group-hover:scale-110 transition-transform" />
              <span>Ekspor CSV Dinas</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white/20 rounded text-emerald-100 hidden sm:inline">
                CSV
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
              title="Unduh Buku Absensi Bulanan format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Bulanan</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Cetak & Ekspor Laporan Presensi Bulanan ke Dokumen PDF"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
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

      {/* 2. Monthly Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Hari Efektif</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {monthlyMetrics.totalEffectiveDays} Hari
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Senin s.d. Sabtu</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Rata-rata Hadir</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {monthlyMetrics.avgAttendancePercent}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tingkat kehadiran kelas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Hadir 100% (Nol Alpa)</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {monthlyMetrics.perfectAttendanceCount} Siswa
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kehadiran penuh sebulan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total Alpa (A)</span>
            <UserX className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {monthlyMetrics.totalAlpa}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tanpa keterangan</div>
        </div>
      </div>

      {/* 2.5 Monthly Bar Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Diagram Batang Kehadiran Harian Bulan {INDONESIAN_MONTHS[selectedMonth - 1]} {selectedYear}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Grafik fluktuasi jumlah kehadiran siswa pada setiap hari efektif sepanjang bulan ini
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChart(!showChart)}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {showChart ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
            </button>
          </div>
        </div>

        {showChart && (
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDayStats} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl text-xs space-y-1 z-50 min-w-[150px]">
                          <div className="font-bold border-b border-slate-700 pb-1 text-slate-200">{label}</div>
                          {payload.map((entry: any, index: number) => (
                            <div key={`mt-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                              <span style={{ color: entry.color || entry.fill }}>{entry.name}:</span>
                              <span className="font-mono font-bold text-white">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                <Bar dataKey="hadir" name="Tepat Waktu" fill="#10b981" stackId="m" radius={[0, 0, 0, 0]} />
                <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" stackId="m" radius={[0, 0, 0, 0]} />
                <Bar dataKey="izin" name="Izin" fill="#3b82f6" stackId="m" radius={[0, 0, 0, 0]} />
                <Bar dataKey="sakit" name="Sakit" fill="#8b5cf6" stackId="m" radius={[0, 0, 0, 0]} />
                <Bar dataKey="alpa" name="Alpa" fill="#ef4444" stackId="m" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Monthly Attendance Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Buku Absensi Bulanan Siswa ({INDONESIAN_MONTHS[selectedMonth - 1]} {selectedYear})
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-[11px] mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[9px] flex items-center justify-center">H</span>
                <span className="text-slate-600 font-medium">Hadir</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-100 text-amber-800 font-bold font-mono text-[9px] flex items-center justify-center">T</span>
                <span className="text-slate-600 font-medium">Terlambat</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-purple-100 text-purple-800 font-bold font-mono text-[9px] flex items-center justify-center">S</span>
                <span className="text-slate-600 font-medium">Sakit</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-100 text-blue-800 font-bold font-mono text-[9px] flex items-center justify-center">I</span>
                <span className="text-slate-600 font-medium">Izin</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-100 text-red-800 font-bold font-mono text-[9px] flex items-center justify-center">A</span>
                <span className="text-slate-600 font-medium">Alpa</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-200 text-slate-500 font-bold font-mono text-[9px] flex items-center justify-center">-</span>
                <span className="text-slate-600 font-medium">Minggu / Libur</span>
              </span>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-600">
            Total Siswa: <span className="font-bold text-slate-900">{studentsRecap.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-2.5 px-2.5 sticky left-0 bg-slate-100/95 z-10">No</th>
                <th className="py-2.5 px-2.5 sticky left-8 bg-slate-100/95 z-10">NIS</th>
                <th className="py-2.5 px-3 sticky left-24 bg-slate-100/95 z-10 min-w-[130px]">Nama Siswa</th>
                <th className="py-2.5 px-2 text-center">L/P</th>

                {/* Day Columns 1..31 */}
                {monthDays.map((d) => {
                  return (
                    <th
                      key={d.date}
                      className={`py-2 px-1 text-center min-w-[28px] ${
                        d.isSunday
                          ? 'bg-slate-200/70 text-red-600'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-mono leading-none">{d.dayNum}</div>
                      <div className="text-[8px] text-slate-400 leading-none mt-0.5">{d.dayName}</div>
                    </th>
                  );
                })}

                {/* Accumulation Summary Columns */}
                <th className="py-2.5 px-2 text-center text-emerald-700 bg-emerald-50/70">H</th>
                <th className="py-2.5 px-2 text-center text-amber-700 bg-amber-50/70">T</th>
                <th className="py-2.5 px-2 text-center text-purple-700 bg-purple-50/70">S</th>
                <th className="py-2.5 px-2 text-center text-blue-700 bg-blue-50/70">I</th>
                <th className="py-2.5 px-2 text-center text-red-700 bg-red-50/70">A</th>
                <th className="py-2.5 px-2 text-center font-extrabold bg-slate-100">Masuk</th>
                <th className="py-2.5 px-2.5 text-right font-extrabold bg-slate-100">% Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsRecap.length === 0 ? (
                <tr>
                  <td colSpan={monthDays.length + 11} className="py-12 text-center text-slate-400">
                    Tidak ada siswa yang ditemukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                studentsRecap.map((sr, idx) => {
                  return (
                    <tr key={sr.student.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-2 px-2.5 font-mono text-slate-500 sticky left-0 bg-white/95">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 font-mono font-semibold text-slate-800 sticky left-8 bg-white/95">
                        {sr.student.nis}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[150px] sticky left-24 bg-white/95 shadow-xs">
                        {sr.student.name}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px]">
                        {sr.student.gender}
                      </td>

                      {/* Day cells 1..31 */}
                      {monthDays.map((d) => {
                        if (d.isSunday) {
                          return (
                            <td key={d.date} className="py-1 px-0.5 text-center bg-slate-100/60">
                              <span className="text-slate-400 font-mono text-[9px]">-</span>
                            </td>
                          );
                        }

                        const status = sr.dailyStatusMap[d.date];
                        if (!status) {
                          return (
                            <td key={d.date} className="py-1 px-0.5 text-center">
                              <span className="inline-block w-5 h-5 rounded bg-red-50 text-red-700 font-bold text-[9px] leading-5 font-mono">
                                A
                              </span>
                            </td>
                          );
                        }

                        let badge = 'bg-emerald-100 text-emerald-800';
                        let char = 'H';
                        if (status === 'TERLAMBAT') {
                          badge = 'bg-amber-100 text-amber-800';
                          char = 'T';
                        } else if (status === 'SAKIT') {
                          badge = 'bg-purple-100 text-purple-800';
                          char = 'S';
                        } else if (status === 'IZIN') {
                          badge = 'bg-blue-100 text-blue-800';
                          char = 'I';
                        } else if (status === 'ALPA') {
                          badge = 'bg-red-100 text-red-800';
                          char = 'A';
                        }

                        return (
                          <td key={d.date} className="py-1 px-0.5 text-center">
                            <span
                              className={`inline-block w-5 h-5 rounded ${badge} font-bold text-[9px] leading-5 font-mono`}
                              title={`${d.date}: ${status}`}
                            >
                              {char}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">
                        {sr.hadir}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-amber-700 bg-amber-50/20">
                        {sr.terlambat}
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-purple-700 bg-purple-50/20">
                        {sr.sakit}
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-blue-700 bg-blue-50/20">
                        {sr.izin}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-red-700 bg-red-50/20">
                        {sr.alpa}
                      </td>
                      <td className="py-2 px-2 text-center font-extrabold text-slate-900 bg-slate-50">
                        {sr.totalMasuk}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            sr.attendancePercent >= 90
                              ? 'text-emerald-700 bg-emerald-100'
                              : sr.attendancePercent >= 75
                              ? 'text-blue-700 bg-blue-100'
                              : 'text-red-700 bg-red-100'
                          }`}
                        >
                          {sr.attendancePercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Monthly Print & PDF Archive Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={monthRecords}
        students={students}
        config={config}
        defaultTitle={`LAPORAN REKAPITULASI PRESENSI BULANAN - ${INDONESIAN_MONTHS[selectedMonth - 1]?.toUpperCase() || ''} ${selectedYear}`}
        defaultPeriodLabel={`Bulan: ${INDONESIAN_MONTHS[selectedMonth - 1] || ''} ${selectedYear} (${effectiveSchoolDates.length} Hari Efektif)`}
        defaultClass={selectedClass === 'ALL' ? 'Semua Rombongan Belajar' : `Kelas ${selectedClass}`}
      />

      {/* Official Monthly CSV Export Modal for Education Department (Dinas) */}
      <ExportCsvMonthlyModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        students={students}
        records={records}
        config={config}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        defaultClass={selectedClass}
      />
    </div>
  );
};
