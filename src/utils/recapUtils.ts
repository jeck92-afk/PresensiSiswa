import { Student, AttendanceRecord, AttendanceStatus, SchoolConfig } from '../types';
import { DEFAULT_TIMEZONE_CODE, getTimeZoneIana } from './time';
import * as XLSX from 'xlsx';

export type RecapPeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDONESIAN_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const INDONESIAN_DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Returns YYYY-MM-DD from a Date object
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD safely into Date (treating as local noon to avoid DST/offset shifts)
 */
export function parseYMDToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

/**
 * Returns the Monday and Saturday of the week containing the given date
 */
export function getWeekRange(dateInput: Date | string): {
  startDate: string; // Monday
  endDate: string;   // Saturday
  dates: string[];   // Monday to Saturday
  label: string;
} {
  const d = typeof dateInput === 'string' ? parseYMDToDate(dateInput) : new Date(dateInput);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  
  // Calculate distance to Monday
  // If Sunday (0), distance is -6 days to previous Monday, or +1 day to next Monday. In Indonesian school, Sunday is end of week or off.
  const distToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + distToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 6; i++) { // Monday to Saturday (6 school days)
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    dates.push(formatDateToYMD(cur));
  }

  const startStr = dates[0];
  const endStr = dates[dates.length - 1];

  const sDate = parseYMDToDate(startStr);
  const eDate = parseYMDToDate(endStr);

  const label = `${sDate.getDate()} ${INDONESIAN_MONTHS[sDate.getMonth()]} – ${eDate.getDate()} ${INDONESIAN_MONTHS[eDate.getMonth()]} ${eDate.getFullYear()}`;

  return {
    startDate: startStr,
    endDate: endStr,
    dates,
    label,
  };
}

/**
 * Returns all dates for a given month (YYYY-MM)
 */
export function getMonthDates(year: number, month: number): {
  date: string;
  dayNum: number;
  dayName: string;
  isSunday: boolean;
  isSaturday: boolean;
  isWeekend: boolean;
}[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const list = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(year, month - 1, d, 12, 0, 0);
    const dayOfWeek = cur.getDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    list.push({
      date: dateStr,
      dayNum: d,
      dayName: INDONESIAN_DAYS_SHORT[dayOfWeek],
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return list;
}

/**
 * Summary interface for a single student across any date range
 */
export interface StudentRecapSummary {
  student: Student;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalMasuk: number; // hadir + terlambat
  totalEffectiveDays: number;
  attendancePercent: number; // (hadir + terlambat) / totalEffectiveDays * 100
  dailyStatusMap: Record<string, AttendanceStatus | null>;
}

/**
 * Computes recap for an array of students across a set of dates
 */
export function computeStudentsRecap(
  students: Student[],
  records: AttendanceRecord[],
  dates: string[],
  effectiveDaysCount?: number
): StudentRecapSummary[] {
  // Map records by studentId and date: key `${studentId}_${date}`
  // If multiple records exist (e.g. MASUK and PULANG), status from MASUK takes priority
  const recordMap = new Map<string, AttendanceRecord>();

  records.forEach((r) => {
    const key = `${r.studentId}_${r.date}`;
    const existing = recordMap.get(key);
    if (!existing) {
      recordMap.set(key, r);
    } else {
      // If one is MASUK and one is PULANG, keep MASUK or the one with better/worse status
      if (r.type === 'MASUK') {
        recordMap.set(key, r);
      }
    }
  });

  const totalEffective = effectiveDaysCount ?? dates.length;

  return students.map((student) => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    const dailyStatusMap: Record<string, AttendanceStatus | null> = {};

    dates.forEach((dateStr) => {
      const key = `${student.id}_${dateStr}`;
      const rec = recordMap.get(key);
      if (rec) {
        dailyStatusMap[dateStr] = rec.status;
        if (rec.status === 'HADIR') hadir++;
        else if (rec.status === 'TERLAMBAT') terlambat++;
        else if (rec.status === 'IZIN') izin++;
        else if (rec.status === 'SAKIT') sakit++;
        else if (rec.status === 'ALPA') alpa++;
      } else {
        // No record on this school date: count as ALPA / Belum Hadir if effective day
        dailyStatusMap[dateStr] = null;
        alpa++;
      }
    });

    const totalMasuk = hadir + terlambat;
    const attendancePercent =
      totalEffective > 0 ? Math.round((totalMasuk / totalEffective) * 100) : 0;

    return {
      student,
      hadir,
      terlambat,
      izin,
      sakit,
      alpa,
      totalMasuk,
      totalEffectiveDays: totalEffective,
      attendancePercent,
      dailyStatusMap,
    };
  });
}

/**
 * Export generic recap matrix to Excel (.xlsx) file
 */
export function exportRecapToExcel(
  title: string,
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  config: SchoolConfig
) {
  const wsData = [
    [config.schoolName.toUpperCase()],
    [`NPSN: ${config.schoolNpsn} | T.A. ${config.academicYear}`],
    [title],
    [`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [], // Empty row
    headers,
    ...rows,
    [],
    ['', '', '', '', `Mengetahui, Kepala Sekolah: ${config.principalName} (NIP: ${config.principalNip || '-'})`],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    rows.forEach((r) => {
      const valStr = String(r[i] ?? '');
      if (valStr.length > maxLen) maxLen = valStr.length;
    });
    return { wch: Math.max(maxLen + 3, 8) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Presensi');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
