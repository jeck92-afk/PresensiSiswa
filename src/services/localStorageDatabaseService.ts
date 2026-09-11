import {
  Student,
  AttendanceRecord,
  SchoolConfig,
  Teacher,
  SchoolClass,
  SubjectItem,
  ScheduleItem,
  TeacherJournal,
  AdminAccount,
} from '../types';
import { normalizeClassName } from '../data/initialData';

export const STORAGE_KEYS = {
  CONFIG: 'presensi_qr_config',
  STUDENTS: 'presensi_qr_students',
  RECORDS: 'presensi_qr_records',
  TEACHERS: 'presensi_qr_teachers',
  CLASSES: 'presensi_qr_classes',
  SUBJECTS: 'presensi_qr_subjects',
  SCHEDULES: 'presensi_qr_schedules',
  JOURNALS: 'presensi_qr_journals',
  SPREADSHEET: 'presensi_spreadsheet_info',
  ADMIN_SESSION: 'presensi_admin_session',
  ADMIN_ACCOUNTS: 'presensi_admin_accounts',
  DARK_MODE: 'presensi_dark_mode',
  LAST_BACKUP: 'presensi_last_backup_timestamp',
} as const;

export interface DatabaseTableMeta {
  key: string;
  tableId: string;
  name: string;
  description: string;
  count: number;
  sizeBytes: number;
  sizeFormatted: string;
  badgeColor: string;
}

export interface DatabaseStats {
  totalBytes: number;
  totalBytesFormatted: string;
  estimatedQuotaBytes: number;
  percentUsed: number;
  totalRecords: number;
  tables: DatabaseTableMeta[];
  lastBackupDate: string | null;
}

export interface FullDatabaseBackup {
  version: string;
  appName: string;
  exportDate: string;
  timestamp: number;
  schoolName: string;
  schoolNpsn: string;
  recordsCount: {
    students: number;
    records: number;
    teachers: number;
    classes: number;
    subjects: number;
    schedules: number;
    journals: number;
  };
  data: {
    config?: SchoolConfig;
    students?: Student[];
    records?: AttendanceRecord[];
    teachers?: Teacher[];
    classes?: SchoolClass[];
    subjects?: SubjectItem[];
    schedules?: ScheduleItem[];
    journals?: TeacherJournal[];
    spreadsheetInfo?: any;
    adminAccounts?: AdminAccount[];
  };
}

/**
 * Format bytes into readable KB / MB
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get accurate size of a string in bytes (UTF-8 encoding length)
 */
function getStringByteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Inspects all application tables in Local Storage and returns statistics
 */
export function getDatabaseStats(): DatabaseStats {
  const estimatedQuotaBytes = 5 * 1024 * 1024; // Standard 5MB local storage quota
  let totalBytes = 0;
  let totalRecords = 0;

  const tableDefinitions = [
    {
      key: STORAGE_KEYS.STUDENTS,
      tableId: 'students',
      name: 'Tabel Siswa',
      description: 'Data profil, NIS, NISN, kelas, dan kontak orang tua siswa',
      badgeColor: 'blue',
    },
    {
      key: STORAGE_KEYS.RECORDS,
      tableId: 'records',
      name: 'Tabel Log Presensi',
      description: 'Riwayat scan QR kehadiran masuk dan pulang harian',
      badgeColor: 'emerald',
    },
    {
      key: STORAGE_KEYS.TEACHERS,
      tableId: 'teachers',
      name: 'Tabel Pendidik & Guru',
      description: 'Daftar dewan guru, NIP, mata pelajaran, dan wali kelas',
      badgeColor: 'amber',
    },
    {
      key: STORAGE_KEYS.CLASSES,
      tableId: 'classes',
      name: 'Tabel Rombel & Kelas',
      description: 'Daftar kelas / rombongan belajar dan ruang kelas',
      badgeColor: 'indigo',
    },
    {
      key: STORAGE_KEYS.SUBJECTS,
      tableId: 'subjects',
      name: 'Tabel Mata Pelajaran',
      description: 'Struktur kurikulum, mapel wajib, peminatan, & muatan lokal',
      badgeColor: 'rose',
    },
    {
      key: STORAGE_KEYS.SCHEDULES,
      tableId: 'schedules',
      name: 'Tabel Jadwal Pelajaran',
      description: 'Jadwal mengajar harian, jam pelajaran, dan ruang kelas',
      badgeColor: 'purple',
    },
    {
      key: STORAGE_KEYS.JOURNALS,
      tableId: 'journals',
      name: 'Tabel Jurnal Guru (KBM)',
      description: 'Jurnal pelaksanaan pembelajaran, materi, dan kehadiran KBM',
      badgeColor: 'teal',
    },
    {
      key: STORAGE_KEYS.CONFIG,
      tableId: 'config',
      name: 'Tabel Konfigurasi Sekolah',
      description: 'Identitas sekolah, logo, kepala sekolah, dan pengaturan sistem',
      badgeColor: 'slate',
    },
    {
      key: STORAGE_KEYS.ADMIN_ACCOUNTS,
      tableId: 'adminAccounts',
      name: 'Tabel Akun Pengguna',
      description: 'Daftar akun administrator & peran pengguna aplikasi',
      badgeColor: 'cyan',
    },
  ];

  const tables: DatabaseTableMeta[] = tableDefinitions.map((def) => {
    let count = 0;
    let sizeBytes = 0;

    try {
      const raw = localStorage.getItem(def.key);
      if (raw) {
        sizeBytes = getStringByteSize(raw);
        totalBytes += sizeBytes;

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          count = parsed.length;
          totalRecords += count;
        } else if (typeof parsed === 'object' && parsed !== null) {
          count = 1;
        }
      }
    } catch (e) {
      console.warn(`Error reading key ${def.key} from localStorage:`, e);
    }

    return {
      key: def.key,
      tableId: def.tableId,
      name: def.name,
      description: def.description,
      count,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      badgeColor: def.badgeColor,
    };
  });

  // Calculate percentage used against standard browser quota
  const percentUsed = Math.min(100, Math.round((totalBytes / estimatedQuotaBytes) * 100 * 10) / 10);

  // Check last backup timestamp
  let lastBackupDate: string | null = null;
  try {
    const rawBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
    if (rawBackup) {
      const dt = new Date(parseInt(rawBackup, 10));
      if (!isNaN(dt.getTime())) {
        lastBackupDate = dt.toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      }
    }
  } catch (e) {
    console.error(e);
  }

  return {
    totalBytes,
    totalBytesFormatted: formatBytes(totalBytes),
    estimatedQuotaBytes,
    percentUsed,
    totalRecords,
    tables,
    lastBackupDate,
  };
}

/**
 * Creates a complete JSON backup of the entire local database
 */
export function generateDatabaseBackup(
  config: SchoolConfig,
  students: Student[],
  records: AttendanceRecord[],
  teachers: Teacher[],
  classes: SchoolClass[],
  subjects: SubjectItem[],
  schedules: ScheduleItem[],
  journals: TeacherJournal[],
  adminAccounts?: AdminAccount[]
): FullDatabaseBackup {
  const now = new Date();

  return {
    version: '2.0.0',
    appName: 'SIADIK - Sistem Informasi Absensi & Administrasi Pendidikan',
    exportDate: now.toISOString(),
    timestamp: now.getTime(),
    schoolName: config.schoolName || 'SMAN 1 Maluku',
    schoolNpsn: config.schoolNpsn || '60100000',
    recordsCount: {
      students: students.length,
      records: records.length,
      teachers: teachers.length,
      classes: classes.length,
      subjects: subjects.length,
      schedules: schedules.length,
      journals: journals.length,
    },
    data: {
      config,
      students,
      records,
      teachers,
      classes,
      subjects,
      schedules,
      journals,
      adminAccounts,
    },
  };
}

/**
 * Triggers a download of the full database JSON file
 */
export function downloadDatabaseBackupFile(backup: FullDatabaseBackup): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanSchoolName = backup.schoolName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `backup_basis_data_${cleanSchoolName}_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Record last backup timestamp
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, String(Date.now()));
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Validates an uploaded backup file
 */
export function validateBackupJson(rawJson: string): {
  valid: boolean;
  message: string;
  data?: FullDatabaseBackup;
} {
  try {
    const parsed = JSON.parse(rawJson);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, message: 'Format berkas JSON tidak valid.' };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return { valid: false, message: 'Berkas JSON tidak memiliki struktur basis data yang dikenali (field data kosong).' };
    }

    const data = parsed.data;
    const hasAnyTable =
      Array.isArray(data.students) ||
      Array.isArray(data.records) ||
      Array.isArray(data.teachers) ||
      Array.isArray(data.classes) ||
      Array.isArray(data.subjects) ||
      Array.isArray(data.schedules) ||
      Array.isArray(data.journals) ||
      data.config;

    if (!hasAnyTable) {
      return { valid: false, message: 'Berkas JSON tidak berisi tabel data yang dapat dipulihkan.' };
    }

    return {
      valid: true,
      message: 'Berkas cadangan basis data valid dan siap dipulihkan.',
      data: parsed as FullDatabaseBackup,
    };
  } catch (e: any) {
    return {
      valid: false,
      message: `Gagal membaca berkas JSON: ${e.message || 'Kesalahan sintaks JSON'}`,
    };
  }
}

/**
 * Optimizes the local database:
 * - Removes duplicate attendance records (same student, date, type)
 * - Removes orphaned attendance records
 * - Normalizes class names in students and records
 */
export function runDatabaseOptimization(
  students: Student[],
  records: AttendanceRecord[],
  classes: SchoolClass[]
): {
  cleanedDuplicates: number;
  cleanedOrphans: number;
  normalizedCount: number;
  optimizedStudents: Student[];
  optimizedRecords: AttendanceRecord[];
} {
  const validStudentIds = new Set(students.map((s) => s.id));
  const validStudentNis = new Set(students.map((s) => s.nis));

  // 1. Normalize student class names
  let normalizedCount = 0;
  const optimizedStudents = students.map((s) => {
    const normalizedClass = normalizeClassName(s.className);
    if (normalizedClass !== s.className) {
      normalizedCount++;
    }
    return {
      ...s,
      className: normalizedClass,
    };
  });

  // 2. Filter duplicate and orphaned records
  const seenKey = new Set<string>();
  let cleanedDuplicates = 0;
  let cleanedOrphans = 0;

  const optimizedRecords: AttendanceRecord[] = [];

  for (const r of records) {
    // Check if orphan
    const isKnownStudent = validStudentIds.has(r.studentId) || validStudentNis.has(r.studentNis);
    if (!isKnownStudent) {
      cleanedOrphans++;
      continue;
    }

    // Check duplicate: studentId + date + type
    const uniqueKey = `${r.studentId}_${r.date}_${r.type}`;
    if (seenKey.has(uniqueKey)) {
      cleanedDuplicates++;
      continue;
    }

    seenKey.add(uniqueKey);
    optimizedRecords.push({
      ...r,
      studentClass: normalizeClassName(r.studentClass),
    });
  }

  return {
    cleanedDuplicates,
    cleanedOrphans,
    normalizedCount,
    optimizedStudents,
    optimizedRecords,
  };
}
