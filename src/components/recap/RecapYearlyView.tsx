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
import { DEFAULT_CLASSES } from '../../data/initialData';
import {
  INDONESIAN_MONTHS,
  exportRecapToExcel,
  getMonthDates,
} from '../../utils/recapUtils';

interface RecapYearlyViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
}

export const RecapYearlyView: React.FC<RecapYearlyViewProps> = ({
  students,
  records,
  config,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [semesterFilter, setSemesterFilter] = useState<'ALL' | 'GANJIL' | 'GENAP'>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  // Selected months based on semester filter
  // Ganjil: Juli - Desember (Month index 7 to 12)
  // Genap: Januari - Juni (Month index 1 to 6)
  const activeMonthIndexes = useMemo(() => {
    if (semesterFilter === 'GANJIL') {
      return [7, 8, 9, 10, 11, 12];
    }
    if (semesterFilter === 'GENAP') {
      return [1, 2, 3, 4, 5, 6];
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [semesterFilter]);

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

  // Filter records belonging to the selected year
  const yearRecords = useMemo(() => {
    return records.filter((r) => {
      const recYear = parseInt(r.date.split('-')[0], 10);
      return recYear === selectedYear;
    });
  }, [records, selectedYear]);

  // For each month, compute school days count and monthly stats
  const monthlyStats = useMemo(() => {
    return INDONESIAN_MONTHS.map((mName, idx) => {
      const monthNum = idx + 1;
      const monthPrefix = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
      const mDates = getMonthDates(selectedYear, monthNum).filter((d) => !d.isSunday);

      const mRecords = yearRecords.filter(
        (r) =>
          r.date.startsWith(monthPrefix) &&
          (selectedClass === 'ALL' || r.studentClass === selectedClass)
      );

      const hadirCount = mRecords.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambatCount = mRecords.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izinCount = mRecords.filter((r) => r.status === 'IZIN').length;
      const sakitCount = mRecords.filter((r) => r.status === 'SAKIT').length;
      const totalMasuk = hadirCount + terlambatCount;

      const totalSlots = filteredStudents.length * Math.max(1, mDates.length);
      const percent = totalSlots > 0 ? Math.round((totalMasuk / totalSlots) * 100) : 0;

      return {
        monthNum,
        name: mName,
        shortName: mName.substring(0, 3),
        effectiveDays: mDates.length,
        hadir: hadirCount,
        terlambat: terlambatCount,
        izin: izinCount,
        sakit: sakitCount,
        totalMasuk,
        percent,
      };
    });
  }, [selectedYear, yearRecords, selectedClass, filteredStudents]);

  // Compute student yearly summary
  const studentYearlyRecap = useMemo(() => {
    return filteredStudents.map((student) => {
      const stRecords = yearRecords.filter((r) => r.studentId === student.id);

      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlpa = 0;

      // Stats per month
      const monthlyData: Record<number, { masuk: number; percent: number }> = {};

      activeMonthIndexes.forEach((mIndex) => {
        const monthPrefix = `${selectedYear}-${String(mIndex).padStart(2, '0')}`;
        const stMonthRecs = stRecords.filter((r) => r.date.startsWith(monthPrefix));

        const mDates = getMonthDates(selectedYear, mIndex).filter((d) => !d.isSunday);
        const mEffective = mDates.length;

        const h = stMonthRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
        const t = stMonthRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
        const i = stMonthRecs.filter((r) => r.status === 'IZIN').length;
        const s = stMonthRecs.filter((r) => r.status === 'SAKIT').length;

        totalHadir += h;
        totalTerlambat += t;
        totalIzin += i;
        totalSakit += s;

        const mMasuk = h + t;
        const mPercent = mEffective > 0 ? Math.round((mMasuk / mEffective) * 100) : 0;
        monthlyData[mIndex] = { masuk: mMasuk, percent: mPercent };
      });

      // Total effective days across active months
      let totalEffectiveDays = 0;
      activeMonthIndexes.forEach((mIdx) => {
        const mDates = getMonthDates(selectedYear, mIdx).filter((d) => !d.isSunday);
        totalEffectiveDays += mDates.length;
      });

      const totalMasuk = totalHadir + totalTerlambat;
      totalAlpa = Math.max(0, totalEffectiveDays - totalMasuk - totalIzin - totalSakit);
      const yearlyPercent =
        totalEffectiveDays > 0 ? Math.round((totalMasuk / totalEffectiveDays) * 100) : 0;

      return {
        student,
        monthlyData,
        totalHadir,
        totalTerlambat,
        totalIzin,
        totalSakit,
        totalAlpa,
        totalMasuk,
        totalEffectiveDays,
        yearlyPercent,
      };
    });
  }, [filteredStudents, yearRecords, activeMonthIndexes, selectedYear]);

  // Overall Yearly Metrics
  const overallMetrics = useMemo(() => {
    let totalMasuk = 0;
    let totalSlots = 0;
    let perfectStudentsCount = 0;
    let totalTerlambat = 0;

    studentYearlyRecap.forEach((sr) => {
      totalMasuk += sr.totalMasuk;
      totalSlots += sr.totalEffectiveDays;
      totalTerlambat += sr.totalTerlambat;
      if (sr.yearlyPercent >= 98 && sr.totalAlpa === 0) {
        perfectStudentsCount++;
      }
    });

    const avgYearlyPercent = totalSlots > 0 ? Math.round((totalMasuk / totalSlots) * 100) : 0;

    return {
      totalStudents: filteredStudents.length,
      avgYearlyPercent,
      perfectStudentsCount,
      totalTerlambat,
      recordedYear: selectedYear,
    };
  }, [studentYearlyRecap, filteredStudents, selectedYear]);

  // Export to Excel
  const handleExportExcel = () => {
    const monthHeaders = activeMonthIndexes.map((mIdx) => INDONESIAN_MONTHS[mIdx - 1]);
    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'L/P',
      ...monthHeaders,
      'Hadir (H)',
      'Terlambat (T)',
      'Sakit (S)',
      'Izin (I)',
      'Alpa (A)',
      'Total Masuk',
      '% Hadir Tahunan',
    ];

    const rows = studentYearlyRecap.map((sr, idx) => {
      const monthCells = activeMonthIndexes.map((mIdx) => {
        const md = sr.monthlyData[mIdx];
        return `${md ? md.percent : 0}%`;
      });

      return [
        idx + 1,
        sr.student.nis,
        sr.student.name,
        sr.student.className,
        sr.student.gender,
        ...monthCells,
        sr.totalHadir,
        sr.totalTerlambat,
        sr.totalSakit,
        sr.totalIzin,
        sr.totalAlpa,
        sr.totalMasuk,
        `${sr.yearlyPercent}%`,
      ];
    });

    exportRecapToExcel(
      `BUKU INDUK REKAPITULASI KEHADIRAN TAHUNAN (${selectedYear})`,
      `Rekap_Tahunan_${selectedYear}_${config.schoolName.replace(/\s+/g, '_')}`,
      headers,
      rows,
      config
    );
  };

  // Export to CSV
  const handleExportCsv = () => {
    const monthHeaders = activeMonthIndexes.map((mIdx) => `"${INDONESIAN_MONTHS[mIdx - 1]}"`);
    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'L/P',
      ...monthHeaders,
      'H',
      'T',
      'S',
      'I',
      'A',
      'Total Masuk',
      '% Kehadiran',
    ];

    const rows = studentYearlyRecap.map((sr, idx) => {
      const monthCells = activeMonthIndexes.map((mIdx) => {
        const md = sr.monthlyData[mIdx];
        return `"${md ? md.percent : 0}%"`;
      });

      return [
        idx + 1,
        `'${sr.student.nis}`,
        `"${sr.student.name}"`,
        sr.student.className,
        sr.student.gender,
        ...monthCells,
        sr.totalHadir,
        sr.totalTerlambat,
        sr.totalSakit,
        sr.totalIzin,
        sr.totalAlpa,
        sr.totalMasuk,
        `"${sr.yearlyPercent}%"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rekap_Tahunan_${selectedYear}_${config.schoolName.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Ribbon */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Year & Semester Selector */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Tahun Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 font-mono font-bold text-sm sm:text-base text-slate-900">
                Tahun {selectedYear}
              </div>

              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Tahun Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Semester Filters */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSemesterFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  semesterFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 Bulan
              </button>
              <button
                type="button"
                onClick={() => setSemesterFilter('GANJIL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  semesterFilter === 'GANJIL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sem. Ganjil (Jul-Des)
              </button>
              <button
                type="button"
                onClick={() => setSemesterFilter('GENAP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  semesterFilter === 'GENAP'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sem. Genap (Jan-Jun)
              </button>
            </div>
          </div>

          {/* Right: Export & Print */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              title="Unduh format Excel Tahunan (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Tahunan</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              title="Unduh CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Cetak Laporan Tahunan"
            >
              <Printer className="w-4 h-4" />
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

      {/* 2. Key Metrics & 12-Month Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Rata-rata Tahunan</span>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {overallMetrics.avgYearlyPercent}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tingkat kehadiran sekolah</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Siswa Teladan (100%)</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {overallMetrics.perfectStudentsCount} Siswa
            </div>
            <div className="text-[10px] text-amber-600/80 font-semibold mt-0.5">Kehadiran sempurna</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Total Keterlambatan</span>
            <div className="text-xl font-bold text-amber-800 mt-1">
              {overallMetrics.totalTerlambat}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Akumulasi satu tahun</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Tahun Kalender</span>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {selectedYear}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">T.A. {config.academicYear}</div>
          </div>
        </div>

        {/* 12-Month Attendance Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Diagram Batang Kehadiran Bulanan (Januari – Desember {selectedYear})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rincian kehadiran tepat waktu (H), terlambat (T), izin (I), dan sakit (S) per bulan
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
              {selectedClass === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClass}`}
            </span>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyStats.map((ms) => ({
                  name: ms.name.substring(0, 3),
                  fullName: ms.name,
                  hadir: ms.hadir,
                  terlambat: ms.terlambat,
                  izin: ms.izin,
                  sakit: ms.sakit,
                  totalMasuk: ms.totalMasuk,
                  percent: ms.percent,
                }))}
                margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl text-xs space-y-1 z-50 min-w-[150px]">
                          <div className="font-bold border-b border-slate-700 pb-1 text-slate-200">{label}</div>
                          {payload.map((entry: any, index: number) => (
                            <div key={`yt-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
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
                <Bar dataKey="hadir" name="Tepat Waktu" fill="#10b981" stackId="y" radius={[0, 0, 0, 0]} />
                <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" stackId="y" radius={[0, 0, 0, 0]} />
                <Bar dataKey="izin" name="Izin" fill="#3b82f6" stackId="y" radius={[0, 0, 0, 0]} />
                <Bar dataKey="sakit" name="Sakit" fill="#8b5cf6" stackId="y" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Student Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Rekapitulasi Kehadiran Tahunan Siswa ({selectedYear})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tingkat kehadiran per bulan dan akumulasi total sepanjang tahun kalender / ajaran
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600">
            Total Siswa: <span className="font-bold text-slate-900">{studentYearlyRecap.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">NIS</th>
                <th className="py-2.5 px-3 min-w-[140px]">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-2 text-center">L/P</th>

                {/* Active Month Columns */}
                {activeMonthIndexes.map((mIdx) => {
                  const mName = INDONESIAN_MONTHS[mIdx - 1].substring(0, 3);
                  return (
                    <th key={mIdx} className="py-2.5 px-2 text-center min-w-[45px]">
                      {mName}
                    </th>
                  );
                })}

                <th className="py-2.5 px-2 text-center text-emerald-700 bg-emerald-50/70">H</th>
                <th className="py-2.5 px-2 text-center text-amber-700 bg-amber-50/70">T</th>
                <th className="py-2.5 px-2 text-center text-purple-700 bg-purple-50/70">S</th>
                <th className="py-2.5 px-2 text-center text-blue-700 bg-blue-50/70">I</th>
                <th className="py-2.5 px-2 text-center text-red-700 bg-red-50/70">A</th>
                <th className="py-2.5 px-3 text-center font-extrabold bg-slate-100">Total Masuk</th>
                <th className="py-2.5 px-3 text-right font-extrabold bg-slate-100">% Tahunan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentYearlyRecap.length === 0 ? (
                <tr>
                  <td colSpan={activeMonthIndexes.length + 12} className="py-12 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                studentYearlyRecap.map((sr, idx) => {
                  return (
                    <tr key={sr.student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {sr.student.nis}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-xs">
                        {sr.student.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{sr.student.className}</td>
                      <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-[11px]">
                        {sr.student.gender}
                      </td>

                      {/* Month Cells */}
                      {activeMonthIndexes.map((mIdx) => {
                        const mData = sr.monthlyData[mIdx];
                        const pct = mData ? mData.percent : 0;
                        return (
                          <td key={mIdx} className="py-2.5 px-2 text-center font-mono">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                pct >= 90
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : pct >= 75
                                  ? 'bg-blue-50 text-blue-800'
                                  : pct > 0
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'text-slate-300'
                              }`}
                            >
                              {pct}%
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">
                        {sr.totalHadir}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/20">
                        {sr.totalTerlambat}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-purple-700 bg-purple-50/20">
                        {sr.totalSakit}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-blue-700 bg-blue-50/20">
                        {sr.totalIzin}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-red-700 bg-red-50/20">
                        {sr.totalAlpa}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-slate-900 bg-slate-50">
                        {sr.totalMasuk} hr
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            sr.yearlyPercent >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : sr.yearlyPercent >= 75
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sr.yearlyPercent}%
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
    </div>
  );
};
