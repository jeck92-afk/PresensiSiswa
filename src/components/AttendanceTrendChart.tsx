import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Users,
  Award,
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolConfig } from '../types';
import { parseYMDToDate, formatDateToYMD, INDONESIAN_DAYS_FULL } from '../utils/recapUtils';
import { DEFAULT_CLASSES, getTodayDateString } from '../data/initialData';

interface AttendanceTrendChartProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  onNavigateToRecap?: () => void;
}

interface DayTrendData {
  date: string;
  dayShort: string;
  dayFull: string;
  dateFormatted: string;
  isToday: boolean;
  totalStudents: number;
  hadir: number;
  terlambat: number;
  izinSakit: number;
  alpa: number;
  totalMasuk: number;
  attendanceRate: number;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  students,
  records,
  config,
  onNavigateToRecap,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  const classList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();
  }, [students]);

  // Generate the last 7 calendar days ending today
  const last7DaysData = useMemo<DayTrendData[]>(() => {
    const todayStr = getTodayDateString();
    const [y, m, d] = todayStr.split('-').map(Number);
    const todayDate = new Date(y, m - 1, d);

    const activeStudents =
      selectedClass === 'ALL'
        ? students
        : students.filter((s) => s.className === selectedClass);
    const totalCount = activeStudents.length;

    const result: DayTrendData[] = [];

    // 6 days ago up to today (7 days total)
    for (let i = 6; i >= 0; i--) {
      const cur = new Date(todayDate);
      cur.setDate(todayDate.getDate() - i);
      const dateStr = formatDateToYMD(cur);

      const dayIndex = cur.getDay();
      const dayFull = INDONESIAN_DAYS_FULL[dayIndex];
      const dayShort = dayFull.substring(0, 3);
      const dateFormatted = `${cur.getDate()}/${cur.getMonth() + 1}`;

      // Filter records for this date and selected class
      const dayRecords = records.filter(
        (r) =>
          r.date === dateStr &&
          (selectedClass === 'ALL' || r.studentClass === selectedClass)
      );

      const attendedIds = new Set(
        dayRecords
          .filter((r) => ['HADIR', 'TERLAMBAT'].includes(r.status))
          .map((r) => r.studentId)
      );
      const izinSakitIds = new Set(
        dayRecords
          .filter((r) => ['IZIN', 'SAKIT'].includes(r.status))
          .map((r) => r.studentId)
      );

      const hadir = dayRecords.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
      const terlambat = dayRecords.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
      const izinSakit = dayRecords.filter((r) => ['IZIN', 'SAKIT'].includes(r.status)).length;

      // Unrecorded / absent
      const totalMasuk = attendedIds.size;
      const alpa = Math.max(0, totalCount - totalMasuk - izinSakitIds.size);
      const attendanceRate = totalCount > 0 ? Math.round((totalMasuk / totalCount) * 100) : 0;

      result.push({
        date: dateStr,
        dayShort,
        dayFull,
        dateFormatted,
        isToday: dateStr === todayStr,
        totalStudents: totalCount,
        hadir,
        terlambat,
        izinSakit,
        alpa,
        totalMasuk,
        attendanceRate,
      });
    }

    return result;
  }, [students, records, selectedClass]);

  // Overall 7-day stats
  const stats7Days = useMemo(() => {
    if (last7DaysData.length === 0) {
      return { avgRate: 0, bestDay: null, totalLate: 0, totalMasuk: 0 };
    }

    const rates = last7DaysData.map((d) => d.attendanceRate);
    const avgRate = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    const totalLate = last7DaysData.reduce((acc, d) => acc + d.terlambat, 0);
    const totalMasuk = last7DaysData.reduce((acc, d) => acc + d.totalMasuk, 0);

    let bestDay = last7DaysData[0];
    last7DaysData.forEach((d) => {
      if (d.attendanceRate > bestDay.attendanceRate) {
        bestDay = d;
      }
    });

    return { avgRate, bestDay, totalLate, totalMasuk };
  }, [last7DaysData]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/90 space-y-5">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Tren Kehadiran Siswa 7 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring dinamika tingkat kehadiran dan kedisiplinan siswa harian secara visual
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Chart Type & Class Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/90 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-0 font-bold text-slate-800 text-xs focus:ring-0 p-0 pr-1 cursor-pointer"
            >
              <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Area vs Bar Chart */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Tren Garis / Area (%)"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tren %</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Komposisi Batang Siswa"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Komposisi</span>
            </button>
          </div>

          {onNavigateToRecap && (
            <button
              type="button"
              onClick={onNavigateToRecap}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer hidden md:inline-flex"
            >
              Buka Rekap Lengkap →
            </button>
          )}
        </div>
      </div>

      {/* 2. Key 7-Day Performance Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Rata-rata Kehadiran</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
            {stats7Days.avgRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">7 hari terakhir</div>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <span>Hari Terbaik</span>
            <Award className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-950 truncate mt-0.5">
            {stats7Days.bestDay?.dayFull || 'Senin'}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            {stats7Days.bestDay?.attendanceRate}% hadir ({stats7Days.bestDay?.dateFormatted})
          </div>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span>Total Terlambat</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-950 font-mono mt-0.5">
            {stats7Days.totalLate}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">Akumulasi 7 hari</div>
        </div>

        <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
            <span>Total Presensi Masuk</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-950 font-mono mt-0.5">
            {stats7Days.totalMasuk}
          </div>
          <div className="text-[10px] text-blue-700 mt-0.5">Pemindaian berhasil</div>
        </div>
      </div>

      {/* 3. Recharts Container */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dayShort"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value, idx) => {
                  const d = last7DaysData[idx];
                  return d ? `${value} (${d.dateFormatted})` : value;
                }}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DayTrendData;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[190px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                          <span className="font-extrabold text-white">
                            {data.dayFull}, {data.dateFormatted}
                          </span>
                          {data.isToday && (
                            <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 font-mono">
                          <div className="flex items-center justify-between text-blue-300 font-bold">
                            <span>Tingkat Hadir:</span>
                            <span>{data.attendanceRate}%</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-400">
                            <span>Tepat Waktu:</span>
                            <span>{data.hadir} Siswa</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-400">
                            <span>Terlambat:</span>
                            <span>{data.terlambat} Siswa</span>
                          </div>
                          <div className="flex items-center justify-between text-sky-400">
                            <span>Izin / Sakit:</span>
                            <span>{data.izinSakit} Siswa</span>
                          </div>
                          <div className="flex items-center justify-between text-rose-400">
                            <span>Belum Hadir / Alpa:</span>
                            <span>{data.alpa} Siswa</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="attendanceRate"
                name="Tingkat Kehadiran (%)"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#attendanceGradient)"
                activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dayShort"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value, idx) => {
                  const d = last7DaysData[idx];
                  return d ? `${value} (${d.dateFormatted})` : value;
                }}
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DayTrendData;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[190px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                          <span className="font-extrabold text-white">
                            {data.dayFull}, {data.dateFormatted}
                          </span>
                          {data.isToday && (
                            <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 font-mono">
                          <div className="flex items-center justify-between text-emerald-400 font-bold">
                            <span>Tepat Waktu:</span>
                            <span>{data.hadir} Siswa</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-400">
                            <span>Terlambat:</span>
                            <span>{data.terlambat} Siswa</span>
                          </div>
                          <div className="flex items-center justify-between text-sky-400">
                            <span>Izin / Sakit:</span>
                            <span>{data.izinSakit} Siswa</span>
                          </div>
                          <div className="flex items-center justify-between text-rose-400">
                            <span>Alpa / Belum Scan:</span>
                            <span>{data.alpa} Siswa</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800 font-sans">
                            <span>Persentase Hadir:</span>
                            <span className="font-bold text-blue-300 font-mono">
                              {data.attendanceRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              <Bar dataKey="hadir" name="Tepat Waktu" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="terlambat" name="Terlambat" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="izinSakit" name="Izin / Sakit" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="alpa" name="Alpa / Belum" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
