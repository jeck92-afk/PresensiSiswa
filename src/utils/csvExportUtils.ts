import { Student, AttendanceRecord, SchoolConfig } from '../types';
import { getMonthDates, INDONESIAN_MONTHS } from './recapUtils';

export type CsvDelimiter = ';' | ',' | '\t';

export type MonthlyCsvFormat =
  | 'matrix' // Matriks Harian 1-31 (Standar Dapodik & Buku Absen)
  | 'summary' // Rekap Agregat per Siswa (Format Laporan Dinas)
  | 'class_summary' // Rekapitulasi per Rombel / Kelas (Laporan Pengawas)
  | 'logs'; // Detail Log Transaksi Harian dalam Bulan

export interface MonthlyCsvExportOptions {
  month: number; // 1 - 12
  year: number;
  format: MonthlyCsvFormat;
  delimiter?: CsvDelimiter;
  includeHeaderMetadata?: boolean;
  includeSummaryFooter?: boolean;
  excelSafeNumbers?: boolean; // Prepends ' or formats ="..." to preserve leading zeros in NIS/NISN
  selectedClass?: string;
  notes?: string;
}

export interface CsvGenerationResult {
  csvContent: string;
  fileName: string;
  totalRows: number;
  totalColumns: number;
  headers: string[];
  sampleRows: string[][]; // First 5 rows for live UI preview
}

/**
 * Escape a single cell value for CSV formatting
 */
const escapeCsvCell = (
  value: string | number | undefined | null,
  delimiter: CsvDelimiter,
  isSafeNumericText: boolean = false
): string => {
  if (value === null || value === undefined) return '""';
  const str = String(value);

  // If safe numeric text format requested (e.g. NISN '0081234567')
  if (isSafeNumericText && /^\d+$/.test(str)) {
    // Excel formula format ="0081234567" is universally recognized without showing apostrophes
    return `="${str}"`;
  }

  // Check if quoting is required
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Determine Attendance Status Rating for Indonesian Education Agency
 */
export const getAttendanceRating = (percentage: number): string => {
  if (percentage >= 95) return 'Sangat Baik (A)';
  if (percentage >= 85) return 'Baik (B)';
  if (percentage >= 75) return 'Cukup (C)';
  if (percentage >= 60) return 'Kurang (D)';
  return 'Perlu Pembinaan Khusus (E)';
};

/**
 * Generate monthly attendance CSV with customizable layouts, metadata, and regional delimiters
 */
export const generateMonthlyAttendanceCsv = (
  students: Student[],
  records: AttendanceRecord[],
  config: SchoolConfig,
  options: MonthlyCsvExportOptions
): CsvGenerationResult => {
  const {
    month,
    year,
    format = 'matrix',
    delimiter = ';',
    includeHeaderMetadata = true,
    includeSummaryFooter = true,
    excelSafeNumbers = true,
    selectedClass = 'ALL',
  } = options;

  const monthName = INDONESIAN_MONTHS[month - 1] || `Bulan ${month}`;
  const monthDays = getMonthDates(year, month);
  const effectiveSchoolDates = monthDays.filter((d) => !d.isSunday).map((d) => d.date);
  const effectiveDaysCount = effectiveSchoolDates.length;

  // Filter students based on selected class
  const filteredStudents = students
    .filter((s) => selectedClass === 'ALL' || s.className === selectedClass)
    .sort((a, b) => {
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      return a.name.localeCompare(b.name);
    });

  // Calculate student monthly attendance recap
  const studentRecaps = filteredStudents.map((student) => {
    const studentRecords = records.filter((r) => r.studentId === student.id);
    const dailyStatusMap: Record<string, 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA'> = {};

    effectiveSchoolDates.forEach((dateStr) => {
      const dayRecs = studentRecords.filter((r) => r.date === dateStr);
      const checkInRec = dayRecs.find((r) => r.type === 'MASUK');
      if (checkInRec) {
        dailyStatusMap[dateStr] = checkInRec.status as 'HADIR' | 'TERLAMBAT';
      } else {
        const permitRec = dayRecs.find((r) => ['IZIN', 'SAKIT', 'ALPA'].includes(r.status));
        if (permitRec) {
          dailyStatusMap[dateStr] = permitRec.status as 'IZIN' | 'SAKIT' | 'ALPA';
        } else {
          dailyStatusMap[dateStr] = 'ALPA';
        }
      }
    });

    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    Object.values(dailyStatusMap).forEach((st) => {
      if (st === 'HADIR') hadir++;
      else if (st === 'TERLAMBAT') terlambat++;
      else if (st === 'IZIN') izin++;
      else if (st === 'SAKIT') sakit++;
      else if (st === 'ALPA') alpa++;
    });

    const totalMasuk = hadir + terlambat;
    const attendancePercent =
      effectiveDaysCount > 0 ? Math.round((totalMasuk / effectiveDaysCount) * 100) : 0;

    return {
      student,
      dailyStatusMap,
      hadir,
      terlambat,
      izin,
      sakit,
      alpa,
      totalMasuk,
      effectiveDaysCount,
      attendancePercent,
      rating: getAttendanceRating(attendancePercent),
    };
  });

  const lines: string[] = [];
  let headers: string[] = [];
  const rows: string[][] = [];
  let fileName = '';

  const cleanSchoolName = config.schoolName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const classLabel = selectedClass === 'ALL' ? 'Semua_Kelas' : `Kelas_${selectedClass.replace(/\s+/g, '_')}`;

  // ==========================================
  // FORMAT 1: MATRIKS BULANAN (TANGGAL 1 - 31)
  // ==========================================
  if (format === 'matrix') {
    fileName = `Laporan_Matriks_Presensi_Bulanan_${cleanSchoolName}_${monthName}_${year}_${classLabel}.csv`;

    // 1. Metadata Header for Education Agency
    if (includeHeaderMetadata) {
      lines.push(`# =========================================================================`);
      lines.push(`# PEMERINTAH PROVINSI MALUKU - DINAS PENDIDIKAN DAN KEBUDAYAAN`);
      lines.push(`# LAPORAN MATRIKS REKAPITULASI PRESENSI SISWA (STANDAR DAPODIK / BUKU ABSENSI)`);
      lines.push(`# =========================================================================`);
      lines.push(`# Nama Sekolah    : ${config.schoolName}`);
      lines.push(`# NPSN            : ${config.schoolNpsn}`);
      lines.push(`# Periode         : ${monthName} ${year} (${effectiveDaysCount} Hari Efektif Belajar)`);
      lines.push(`# Rombel / Kelas  : ${selectedClass === 'ALL' ? 'Seluruh Rombongan Belajar' : selectedClass}`);
      lines.push(`# Tahun Pelajaran : ${config.academicYear}`);
      lines.push(`# Kepala Sekolah  : ${config.principalName || '-'} (NIP: ${config.principalNip || '-'})`);
      lines.push(`# Waktu Unduh     : ${new Date().toLocaleString('id-ID')}`);
      lines.push(`# Keterangan Kode : [H] Hadir | [T] Terlambat | [S] Sakit | [I] Izin | [A] Alpa | [-] Libur`);
      lines.push(`# =========================================================================`);
      lines.push('');
    }

    // 2. Table Headers
    const dateHeaders = monthDays.map((d) => `Tgl_${String(d.dayNum).padStart(2, '0')}`);
    headers = [
      'No',
      'NIS',
      'NISN',
      'Nama_Siswa',
      'Kelas',
      'Jenis_Kelamin',
      ...dateHeaders,
      'Hadir_H',
      'Terlambat_T',
      'Sakit_S',
      'Izin_I',
      'Alpa_A',
      'Total_Masuk',
      'Hari_Efektif',
      'Persentase_Kehadiran',
      'Kategori_Keaktifan',
    ];

    // 3. Data Rows
    studentRecaps.forEach((sr, idx) => {
      const dayCells = monthDays.map((d) => {
        if (d.isSunday) return '-';
        const st = sr.dailyStatusMap[d.date];
        if (!st) return 'A';
        if (st === 'HADIR') return 'H';
        if (st === 'TERLAMBAT') return 'T';
        if (st === 'SAKIT') return 'S';
        if (st === 'IZIN') return 'I';
        return 'A';
      });

      const rowValues = [
        String(idx + 1),
        escapeCsvCell(sr.student.nis, delimiter, excelSafeNumbers),
        escapeCsvCell(sr.student.nisn, delimiter, excelSafeNumbers),
        escapeCsvCell(sr.student.name, delimiter),
        escapeCsvCell(sr.student.className, delimiter),
        escapeCsvCell(sr.student.gender, delimiter),
        ...dayCells.map((c) => escapeCsvCell(c, delimiter)),
        String(sr.hadir),
        String(sr.terlambat),
        String(sr.sakit),
        String(sr.izin),
        String(sr.alpa),
        String(sr.totalMasuk),
        String(sr.effectiveDaysCount),
        `${sr.attendancePercent}%`,
        escapeCsvCell(sr.rating, delimiter),
      ];

      rows.push(rowValues);
    });

    // 4. Summary Footer Row
    if (includeSummaryFooter && studentRecaps.length > 0) {
      const totalHadir = studentRecaps.reduce((sum, r) => sum + r.hadir, 0);
      const totalTerlambat = studentRecaps.reduce((sum, r) => sum + r.terlambat, 0);
      const totalSakit = studentRecaps.reduce((sum, r) => sum + r.sakit, 0);
      const totalIzin = studentRecaps.reduce((sum, r) => sum + r.izin, 0);
      const totalAlpa = studentRecaps.reduce((sum, r) => sum + r.alpa, 0);
      const totalMasuk = totalHadir + totalTerlambat;
      const totalPossible = studentRecaps.length * effectiveDaysCount;
      const avgPercent = totalPossible > 0 ? Math.round((totalMasuk / totalPossible) * 100) : 0;

      const emptyDayCells = monthDays.map(() => '""');
      const footerRow = [
        '"TOTAL / RATA-RATA"',
        '""',
        '""',
        `"Total ${studentRecaps.length} Siswa"`,
        '""',
        '""',
        ...emptyDayCells,
        String(totalHadir),
        String(totalTerlambat),
        String(totalSakit),
        String(totalIzin),
        String(totalAlpa),
        String(totalMasuk),
        String(effectiveDaysCount),
        `"${avgPercent}%"`,
        `"${getAttendanceRating(avgPercent)}"`,
      ];
      rows.push(footerRow);
    }
  }

  // ==========================================
  // FORMAT 2: REKAPITULASI AGREGAT PER SISWA
  // ==========================================
  else if (format === 'summary') {
    fileName = `Laporan_Rekap_Bulanan_Dinas_${cleanSchoolName}_${monthName}_${year}_${classLabel}.csv`;

    if (includeHeaderMetadata) {
      lines.push(`# =========================================================================`);
      lines.push(`# PEMERINTAH PROVINSI MALUKU - DINAS PENDIDIKAN DAN KEBUDAYAAN`);
      lines.push(`# LAPORAN REKAPITULASI KEHADIRAN BULANAN SISWA (FORMAT DINAS PENDIDIKAN)`);
      lines.push(`# =========================================================================`);
      lines.push(`# Satuan Pendidikan : ${config.schoolName}`);
      lines.push(`# NPSN              : ${config.schoolNpsn}`);
      lines.push(`# Bulan / Tahun     : ${monthName} ${year}`);
      lines.push(`# Hari Efektif      : ${effectiveDaysCount} Hari`);
      lines.push(`# Rombongan Belajar : ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}`);
      lines.push(`# Tahun Ajaran      : ${config.academicYear}`);
      lines.push(`# Kepala Sekolah    : ${config.principalName || '-'} (NIP: ${config.principalNip || '-'})`);
      lines.push(`# =========================================================================`);
      lines.push('');
    }

    headers = [
      'No',
      'NIS',
      'NISN',
      'Nama_Siswa',
      'Kelas',
      'L_P',
      'Hari_Efektif',
      'Hadir_H',
      'Terlambat_T',
      'Sakit_S',
      'Izin_I',
      'Alpa_A',
      'Total_Masuk_H_T',
      'Persen_Kehadiran',
      'Status_Ketercapaian',
      'Catatan_Evaluasi_Dinas',
    ];

    studentRecaps.forEach((sr, idx) => {
      let notes = 'Kehadiran Memenuhi Standar';
      if (sr.alpa >= 3) {
        notes = 'Peringatan: Alpa >= 3 Hari (Perlu Tindak Lanjut Wali Kelas)';
      } else if (sr.attendancePercent < 75) {
        notes = 'Kehadiran di Bawah Ambang Batas 75%';
      } else if (sr.attendancePercent === 100) {
        notes = 'Apresiasi: Kehadiran Sempurna (100%)';
      }

      const rowValues = [
        String(idx + 1),
        escapeCsvCell(sr.student.nis, delimiter, excelSafeNumbers),
        escapeCsvCell(sr.student.nisn, delimiter, excelSafeNumbers),
        escapeCsvCell(sr.student.name, delimiter),
        escapeCsvCell(sr.student.className, delimiter),
        escapeCsvCell(sr.student.gender, delimiter),
        String(sr.effectiveDaysCount),
        String(sr.hadir),
        String(sr.terlambat),
        String(sr.sakit),
        String(sr.izin),
        String(sr.alpa),
        String(sr.totalMasuk),
        `${sr.attendancePercent}%`,
        escapeCsvCell(sr.rating, delimiter),
        escapeCsvCell(notes, delimiter),
      ];
      rows.push(rowValues);
    });

    if (includeSummaryFooter && studentRecaps.length > 0) {
      const totalHadir = studentRecaps.reduce((sum, r) => sum + r.hadir, 0);
      const totalTerlambat = studentRecaps.reduce((sum, r) => sum + r.terlambat, 0);
      const totalSakit = studentRecaps.reduce((sum, r) => sum + r.sakit, 0);
      const totalIzin = studentRecaps.reduce((sum, r) => sum + r.izin, 0);
      const totalAlpa = studentRecaps.reduce((sum, r) => sum + r.alpa, 0);
      const totalMasuk = totalHadir + totalTerlambat;
      const totalPossible = studentRecaps.length * effectiveDaysCount;
      const avgPercent = totalPossible > 0 ? Math.round((totalMasuk / totalPossible) * 100) : 0;

      rows.push([
        '"TOTAL KESELURUHAN"',
        '""',
        '""',
        `"${studentRecaps.length} Siswa Terdaftar"`,
        '""',
        '""',
        String(effectiveDaysCount),
        String(totalHadir),
        String(totalTerlambat),
        String(totalSakit),
        String(totalIzin),
        String(totalAlpa),
        String(totalMasuk),
        `"${avgPercent}%"`,
        `"${getAttendanceRating(avgPercent)}"`,
        `"Rata-rata Sekolah: ${avgPercent}%"`,
      ]);
    }
  }

  // ==========================================
  // FORMAT 3: REKAP EKSEKUTIF PER ROMBEL
  // ==========================================
  else if (format === 'class_summary') {
    fileName = `Laporan_Eksekutif_Per_Kelas_${cleanSchoolName}_${monthName}_${year}.csv`;

    if (includeHeaderMetadata) {
      lines.push(`# =========================================================================`);
      lines.push(`# PEMERINTAH PROVINSI MALUKU - DINAS PENDIDIKAN DAN KEBUDAYAAN`);
      lines.push(`# LAPORAN EKSEKUTIF PRESENSI PER ROMBONGAN BELAJAR (PENGAWAS SEKOLAH)`);
      lines.push(`# =========================================================================`);
      lines.push(`# Satuan Pendidikan : ${config.schoolName}`);
      lines.push(`# NPSN              : ${config.schoolNpsn}`);
      lines.push(`# Periode           : ${monthName} ${year} (${effectiveDaysCount} Hari Efektif)`);
      lines.push(`# =========================================================================`);
      lines.push('');
    }

    headers = [
      'No',
      'Rombel_Kelas',
      'Jumlah_Laki_Laki',
      'Jumlah_Perempuan',
      'Total_Siswa',
      'Hari_Efektif',
      'Total_Hadir',
      'Total_Terlambat',
      'Total_Sakit',
      'Total_Izin',
      'Total_Alpa',
      'Total_Presensi_Masuk',
      'Rata_Rata_Persen_Kehadiran',
      'Tingkat_Keaktifan_Rombel',
    ];

    const uniqueClasses = Array.from(new Set(filteredStudents.map((s) => s.className))).sort();

    uniqueClasses.forEach((clsName, idx) => {
      const clsRecaps = studentRecaps.filter((r) => r.student.className === clsName);
      const maleCount = clsRecaps.filter((r) => r.student.gender === 'L').length;
      const femaleCount = clsRecaps.filter((r) => r.student.gender === 'P').length;
      const totalStudentsInClass = clsRecaps.length;

      const clsHadir = clsRecaps.reduce((sum, r) => sum + r.hadir, 0);
      const clsTerlambat = clsRecaps.reduce((sum, r) => sum + r.terlambat, 0);
      const clsSakit = clsRecaps.reduce((sum, r) => sum + r.sakit, 0);
      const clsIzin = clsRecaps.reduce((sum, r) => sum + r.izin, 0);
      const clsAlpa = clsRecaps.reduce((sum, r) => sum + r.alpa, 0);
      const clsMasuk = clsHadir + clsTerlambat;

      const totalSlots = totalStudentsInClass * effectiveDaysCount;
      const clsAvgPercent = totalSlots > 0 ? Math.round((clsMasuk / totalSlots) * 100) : 0;

      rows.push([
        String(idx + 1),
        escapeCsvCell(clsName, delimiter),
        String(maleCount),
        String(femaleCount),
        String(totalStudentsInClass),
        String(effectiveDaysCount),
        String(clsHadir),
        String(clsTerlambat),
        String(clsSakit),
        String(clsIzin),
        String(clsAlpa),
        String(clsMasuk),
        `${clsAvgPercent}%`,
        escapeCsvCell(getAttendanceRating(clsAvgPercent), delimiter),
      ]);
    });

    if (includeSummaryFooter && uniqueClasses.length > 0) {
      const totalMale = studentRecaps.filter((r) => r.student.gender === 'L').length;
      const totalFemale = studentRecaps.filter((r) => r.student.gender === 'P').length;
      const totalAll = studentRecaps.length;
      const totalHadir = studentRecaps.reduce((sum, r) => sum + r.hadir, 0);
      const totalTerlambat = studentRecaps.reduce((sum, r) => sum + r.terlambat, 0);
      const totalSakit = studentRecaps.reduce((sum, r) => sum + r.sakit, 0);
      const totalIzin = studentRecaps.reduce((sum, r) => sum + r.izin, 0);
      const totalAlpa = studentRecaps.reduce((sum, r) => sum + r.alpa, 0);
      const totalMasuk = totalHadir + totalTerlambat;
      const totalSlots = totalAll * effectiveDaysCount;
      const avgAll = totalSlots > 0 ? Math.round((totalMasuk / totalSlots) * 100) : 0;

      rows.push([
        '"TOTAL SEMUA ROMBEL"',
        `"${uniqueClasses.length} Rombel"`,
        String(totalMale),
        String(totalFemale),
        String(totalAll),
        String(effectiveDaysCount),
        String(totalHadir),
        String(totalTerlambat),
        String(totalSakit),
        String(totalIzin),
        String(totalAlpa),
        String(totalMasuk),
        `"${avgAll}%"`,
        `"${getAttendanceRating(avgAll)}"`,
      ]);
    }
  }

  // ==========================================
  // FORMAT 4: DETAIL LOG TRANSAKSI HARIAN
  // ==========================================
  else if (format === 'logs') {
    fileName = `Log_Detail_Presensi_${cleanSchoolName}_${monthName}_${year}_${classLabel}.csv`;

    if (includeHeaderMetadata) {
      lines.push(`# =========================================================================`);
      lines.push(`# LOG TRANSAKSI DETAIL PRESENSI SISWA - BULAN ${monthName.toUpperCase()} ${year}`);
      lines.push(`# Satuan Pendidikan : ${config.schoolName} (NPSN: ${config.schoolNpsn})`);
      lines.push(`# Filter Kelas      : ${selectedClass}`);
      lines.push(`# =========================================================================`);
      lines.push('');
    }

    headers = [
      'No',
      'Tanggal',
      'Waktu_Scan',
      'NIS',
      'NISN',
      'Nama_Siswa',
      'Kelas',
      'L_P',
      'Tipe_Presensi',
      'Status_Kehadiran',
      'Keterangan',
    ];

    const monthDates = monthDays.map((d) => d.date);
    const monthFilteredRecords = records
      .filter(
        (r) =>
          monthDates.includes(r.date) &&
          (selectedClass === 'ALL' || r.studentClass === selectedClass)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    monthFilteredRecords.forEach((r, idx) => {
      rows.push([
        String(idx + 1),
        escapeCsvCell(r.date, delimiter),
        escapeCsvCell(r.time, delimiter),
        escapeCsvCell(r.studentNis, delimiter, excelSafeNumbers),
        escapeCsvCell(r.studentNisn, delimiter, excelSafeNumbers),
        escapeCsvCell(r.studentName, delimiter),
        escapeCsvCell(r.studentClass, delimiter),
        escapeCsvCell(r.gender || '-', delimiter),
        escapeCsvCell(r.type, delimiter),
        escapeCsvCell(r.status, delimiter),
        escapeCsvCell(r.note || '-', delimiter),
      ]);
    });
  }

  // Format the header row
  const headerLine = headers.join(delimiter);
  lines.push(headerLine);

  // Format all data rows
  rows.forEach((row) => {
    lines.push(row.join(delimiter));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');

  return {
    csvContent,
    fileName,
    totalRows: rows.length,
    totalColumns: headers.length,
    headers,
    sampleRows: rows.slice(0, 5),
  };
};

/**
 * Triggers automatic browser file download of CSV content
 */
export const downloadCsvFile = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copies the CSV string to user's clipboard
 */
export const copyCsvToClipboard = async (csvContent: string): Promise<boolean> => {
  try {
    // Remove the UTF-8 BOM if copying to clipboard
    const cleanContent = csvContent.startsWith('\uFEFF') ? csvContent.slice(1) : csvContent;
    await navigator.clipboard.writeText(cleanContent);
    return true;
  } catch (err) {
    console.error('Failed to copy CSV to clipboard:', err);
    return false;
  }
};
