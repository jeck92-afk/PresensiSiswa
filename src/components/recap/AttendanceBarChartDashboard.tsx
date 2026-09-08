import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  CalendarRange,
  FileText,
  TrendingUp,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserX,
  ChevronLeft,
  ChevronRight,
  Printer,
  Layers,
  Sparkles,
  PieChart,
  ArrowUpRight,
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
import { Student, AttendanceRecord, SchoolConfig } from '../../types';
import {
  DEFAULT_CLASSES,
  formatIndonesianDate,
  getTodayDateString,
} from '../../data/initialData';
import {
  getWeekRange,
  getMonthDates,
  INDONESIAN_MONTHS,
  INDONESIAN_DAYS_FULL,
  parseYMDToDate,
  formatDateToYMD,
} from '../../utils/recapUtils';
import { PrintReportModal } from './PrintReportModal';

export type ChartTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface AttendanceBarChartDashboardProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  initialTimeframe?: ChartTimeframe;
}

export const AttendanceBarChartDashboard: React.FC<AttendanceBarChartDashboardProps> = ({
  students,
  records,
  config,
  initialTimeframe = 'daily',
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(initialTimeframe);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [isStacked, setIsStacked] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Time navigation states
  const [dailyDate, setDailyDate] = useState<string>(getTodayDateString());
  const [weeklyAnchor, setWeeklyAnchor] = useState<string>(getTodayDateString());
  const today = new Date();
  const [monthlyYear, setMonthlyYear] = useState<number>(today.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState<number>(today.getMonth() + 1);
  const [yearlyYear, setYearlyYear] = useState<number>(today.getFullYear());
  const [yearlySemester, setYearlySemester] = useState<'ALL' | 'GANJIL' | 'GENAP'>('ALL');

  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => selectedClass === 'ALL' || s.className === selectedClass);
  }, [students, selectedClass]);

  // ----------------------------------------------------
  // 1. DATA COMPUTATION FOR DAILY BAR CHART
  // ----------------------------------------------------
  const dailyDateRecords = useMemo(() => {
    return records.filter((r) => r.date === dailyDate);
  }, [records, dailyDate]);

  // Daily by class
  const dailyClassChartData = useMemo(() => {
    return classList.map((cls) => {
      const clsStudents = students.filter((s) => s.className === cls);
      const clsRecords = dailyDateRecords.filter((r) => r.studentClass === cls);

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
        name: `Kls ${cls}`,
        className: cls,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa,
        total: clsStudents.length,
        persentase: percent,
      };
    });
  }, [classList, students, dailyDateRecords]);

  // Daily overall status distribution
  const dailyStatusChartData = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const dateRecs = dailyDateRecords.filter((r) => selectedClass === 'ALL' || r.studentClass === selectedClass);
    const attendedIds = new Set(
      dateRecs.filter((r) => ['HADIR', 'TERLAMBAT'].includes(r.status)).map((r) => r.studentId)
    );
    const izinSakitIds = new Set(
      dateRecs.filter((r) => ['IZIN', 'SAKIT'].includes(r.status)).map((r) => r.studentId)
    );

    const hadir = dateRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
    const terlambat = dateRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
    const izin = dateRecs.filter((r) => r.status === 'IZIN').length;
    const sakit = dateRecs.filter((r) => r.status === 'SAKIT').length;
    const alpa = Math.max(0, totalStudents - attendedIds.size - izinSakitIds.size);

    return [
      { status: 'Tepat Waktu (H)', count: hadir, fill: '#10b981', desc: 'Scan sebelum jam masuk' },
      { status: 'Terlambat (T)', count: terlambat, fill: '#f59e0b', desc: 'Scan lewat batas jam masuk' },
      { status: 'Izin (I)', count: izin, fill: '#3b82f6', desc: 'Dispensasi / surat izin' },
      { status: 'Sakit (S)', count: sakit, fill: '#8b5cf6', desc: 'Keterangan sakit' },
      { status: 'Alpa / Belum (A)', count: alpa, fill: '#ef4444', desc: 'Tidak ada konfirmasi' },
    ];
  }, [filteredStudents, dailyDateRecords, selectedClass]);

  // ----------------------------------------------------
  // 2. DATA COMPUTATION FOR WEEKLY BAR CHART
  // ----------------------------------------------------
  const weekInfo = useMemo(() => {
    return getWeekRange(weeklyAnchor);
  }, [weeklyAnchor]);

  const weeklyDayChartData = useMemo(() => {
    // 6 school days: Monday to Saturday
    return weekInfo.dates.map((dateStr, idx) => {
      const dayName = INDONESIAN_DAYS_FULL[idx] || `Hari ${idx + 1}`;
      const dRecs = records.filter(
        (r) => r.date === dateStr && (selectedClass === 'ALL' || r.studentClass === selectedClass)
      );

      const totalSt = filteredStudents.length;
      const attendedIds = new Set(
        dRecs.filter((r) => ['HADIR', 'TERLAMBAT'].includes(r.status)).map((r) => r.studentId)
      );
      const izinSakitIds = new Set(
        dRecs.filter((r) => ['IZIN', 'SAKIT'].includes(r.status)).map((r) => r.studentId)
      );

      const hadir = dRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = dRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izin = dRecs.filter((r) => r.status === 'IZIN').length;
      const sakit = dRecs.filter((r) => r.status === 'SAKIT').length;
      const alpa = Math.max(0, totalSt - attendedIds.size - izinSakitIds.size);
      const percent = totalSt > 0 ? Math.round(((hadir + terlambat) / totalSt) * 100) : 0;

      return {
        name: dayName,
        date: dateStr,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa,
        totalHadir: hadir + terlambat,
        persentase: percent,
      };
    });
  }, [weekInfo.dates, records, filteredStudents, selectedClass]);

  // Weekly class comparison
  const weeklyClassChartData = useMemo(() => {
    return classList.map((cls) => {
      const clsStudents = students.filter((s) => s.className === cls);
      const clsRecs = records.filter(
        (r) => weekInfo.dates.includes(r.date) && r.studentClass === cls
      );

      const hadir = clsRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = clsRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izin = clsRecs.filter((r) => r.status === 'IZIN').length;
      const sakit = clsRecs.filter((r) => r.status === 'SAKIT').length;

      const totalSlots = clsStudents.length * weekInfo.dates.length;
      const totalMasuk = hadir + terlambat;
      const percent = totalSlots > 0 ? Math.round((totalMasuk / totalSlots) * 100) : 0;
      const totalAlpa = Math.max(0, totalSlots - totalMasuk - izin - sakit);

      return {
        name: `Kls ${cls}`,
        className: cls,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa: totalAlpa,
        persentase: percent,
      };
    });
  }, [classList, students, records, weekInfo.dates]);

  // ----------------------------------------------------
  // 3. DATA COMPUTATION FOR MONTHLY BAR CHART
  // ----------------------------------------------------
  const monthDays = useMemo(() => {
    return getMonthDates(monthlyYear, monthlyMonth);
  }, [monthlyYear, monthlyMonth]);

  const effectiveMonthDays = useMemo(() => {
    return monthDays.filter((d) => !d.isSunday);
  }, [monthDays]);

  const monthlyDayChartData = useMemo(() => {
    return effectiveMonthDays.map((d) => {
      const dRecs = records.filter(
        (r) => r.date === d.date && (selectedClass === 'ALL' || r.studentClass === selectedClass)
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
        name: `Tgl ${d.dayNumber}`,
        day: d.dayNumber,
        date: d.date,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa,
        totalMasuk,
        persentase: percent,
      };
    });
  }, [effectiveMonthDays, records, filteredStudents, selectedClass]);

  const monthlyClassChartData = useMemo(() => {
    const datesInMonth = effectiveMonthDays.map((d) => d.date);
    return classList.map((cls) => {
      const clsStudents = students.filter((s) => s.className === cls);
      const clsRecs = records.filter(
        (r) => datesInMonth.includes(r.date) && r.studentClass === cls
      );

      const hadir = clsRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = clsRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izin = clsRecs.filter((r) => r.status === 'IZIN').length;
      const sakit = clsRecs.filter((r) => r.status === 'SAKIT').length;

      const totalSlots = clsStudents.length * datesInMonth.length;
      const totalMasuk = hadir + terlambat;
      const percent = totalSlots > 0 ? Math.round((totalMasuk / totalSlots) * 100) : 0;
      const totalAlpa = Math.max(0, totalSlots - totalMasuk - izin - sakit);

      return {
        name: `Kls ${cls}`,
        className: cls,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa: totalAlpa,
        persentase: percent,
      };
    });
  }, [classList, students, records, effectiveMonthDays]);

  // ----------------------------------------------------
  // 4. DATA COMPUTATION FOR YEARLY BAR CHART
  // ----------------------------------------------------
  const yearlyRecords = useMemo(() => {
    return records.filter((r) => {
      const y = parseInt(r.date.split('-')[0], 10);
      return y === yearlyYear;
    });
  }, [records, yearlyYear]);

  const yearlyMonthChartData = useMemo(() => {
    return INDONESIAN_MONTHS.map((mName, idx) => {
      const monthNum = idx + 1;
      const monthPrefix = `${yearlyYear}-${String(monthNum).padStart(2, '0')}`;
      const mDates = getMonthDates(yearlyYear, monthNum).filter((d) => !d.isSunday);

      const mRecords = yearlyRecords.filter(
        (r) =>
          r.date.startsWith(monthPrefix) &&
          (selectedClass === 'ALL' || r.studentClass === selectedClass)
      );

      const hadir = mRecords.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = mRecords.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izin = mRecords.filter((r) => r.status === 'IZIN').length;
      const sakit = mRecords.filter((r) => r.status === 'SAKIT').length;
      const totalMasuk = hadir + terlambat;

      const totalSlots = filteredStudents.length * Math.max(1, mDates.length);
      const percent = totalSlots > 0 ? Math.round((totalMasuk / totalSlots) * 100) : 0;
      const alpa = Math.max(0, totalSlots - totalMasuk - izin - sakit);

      // Filter by semester if needed
      let isVisible = true;
      if (yearlySemester === 'GANJIL' && monthNum < 7) isVisible = false;
      if (yearlySemester === 'GENAP' && monthNum > 6) isVisible = false;

      return {
        name: mName.substring(0, 3),
        fullName: mName,
        monthNum,
        hadir,
        terlambat,
        izin,
        sakit,
        alpa,
        totalMasuk,
        persentase: percent,
        effectiveDays: mDates.length,
        isVisible,
      };
    }).filter((m) => m.isVisible);
  }, [yearlyYear, yearlyRecords, selectedClass, filteredStudents, yearlySemester]);

  const yearlyClassChartData = useMemo(() => {
    return classList.map((cls) => {
      const clsStudents = students.filter((s) => s.className === cls);
      const clsRecs = yearlyRecords.filter((r) => r.studentClass === cls);

      const hadir = clsRecs.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = clsRecs.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izin = clsRecs.filter((r) => r.status === 'IZIN').length;
      const sakit = clsRecs.filter((r) => r.status === 'SAKIT').length;
      const totalMasuk = hadir + terlambat;

      // Approximate effective days in year (approx 240 days)
      const approxYearDays = 240;
      const totalSlots = clsStudents.length * approxYearDays;
      const percent = totalSlots > 0 ? Math.min(100, Math.round((totalMasuk / Math.max(1, totalMasuk + izin + sakit)) * 100)) : 0;

      return {
        name: `Kls ${cls}`,
        className: cls,
        hadir,
        terlambat,
        izin,
        sakit,
        totalMasuk,
        persentase: percent,
      };
    });
  }, [classList, students, yearlyRecords]);

  // Navigation handlers
  const handlePrevDaily = () => {
    const d = parseYMDToDate(dailyDate);
    d.setDate(d.getDate() - 1);
    setDailyDate(formatDateToYMD(d));
  };
  const handleNextDaily = () => {
    const d = parseYMDToDate(dailyDate);
    d.setDate(d.getDate() + 1);
    setDailyDate(formatDateToYMD(d));
  };

  const handlePrevWeekly = () => {
    const d = parseYMDToDate(weekInfo.startDate);
    d.setDate(d.getDate() - 7);
    setWeeklyAnchor(formatDateToYMD(d));
  };
  const handleNextWeekly = () => {
    const d = parseYMDToDate(weekInfo.startDate);
    d.setDate(d.getDate() + 7);
    setWeeklyAnchor(formatDateToYMD(d));
  };

  const handlePrevMonthly = () => {
    if (monthlyMonth === 1) {
      setMonthlyMonth(12);
      setMonthlyYear((y) => y - 1);
    } else {
      setMonthlyMonth((m) => m - 1);
    }
  };
  const handleNextMonthly = () => {
    if (monthlyMonth === 12) {
      setMonthlyMonth(1);
      setMonthlyYear((y) => y + 1);
    } else {
      setMonthlyMonth((m) => m + 1);
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs space-y-1.5 z-50 min-w-[180px]">
          <div className="font-bold border-b border-slate-700 pb-1 text-slate-200 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">SIADIK</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Navigation & Control Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200/70 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Visualisasi &amp; Analisis Presensi</span>
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Diagram Batang Kehadiran Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Grafik batang komparasi dan tren kehadiran per hari, per minggu, per bulan, dan per tahun
            </p>
          </div>

          {/* Timeframe selector pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setTimeframe('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'daily'
                    ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200 ring-1 ring-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Per Hari</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200 ring-1 ring-emerald-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                <span>Per Minggu</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-white text-amber-900 shadow-xs border border-amber-200 ring-1 ring-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Per Bulan</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('yearly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'yearly'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200 ring-1 ring-purple-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Per Tahun</span>
              </button>
            </div>

            {/* Print Modal button */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              title="Cetak Laporan Visual"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Dokumen</span>
            </button>
          </div>
        </div>

        {/* Dynamic Period Controller & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-slate-100 items-center">
          {/* Left: Period Navigation Controls */}
          <div className="sm:col-span-7 flex flex-wrap items-center gap-2">
            {timeframe === 'daily' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevDaily}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Hari Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleNextDaily}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Hari Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDailyDate(getTodayDateString())}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg cursor-pointer"
                >
                  Hari Ini
                </button>
                <span className="text-xs font-semibold text-slate-700 px-1 hidden md:inline">
                  {formatIndonesianDate(dailyDate)}
                </span>
              </div>
            )}

            {timeframe === 'weekly' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevWeekly}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Minggu Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
                  {formatIndonesianDate(weekInfo.startDate)} s/d {formatIndonesianDate(weekInfo.endDate)}
                </span>
                <button
                  type="button"
                  onClick={handleNextWeekly}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Minggu Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyAnchor(getTodayDateString())}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  Minggu Ini
                </button>
              </div>
            )}

            {timeframe === 'monthly' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevMonthly}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(parseInt(e.target.value, 10))}
                  className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  {INDONESIAN_MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(parseInt(e.target.value, 10))}
                  className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleNextMonthly}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const n = new Date();
                    setMonthlyYear(n.getFullYear());
                    setMonthlyMonth(n.getMonth() + 1);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg cursor-pointer"
                >
                  Bulan Ini
                </button>
              </div>
            )}

            {timeframe === 'yearly' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600 pl-2">Tahun:</span>
                <select
                  value={yearlyYear}
                  onChange={(e) => setYearlyYear(parseInt(e.target.value, 10))}
                  className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <select
                  value={yearlySemester}
                  onChange={(e) => setYearlySemester(e.target.value as any)}
                  className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="ALL">1 Tahun Penuh (12 Bulan)</option>
                  <option value="GANJIL">Semester Ganjil (Jul-Des)</option>
                  <option value="GENAP">Semester Genap (Jan-Jun)</option>
                </select>
              </div>
            )}
          </div>

          {/* Right: Class Filter & Stacking Options */}
          <div className="sm:col-span-5 flex items-center justify-start sm:justify-end gap-2">
            <div className="w-full sm:w-auto min-w-[160px]">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
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

            <button
              type="button"
              onClick={() => setIsStacked(!isStacked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                isStacked
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Ganti Mode Tampilan Batang Tumpuk (Stacked) vs Berdampingan (Grouped)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isStacked ? 'Batang Tumpuk' : 'Berdampingan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. DAILY BAR CHARTS VIEW                                           */}
      {/* ------------------------------------------------------------------ */}
      {timeframe === 'daily' && (
        <div className="space-y-6">
          {/* Chart 1: Bar Chart of Status per Class */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Diagram Batang Kehadiran per Kelas ({formatIndonesianDate(dailyDate)})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi jumlah siswa Hadir Tepat Waktu, Terlambat, Izin, Sakit, dan Alpa di setiap rombel
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Hadir
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <span className="w-3 h-3 rounded-sm bg-amber-500" /> Terlambat
                </span>
                <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                  <span className="w-3 h-3 rounded-sm bg-blue-500" /> Izin
                </span>
                <span className="flex items-center gap-1.5 text-purple-700 font-bold">
                  <span className="w-3 h-3 rounded-sm bg-purple-500" /> Sakit
                </span>
                <span className="flex items-center gap-1.5 text-red-700 font-bold">
                  <span className="w-3 h-3 rounded-sm bg-red-500" /> Alpa
                </span>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyClassChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
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
                    name="Alpa / Belum Hadir"
                    fill="#ef4444"
                    stackId={isStacked ? 'a' : undefined}
                    radius={isStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid 2 Column: Percentage per Class & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 2: Percentage of attendance per Class */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Persentase Tingkat Kehadiran per Kelas (%)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target kehadiran standar institusi adalah minimal 90% (garis putus-putus merah)
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyClassChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Target 90%', fill: '#ef4444', fontSize: 10 }} />
                    <Bar dataKey="persentase" name="Persentase Hadir (%)" fill="#0ea5e9" radius={[6, 6, 0, 0]}>
                      {dailyClassChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.persentase >= 90 ? '#10b981' : entry.persentase >= 75 ? '#0284c7' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Distribution of Status across selected filter */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span>Distribusi Total Status Presensi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agregat seluruh siswa ({selectedClass === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClass}`})
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={dailyStatusChartData}
                    margin={{ top: 10, right: 20, left: 35, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Jumlah Siswa" radius={[0, 6, 6, 0]}>
                      {dailyStatusChartData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. WEEKLY BAR CHARTS VIEW                                          */}
      {/* ------------------------------------------------------------------ */}
      {timeframe === 'weekly' && (
        <div className="space-y-6">
          {/* Chart 1: Daily Trend in 1 Week */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Diagram Batang Kehadiran Mingguan (Senin s/d Sabtu)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periode {formatIndonesianDate(weekInfo.startDate)} sampai {formatIndonesianDate(weekInfo.endDate)}
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyDayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar
                    dataKey="hadir"
                    name="Hadir (Tepat Waktu)"
                    fill="#10b981"
                    stackId={isStacked ? 'w' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="terlambat"
                    name="Terlambat"
                    fill="#f59e0b"
                    stackId={isStacked ? 'w' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="izin"
                    name="Izin"
                    fill="#3b82f6"
                    stackId={isStacked ? 'w' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="sakit"
                    name="Sakit"
                    fill="#8b5cf6"
                    stackId={isStacked ? 'w' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="alpa"
                    name="Alpa / Tanpa Keterangan"
                    fill="#ef4444"
                    stackId={isStacked ? 'w' : undefined}
                    radius={isStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: Weekly Class Comparison & Daily % Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Weekly class comparison */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Komparasi Kehadiran Mingguan Antar Kelas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rata-rata persentase kehadiran masing-masing kelas dalam minggu ini
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyClassChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Target 90%', fill: '#ef4444', fontSize: 10 }} />
                    <Bar dataKey="persentase" name="Rata-rata Hadir (%)" fill="#10b981" radius={[6, 6, 0, 0]}>
                      {weeklyClassChartData.map((entry, index) => (
                        <Cell
                          key={`weekly-cell-${index}`}
                          fill={entry.persentase >= 90 ? '#10b981' : entry.persentase >= 75 ? '#0284c7' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily % Rate in Week */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Persentase Kehadiran per Hari</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tingkat kehadiran siswa setiap hari selama 6 hari sekolah
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyDayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="persentase" name="Kehadiran (%)" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. MONTHLY BAR CHARTS VIEW                                         */}
      {/* ------------------------------------------------------------------ */}
      {timeframe === 'monthly' && (
        <div className="space-y-6">
          {/* Chart 1: Daily Trend across entire Month (Dates 1..31) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span>Diagram Batang Tren Harian Sepanjang Bulan ({INDONESIAN_MONTHS[monthlyMonth - 1]} {monthlyYear})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fluktuasi kehadiran harian pada {effectiveMonthDays.length} hari efektif belajar di bulan {INDONESIAN_MONTHS[monthlyMonth - 1]}
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar
                    dataKey="hadir"
                    name="Tepat Waktu"
                    fill="#10b981"
                    stackId={isStacked ? 'm' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="terlambat"
                    name="Terlambat"
                    fill="#f59e0b"
                    stackId={isStacked ? 'm' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="izin"
                    name="Izin"
                    fill="#3b82f6"
                    stackId={isStacked ? 'm' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="sakit"
                    name="Sakit"
                    fill="#8b5cf6"
                    stackId={isStacked ? 'm' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="alpa"
                    name="Alpa"
                    fill="#ef4444"
                    stackId={isStacked ? 'm' : undefined}
                    radius={isStacked ? [3, 3, 0, 0] : [3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: Monthly Class Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span>Diagram Batang Kehadiran per Kelas (Bulan {INDONESIAN_MONTHS[monthlyMonth - 1]})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akumulasi kehadiran per rombel selama satu bulan penuh
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyClassChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="hadir" name="Hadir" fill="#10b981" stackId="mc" />
                    <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" stackId="mc" />
                    <Bar dataKey="izin" name="Izin" fill="#3b82f6" stackId="mc" />
                    <Bar dataKey="sakit" name="Sakit" fill="#8b5cf6" stackId="mc" />
                    <Bar dataKey="alpa" name="Alpa" fill="#ef4444" stackId="mc" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Persentase Kehadiran Kelas Bulan Ini</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tingkat rata-rata kehadiran (%) per rombel dalam bulan ini
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyClassChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" />
                    <Bar dataKey="persentase" name="Kehadiran (%)" fill="#d97706" radius={[6, 6, 0, 0]}>
                      {monthlyClassChartData.map((entry, index) => (
                        <Cell
                          key={`cell-m-${index}`}
                          fill={entry.persentase >= 90 ? '#10b981' : entry.persentase >= 75 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. YEARLY BAR CHARTS VIEW                                          */}
      {/* ------------------------------------------------------------------ */}
      {timeframe === 'yearly' && (
        <div className="space-y-6">
          {/* Chart 1: 12 Month Breakdown Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Diagram Batang Rekapitulasi Tahunan (Tahun {yearlyYear})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akumulasi kehadiran per bulan sepanjang tahun {yearlyYear} ({yearlySemester === 'ALL' ? 'Januari - Desember' : yearlySemester === 'GANJIL' ? 'Semester Ganjil' : 'Semester Genap'})
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyMonthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar
                    dataKey="hadir"
                    name="Tepat Waktu"
                    fill="#10b981"
                    stackId={isStacked ? 'y' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="terlambat"
                    name="Terlambat"
                    fill="#f59e0b"
                    stackId={isStacked ? 'y' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="izin"
                    name="Izin"
                    fill="#3b82f6"
                    stackId={isStacked ? 'y' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="sakit"
                    name="Sakit"
                    fill="#8b5cf6"
                    stackId={isStacked ? 'y' : undefined}
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="alpa"
                    name="Alpa"
                    fill="#ef4444"
                    stackId={isStacked ? 'y' : undefined}
                    radius={isStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: Yearly Class Breakdown & Monthly % Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Diagram Batang Akumulasi Kehadiran per Kelas (Tahun {yearlyYear})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total catatan kehadiran siswa per rombongan belajar sepanjang tahun
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyClassChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="hadir" name="Hadir" fill="#10b981" stackId="yc" />
                    <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" stackId="yc" />
                    <Bar dataKey="izin" name="Izin" fill="#3b82f6" stackId="yc" />
                    <Bar dataKey="sakit" name="Sakit" fill="#8b5cf6" stackId="yc" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Persentase Kehadiran per Bulan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tingkat kehadiran siswa dari bulan ke bulan dalam tahun {yearlyYear}
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyMonthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" />
                    <Bar dataKey="persentase" name="Kehadiran (%)" fill="#9333ea" radius={[6, 6, 0, 0]}>
                      {yearlyMonthChartData.map((entry, index) => (
                        <Cell
                          key={`cell-y-${index}`}
                          fill={entry.persentase >= 90 ? '#10b981' : entry.persentase >= 75 ? '#9333ea' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Print Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={
          timeframe === 'daily'
            ? dailyDateRecords
            : timeframe === 'weekly'
            ? records.filter((r) => weekInfo.dates.includes(r.date))
            : timeframe === 'monthly'
            ? records.filter((r) => effectiveMonthDays.map((d) => d.date).includes(r.date))
            : yearlyRecords
        }
        students={students}
        config={config}
        defaultTitle={`LAPORAN ANALISIS GRAFIK PRESENSI (${timeframe.toUpperCase()})`}
        defaultPeriodLabel={
          timeframe === 'daily'
            ? `Tanggal: ${formatIndonesianDate(dailyDate)}`
            : timeframe === 'weekly'
            ? `Minggu: ${formatIndonesianDate(weekInfo.startDate)} s/d ${formatIndonesianDate(weekInfo.endDate)}`
            : timeframe === 'monthly'
            ? `Bulan: ${INDONESIAN_MONTHS[monthlyMonth - 1]} ${monthlyYear}`
            : `Tahun: ${yearlyYear}`
        }
        defaultClass={selectedClass === 'ALL' ? 'Semua Rombongan Belajar' : `Kelas ${selectedClass}`}
      />
    </div>
  );
};
