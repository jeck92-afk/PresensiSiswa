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
  BarChart3,
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
import { Student, AttendanceRecord, AttendanceStatus, SchoolConfig } from '../../types';
import { DEFAULT_CLASSES, formatIndonesianDate, getTodayDateString } from '../../data/initialData';
import {
  getWeekRange,
  parseYMDToDate,
  formatDateToYMD,
  computeStudentsRecap,
  exportRecapToExcel,
  INDONESIAN_DAYS_FULL,
} from '../../utils/recapUtils';
import { PrintReportModal } from './PrintReportModal';

interface RecapWeeklyViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
}

export const RecapWeeklyView: React.FC<RecapWeeklyViewProps> = ({
  students,
  records,
  config,
}) => {
  const [anchorDate, setAnchorDate] = useState<string>(getTodayDateString());
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  // Week range for anchorDate
  const weekInfo = useMemo(() => {
    return getWeekRange(anchorDate);
  }, [anchorDate]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const d = parseYMDToDate(weekInfo.startDate);
    d.setDate(d.getDate() - 7);
    setAnchorDate(formatDateToYMD(d));
  };

  const handleNextWeek = () => {
    const d = parseYMDToDate(weekInfo.startDate);
    d.setDate(d.getDate() + 7);
    setAnchorDate(formatDateToYMD(d));
  };

  const handleThisWeek = () => {
    setAnchorDate(getTodayDateString());
  };

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

  // Compute student recap for the 6 school days (Monday to Saturday)
  const studentsRecap = useMemo(() => {
    return computeStudentsRecap(filteredStudents, records, weekInfo.dates, 6);
  }, [filteredStudents, records, weekInfo.dates]);

  // Records in current week for PDF export
  const weekRecords = useMemo(() => {
    return records.filter(
      (r) => weekInfo.dates.includes(r.date) && (selectedClass === 'ALL' || r.studentClass === selectedClass)
    );
  }, [records, weekInfo.dates, selectedClass]);

  // Overall weekly metrics
  const weeklyMetrics = useMemo(() => {
    const totalPossibleSlots = filteredStudents.length * 6;
    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlpa = 0;

    studentsRecap.forEach((s) => {
      totalHadir += s.hadir;
      totalTerlambat += s.terlambat;
      totalIzin += s.izin;
      totalSakit += s.sakit;
      totalAlpa += s.alpa;
    });

    const totalMasuk = totalHadir + totalTerlambat;
    const avgAttendancePercent =
      totalPossibleSlots > 0 ? Math.round((totalMasuk / totalPossibleSlots) * 100) : 0;

    // Daily breakdown for each day of the week
    const dayStats = weekInfo.dates.map((dateStr, idx) => {
      const dayRecs = records.filter(
        (r) =>
          r.date === dateStr &&
          (selectedClass === 'ALL' || r.studentClass === selectedClass)
      );

      const h = dayRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const t = dayRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const i = dayRecs.filter((r) => r.status === 'IZIN').length;
      const s = dayRecs.filter((r) => r.status === 'SAKIT').length;
      const hadirCount = h + t;
      const percent =
        filteredStudents.length > 0 ? Math.round((hadirCount / filteredStudents.length) * 100) : 0;

      const [y, m, dNum] = dateStr.split('-');
      const dObj = new Date(Number(y), Number(m) - 1, Number(dNum));

      return {
        dateStr,
        dayNameFull: INDONESIAN_DAYS_FULL[dObj.getDay()],
        dayNum: dNum,
        hadir: h,
        terlambat: t,
        izin: i,
        sakit: s,
        totalMasuk: hadirCount,
        percent,
      };
    });

    // Find best day
    let bestDay = dayStats[0];
    dayStats.forEach((ds) => {
      if (ds.percent > (bestDay?.percent || 0)) {
        bestDay = ds;
      }
    });

    return {
      totalStudents: filteredStudents.length,
      avgAttendancePercent,
      totalHadir,
      totalTerlambat,
      totalIzin,
      totalSakit,
      totalAlpa,
      dayStats,
      bestDayName: bestDay?.dayNameFull || 'Senin',
      bestDayPercent: bestDay?.percent || 0,
    };
  }, [filteredStudents, studentsRecap, weekInfo.dates, records, selectedClass]);

  // Export to Excel
  const handleExportExcel = () => {
    const dayHeaders = weekInfo.dates.map((d) => {
      const [_, m, day] = d.split('-');
      return `${day}/${m}`;
    });

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'L/P',
      ...dayHeaders,
      'H',
      'T',
      'I',
      'S',
      'A',
      'Total Masuk',
      '% Kehadiran',
    ];

    const rows = studentsRecap.map((sr, idx) => {
      const dayCells = weekInfo.dates.map((d) => {
        const status = sr.dailyStatusMap[d];
        if (!status) return 'A';
        if (status === 'HADIR') return 'H';
        if (status === 'TERLAMBAT') return 'T';
        if (status === 'IZIN') return 'I';
        if (status === 'SAKIT') return 'S';
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
        sr.izin,
        sr.sakit,
        sr.alpa,
        sr.totalMasuk,
        `${sr.attendancePercent}%`,
      ];
    });

    exportRecapToExcel(
      `REKAPITULASI KEHADIRAN MINGGUAN (${weekInfo.label})`,
      `Rekap_Mingguan_${weekInfo.startDate}_sd_${weekInfo.endDate}`,
      headers,
      rows,
      config
    );
  };

  // Export to CSV
  const handleExportCsv = () => {
    const dayHeaders = weekInfo.dates.map((d) => {
      const [_, m, day] = d.split('-');
      return `"${day}/${m}"`;
    });

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'L/P',
      ...dayHeaders,
      'H',
      'T',
      'I',
      'S',
      'A',
      'Total Masuk',
      '% Kehadiran',
    ];

    const rows = studentsRecap.map((sr, idx) => {
      const dayCells = weekInfo.dates.map((d) => {
        const st = sr.dailyStatusMap[d];
        return st ? `"${st.charAt(0)}"` : '"A"';
      });

      return [
        idx + 1,
        `'${sr.student.nis}`,
        `"${sr.student.name}"`,
        sr.student.className,
        sr.student.gender,
        ...dayCells,
        sr.hadir,
        sr.terlambat,
        sr.izin,
        sr.sakit,
        sr.alpa,
        sr.totalMasuk,
        `"${sr.attendancePercent}%"`,
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
      `Rekap_Mingguan_${weekInfo.startDate}_sd_${weekInfo.endDate}.csv`
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
          {/* Left: Week Navigator */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Pekan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 text-xs sm:text-sm font-bold text-slate-900 font-mono">
                {weekInfo.label}
              </div>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Pekan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleThisWeek}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Pekan Ini
            </button>
          </div>

          {/* Right: Export & Print */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              title="Unduh format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Mingguan</span>
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
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Cetak & Ekspor Laporan Presensi Mingguan ke Dokumen PDF"
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

      {/* 2. Metrics & Daily Distribution Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric Cards Column */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Rata-rata Kehadiran</span>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {weeklyMetrics.avgAttendancePercent}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pekan ini (6 hari sekolah)</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Hari Terdisiplin</span>
            <div className="text-lg font-bold text-emerald-700 mt-1 truncate">
              {weeklyMetrics.bestDayName}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              Tingkat hadir {weeklyMetrics.bestDayPercent}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Total Tepat Waktu (H)</span>
            <div className="text-xl font-bold text-emerald-800 mt-1">{weeklyMetrics.totalHadir}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Kumulatif pekan ini</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Keterlambatan (T)</span>
            <div className="text-xl font-bold text-amber-800 mt-1">{weeklyMetrics.totalTerlambat}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total kejadian terlambat</div>
          </div>
        </div>

        {/* Weekly Daily Breakdown Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Diagram Batang Kehadiran Mingguan (Senin – Sabtu)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Komposisi siswa hadir tepat waktu (H), terlambat (T), izin (I), sakit (S), dan alpa (A)
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              {filteredStudents.length} Siswa
            </span>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyMetrics.dayStats.map((ds) => {
                  const maxStudent = Math.max(1, filteredStudents.length);
                  const alpaCount = Math.max(0, maxStudent - ds.hadir - ds.terlambat - ds.izin - ds.sakit);
                  return {
                    name: `${ds.dayNameFull.substring(0, 3)} (${ds.dayNum})`,
                    hadir: ds.hadir,
                    terlambat: ds.terlambat,
                    izin: ds.izin,
                    sakit: ds.sakit,
                    alpa: alpaCount,
                    totalMasuk: ds.totalMasuk,
                    percent: ds.percent,
                  };
                })}
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
                            <div key={`wt-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
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
                <Bar dataKey="hadir" name="Tepat Waktu" fill="#10b981" stackId="w" radius={[0, 0, 0, 0]} />
                <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" stackId="w" radius={[0, 0, 0, 0]} />
                <Bar dataKey="izin" name="Izin" fill="#3b82f6" stackId="w" radius={[0, 0, 0, 0]} />
                <Bar dataKey="sakit" name="Sakit" fill="#8b5cf6" stackId="w" radius={[0, 0, 0, 0]} />
                <Bar dataKey="alpa" name="Alpa" fill="#ef4444" stackId="w" radius={[3, 3, 0, 0]} />
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
              Matriks Presensi Mingguan per Siswa
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Keterangan: <span className="text-emerald-700 font-bold">H</span> = Hadir,{' '}
              <span className="text-amber-700 font-bold">T</span> = Terlambat,{' '}
              <span className="text-blue-700 font-bold">I</span> = Izin,{' '}
              <span className="text-purple-700 font-bold">S</span> = Sakit,{' '}
              <span className="text-red-700 font-bold">A</span> = Alpa
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600">
            Menampilkan: <span className="font-bold text-slate-900">{studentsRecap.length}</span> Siswa
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">NIS</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-2 text-center">L/P</th>
                {weekInfo.dates.map((dateStr, idx) => {
                  const [_, m, d] = dateStr.split('-');
                  const dObj = new Date(Number(dateStr.split('-')[0]), Number(m) - 1, Number(d));
                  const shortDay = INDONESIAN_DAYS_FULL[dObj.getDay()].substring(0, 3);
                  return (
                    <th key={dateStr} className="py-3 px-1 text-center min-w-[42px]">
                      <div className="text-[10px] text-slate-700">{shortDay}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{d}/{m}</div>
                    </th>
                  );
                })}
                <th className="py-3 px-2 text-center text-emerald-700">H</th>
                <th className="py-3 px-2 text-center text-amber-700">T</th>
                <th className="py-3 px-2 text-center text-blue-700">I</th>
                <th className="py-3 px-2 text-center text-purple-700">S</th>
                <th className="py-3 px-2 text-center text-red-700">A</th>
                <th className="py-3 px-3 text-center font-extrabold">Masuk</th>
                <th className="py-3 px-3 text-right font-extrabold">% Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsRecap.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                studentsRecap.map((sr, idx) => {
                  return (
                    <tr key={sr.student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {sr.student.nis}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-xs">
                        {sr.student.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{sr.student.className}</td>
                      <td className="py-2.5 px-2 text-center text-slate-500 font-mono">{sr.student.gender}</td>

                      {/* 6 Days Cells */}
                      {weekInfo.dates.map((dateStr) => {
                        const status = sr.dailyStatusMap[dateStr];
                        if (!status) {
                          return (
                            <td key={dateStr} className="py-2.5 px-1 text-center">
                              <span className="inline-block w-5 h-5 rounded-md bg-red-100 text-red-700 font-bold text-[10px] leading-5 font-mono">
                                A
                              </span>
                            </td>
                          );
                        }

                        let badgeColor = 'bg-emerald-100 text-emerald-800';
                        let letter = 'H';
                        if (status === 'TERLAMBAT') {
                          badgeColor = 'bg-amber-100 text-amber-800';
                          letter = 'T';
                        } else if (status === 'IZIN') {
                          badgeColor = 'bg-blue-100 text-blue-800';
                          letter = 'I';
                        } else if (status === 'SAKIT') {
                          badgeColor = 'bg-purple-100 text-purple-800';
                          letter = 'S';
                        } else if (status === 'ALPA') {
                          badgeColor = 'bg-red-100 text-red-800';
                          letter = 'A';
                        }

                        return (
                          <td key={dateStr} className="py-2.5 px-1 text-center">
                            <span
                              className={`inline-block w-5 h-5 rounded-md ${badgeColor} font-bold text-[10px] leading-5 font-mono`}
                              title={`${dateStr}: ${status}`}
                            >
                              {letter}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">
                        {sr.hadir}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/20">
                        {sr.terlambat}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-blue-700">{sr.izin}</td>
                      <td className="py-2.5 px-2 text-center font-medium text-purple-700">{sr.sakit}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-red-700 bg-red-50/20">
                        {sr.alpa}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-slate-900 bg-slate-50">
                        {sr.totalMasuk} / 6
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            sr.attendancePercent >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : sr.attendancePercent >= 75
                              ? 'bg-blue-100 text-blue-800'
                              : sr.attendancePercent >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
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

      {/* Official Weekly Print & PDF Archive Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={weekRecords}
        students={students}
        config={config}
        defaultTitle={`LAPORAN REKAPITULASI PRESENSI MINGGUAN - ${weekInfo.label.toUpperCase()}`}
        defaultPeriodLabel={`Periode: ${weekInfo.label}`}
        defaultClass={selectedClass === 'ALL' ? 'Semua Rombongan Belajar' : `Kelas ${selectedClass}`}
      />
    </div>
  );
};
