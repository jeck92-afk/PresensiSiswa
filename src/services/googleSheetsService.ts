import { Student, AttendanceRecord, SchoolConfig, Gender, AttendanceStatus, AttendanceType } from '../types';
import { getAccessToken } from './googleAuth';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  lastSynced?: string;
  autoSync: boolean;
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  // Check if it's a full Google Sheets URL
  // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Otherwise return as raw ID
  return trimmed;
}

/**
 * Validates access to a spreadsheet and returns its title and sheet names.
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string
): Promise<{ success: boolean; title?: string; sheets?: string[]; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Sesi Google belum aktif. Silakan masuk dengan Google.' };
  }

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error?.message || `Gagal mengakses spreadsheet (Status ${res.status})`,
      };
    }

    const data = await res.json();
    const sheetNames = (data.sheets || []).map((s: { properties?: { title?: string } }) => s.properties?.title || '');
    return {
      success: true,
      title: data.properties?.title || 'Spreadsheet Presensi',
      sheets: sheetNames,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Kesalahan jaringan saat menghubungi Google Sheets',
    };
  }
}

/**
 * Creates a brand new structured Google Spreadsheet in the user's Google Drive.
 */
export async function createAttendanceSpreadsheet(
  title: string,
  config: SchoolConfig,
  students: Student[],
  records: AttendanceRecord[]
): Promise<{ success: boolean; spreadsheetId?: string; spreadsheetUrl?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak ditemukan. Silakan masuk terlebih dahulu.' };
  }

  try {
    // 1. Create spreadsheet with sheets
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title || `Presensi Digital - ${config.schoolName}`,
        },
        sheets: [
          { properties: { title: 'DATA_SISWA', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'REKAP_PRESENSI', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'KONFIGURASI', gridProperties: { frozenRowCount: 1 } } },
        ],
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error?.message || `Gagal membuat spreadsheet baru (Status ${createRes.status})`,
      };
    }

    const createdData = await createRes.json();
    const spreadsheetId = createdData.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Populate sheets with headers and initial data
    await pushAllDataToSpreadsheet(spreadsheetId, students, records, config);

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal membuat Google Spreadsheet',
    };
  }
}

/**
 * Push all data (Students, Attendance Records, and Config) to the Google Spreadsheet.
 */
export async function pushAllDataToSpreadsheet(
  spreadsheetId: string,
  students: Student[],
  records: AttendanceRecord[],
  config?: SchoolConfig
): Promise<{ success: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Sesi Google belum aktif. Silakan masuk terlebih dahulu.' };
  }

  try {
    // Check if sheets exist, create them if missing
    const details = await getSpreadsheetDetails(spreadsheetId);
    if (!details.success) {
      return { success: false, error: details.error };
    }

    const existingSheets = details.sheets || [];
    const missingSheets: string[] = [];
    if (!existingSheets.includes('DATA_SISWA')) missingSheets.push('DATA_SISWA');
    if (!existingSheets.includes('REKAP_PRESENSI')) missingSheets.push('REKAP_PRESENSI');
    if (config && !existingSheets.includes('KONFIGURASI')) missingSheets.push('KONFIGURASI');

    if (missingSheets.length > 0) {
      // Add missing sheets via batchUpdate
      const requests = missingSheets.map((sTitle) => ({
        addSheet: {
          properties: {
            title: sTitle,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      }));

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }

    // Prepare DATA_SISWA rows
    const studentHeaders = [
      'ID_SISWA',
      'NISN',
      'NIS',
      'NAMA_LENGKAP',
      'JENIS_KELAMIN',
      'KELAS',
      'NO_HP_ORANG_TUA',
      'TANGGAL_LAHIR',
      'ALAMAT',
    ];

    const studentRows = students.map((s) => [
      s.id,
      s.nisn,
      s.nis,
      s.name,
      s.gender,
      s.className,
      s.parentPhone || '',
      s.birthDate || '',
      s.address || '',
    ]);

    // Prepare REKAP_PRESENSI rows
    const recordHeaders = [
      'ID_RECORD',
      'TANGGAL',
      'WAKTU',
      'NISN',
      'NIS',
      'NAMA_SISWA',
      'KELAS',
      'JENIS_KELAMIN',
      'TIPE_PRESENSI',
      'STATUS_KEHADIRAN',
      'KETERANGAN',
      'TIMESTAMP',
    ];

    const recordRows = records.map((r) => [
      r.id,
      r.date,
      r.time,
      r.studentNisn,
      r.studentNis,
      r.studentName,
      r.studentClass,
      r.gender,
      r.type,
      r.status,
      r.note || '',
      r.timestamp,
    ]);

    const batchData: Array<{ range: string; values: (string | number)[][] }> = [
      {
        range: 'DATA_SISWA!A1:I',
        values: [studentHeaders, ...studentRows],
      },
      {
        range: 'REKAP_PRESENSI!A1:L',
        values: [recordHeaders, ...recordRows],
      },
    ];

    if (config) {
      const configRows = [
        ['PARAMETER', 'NILAI'],
        ['NAMA_SEKOLAH', config.schoolName],
        ['NPSN', config.schoolNpsn],
        ['ALAMAT_SEKOLAH', config.schoolAddress],
        ['KEPALA_SEKOLAH', config.principalName],
        ['NIP_KEPALA_SEKOLAH', config.principalNip || ''],
        ['TAHUN_AJARAN', config.academicYear],
        ['BATAS_JAM_MASUK', config.checkInDeadline],
        ['MULAI_JAM_PULANG', config.checkOutStart],
      ];
      batchData.push({
        range: 'KONFIGURASI!A1:B',
        values: configRows,
      });
    }

    // Clear old contents first to prevent stale rows
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DATA_SISWA!A1:Z:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/REKAP_PRESENSI!A1:Z:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    // Write all data via batchUpdate
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: batchData,
        }),
      }
    );

    if (!updateRes.ok) {
      const errJson = await updateRes.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error?.message || 'Gagal menyimpan data ke Spreadsheet',
      };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal mengirim data ke Google Sheets',
    };
  }
}

/**
 * Real-time append of a single attendance record to REKAP_PRESENSI sheet.
 */
export async function appendAttendanceToSpreadsheet(
  spreadsheetId: string,
  record: AttendanceRecord
): Promise<{ success: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Sesi Google tidak aktif' };
  }

  try {
    const rowValues = [
      record.id,
      record.date,
      record.time,
      record.studentNisn,
      record.studentNis,
      record.studentName,
      record.studentClass,
      record.gender,
      record.type,
      record.status,
      record.note || '',
      record.timestamp,
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/REKAP_PRESENSI!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error?.message || `Gagal mencatat baris (Status ${res.status})` };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal append baris ke Google Sheets',
    };
  }
}

/**
 * Pull and parse Students and Attendance Records from Google Sheets.
 */
export async function pullDataFromSpreadsheet(
  spreadsheetId: string
): Promise<{
  success: boolean;
  students?: Student[];
  records?: AttendanceRecord[];
  config?: Partial<SchoolConfig>;
  error?: string;
}> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token Google tidak ditemukan. Masuk dengan Google terlebih dahulu.' };
  }

  try {
    // 1. Fetch DATA_SISWA
    const studentRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DATA_SISWA!A1:I5000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let parsedStudents: Student[] = [];
    if (studentRes.ok) {
      const sData = await studentRes.json();
      const sRows: string[][] = sData.values || [];
      if (sRows.length > 1) {
        // Skip header row
        parsedStudents = sRows.slice(1).map((row, idx) => {
          const id = row[0] || `STD-${1000 + idx + 1}`;
          const nisn = row[1] || '';
          const nis = row[2] || '';
          const name = row[3] || `Siswa ${idx + 1}`;
          const gender = (row[4]?.toUpperCase() === 'P' ? 'P' : 'L') as Gender;
          const className = row[5] || 'Umum';
          const parentPhone = row[6] || '';
          const birthDate = row[7] || '';
          const address = row[8] || '';

          return {
            id,
            nisn,
            nis,
            name,
            gender,
            className,
            parentPhone,
            birthDate,
            address,
          };
        }).filter(s => s.name.trim() !== '');
      }
    }

    // 2. Fetch REKAP_PRESENSI
    const recordRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/REKAP_PRESENSI!A1:L10000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let parsedRecords: AttendanceRecord[] = [];
    if (recordRes.ok) {
      const rData = await recordRes.json();
      const rRows: string[][] = rData.values || [];
      if (rRows.length > 1) {
        parsedRecords = rRows.slice(1).map((row, idx) => {
          const id = row[0] || `REC-${Date.now()}-${idx}`;
          const date = row[1] || new Date().toISOString().split('T')[0];
          const time = row[2] || '07:00:00';
          const studentNisn = row[3] || '';
          const studentNis = row[4] || '';
          const studentName = row[5] || 'Siswa';
          const studentClass = row[6] || '';
          const gender = (row[7]?.toUpperCase() === 'P' ? 'P' : 'L') as Gender;
          const type = (row[8]?.toUpperCase() === 'PULANG' ? 'PULANG' : 'MASUK') as AttendanceType;
          const status = (['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'].includes(row[9]?.toUpperCase() || '')
            ? row[9].toUpperCase()
            : 'HADIR') as AttendanceStatus;
          const note = row[10] || '';
          const timestamp = Number(row[11]) || Date.now();

          return {
            id,
            studentId: studentNis || id,
            studentNis,
            studentNisn,
            studentName,
            studentClass,
            gender,
            date,
            time,
            type,
            status,
            note,
            timestamp,
          };
        }).filter(r => r.studentName.trim() !== '');
      }
    }

    return {
      success: true,
      students: parsedStudents,
      records: parsedRecords,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal menarik data dari Google Sheets',
    };
  }
}
