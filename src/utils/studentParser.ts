import * as XLSX from 'xlsx';
import { Student, Gender } from '../types';

export interface ParsedStudentRow {
  rowNumber: number;
  data: Omit<Student, 'id'>;
  isValid: boolean;
  errors: string[];
  raw: Record<string, any>;
}

export interface ParseResult {
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  headersFound: string[];
}

// Helper to normalize header string for matching
const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Map unknown header keys to standard Student attributes
const findKeyForField = (
  row: Record<string, any>,
  targetField: 'name' | 'nis' | 'nisn' | 'className' | 'gender' | 'parentPhone' | 'birthDate' | 'address'
): any => {
  const patterns: Record<typeof targetField, string[]> = {
    name: ['nama', 'namasiswa', 'namalengkap', 'namapesertadidik', 'studentname', 'name', 'fullname'],
    nis: ['nis', 'noinduk', 'nomorinduk', 'nomorinduksiswa', 'nipd', 'nissekolah', 'studentid', 'id'],
    nisn: ['nisn', 'nonisn', 'nomorinduksiswanasional', 'nationalid'],
    className: ['kelas', 'rombel', 'rombonganbelajar', 'class', 'classname', 'tingkat', 'jurusan'],
    gender: ['jk', 'jeniskelamin', 'gender', 'lp', 'sex', 'kelamin'],
    parentPhone: ['nohp', 'nohpwali', 'telepon', 'notelepon', 'hp', 'phone', 'whatsapp', 'kontakwali', 'kontak'],
    birthDate: ['tgllahir', 'tanggallahir', 'tanggallahirsiswa', 'birthdate', 'dob'],
    address: ['alamat', 'alamatdomisili', 'tempattinggal', 'address'],
  };

  const fieldPatterns = patterns[targetField];

  for (const [key, value] of Object.entries(row)) {
    const normKey = normalizeHeader(key);
    if (fieldPatterns.some((pattern) => normKey === pattern || normKey.includes(pattern))) {
      return value;
    }
  }

  return undefined;
};

// Safe string converter that handles numbers, scientific notation, and empty values
const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // If Excel parsed number with .0 at the end
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  return str;
};

// Format Gender
const parseGender = (val: any): Gender => {
  const str = safeString(val).toUpperCase();
  if (str.startsWith('P') || str.includes('PEREMPUAN') || str.includes('WANITA') || str.includes('FEMALE')) {
    return 'P';
  }
  return 'L'; // default to L
};

export const parseStudentFile = async (file: File): Promise<ParseResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Berkas tidak memiliki sheet data yang dapat dibaca.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error('Berkas kosong atau tidak ditemukan baris data siswa.');
  }

  const headersFound = Object.keys(rawRows[0] || {});
  const validRows: ParsedStudentRow[] = [];
  const invalidRows: ParsedStudentRow[] = [];

  const seenNisSet = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header, data starts at row 2

    // Extract values with flexible heuristics
    const rawName = safeString(findKeyForField(row, 'name'));
    const rawNis = safeString(findKeyForField(row, 'nis'));
    const rawNisn = safeString(findKeyForField(row, 'nisn'));
    const rawClass = safeString(findKeyForField(row, 'className'));
    const rawGender = findKeyForField(row, 'gender');
    const rawPhone = safeString(findKeyForField(row, 'parentPhone'));
    const rawBirthDate = safeString(findKeyForField(row, 'birthDate'));
    const rawAddress = safeString(findKeyForField(row, 'address'));

    const errors: string[] = [];

    if (!rawName) {
      errors.push('Nama siswa kosong');
    }

    if (!rawNis) {
      errors.push('NIS kosong (wajib sebagai kode QR presensi)');
    } else if (seenNisSet.has(rawNis)) {
      errors.push(`NIS ${rawNis} duplikat di dalam berkas ini`);
    }

    if (!rawClass) {
      errors.push('Kelas belum ditentukan');
    }

    const studentData: Omit<Student, 'id'> = {
      name: rawName,
      nis: rawNis,
      nisn: rawNisn || `00${rawNis.padStart(8, '0')}`,
      className: rawClass || 'Kelas Umum',
      gender: parseGender(rawGender),
      parentPhone: rawPhone || undefined,
      birthDate: rawBirthDate || undefined,
      address: rawAddress || undefined,
    };

    if (rawNis) {
      seenNisSet.add(rawNis);
    }

    const parsedRow: ParsedStudentRow = {
      rowNumber,
      data: studentData,
      isValid: errors.length === 0,
      errors,
      raw: row,
    };

    if (parsedRow.isValid) {
      validRows.push(parsedRow);
    } else {
      invalidRows.push(parsedRow);
    }
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    totalRows: rawRows.length,
    validRows,
    invalidRows,
    headersFound,
  };
};

// Sample template dataset
const TEMPLATE_STUDENTS_SAMPLE = [
  {
    'Nama Lengkap': 'Ahmad Fauzi Ridwan',
    NIS: '24001',
    NISN: '0081234561',
    Kelas: 'X IPAS',
    'Jenis Kelamin (L/P)': 'L',
    'No HP Wali': '081234567890',
    'Tanggal Lahir': '2008-04-12',
    Alamat: 'Jl. Melati No. 12, Jakarta',
  },
  {
    'Nama Lengkap': 'Siti Aisyah Rahmawati',
    NIS: '24002',
    NISN: '0081234562',
    Kelas: 'X IPAS',
    'Jenis Kelamin (L/P)': 'P',
    'No HP Wali': '081234567891',
    'Tanggal Lahir': '2008-06-25',
    Alamat: 'Jl. Kenanga No. 5, Jakarta',
  },
  {
    'Nama Lengkap': 'Budi Pratama Wijaya',
    NIS: '24003',
    NISN: '0081234563',
    Kelas: 'XI IPAS',
    'Jenis Kelamin (L/P)': 'L',
    'No HP Wali': '081234567892',
    'Tanggal Lahir': '2008-01-19',
    Alamat: 'Jl. Mawar No. 8, Jakarta',
  },
  {
    'Nama Lengkap': 'Dewi Lestari Putri',
    NIS: '24004',
    NISN: '0081234564',
    Kelas: 'XI IPAS',
    'Jenis Kelamin (L/P)': 'P',
    'No HP Wali': '081234567893',
    'Tanggal Lahir': '2008-09-03',
    Alamat: 'Jl. Flamboyan No. 17, Jakarta',
  },
  {
    'Nama Lengkap': 'Eko Saputra',
    NIS: '24005',
    NISN: '0081234565',
    Kelas: 'XII IPAS',
    'Jenis Kelamin (L/P)': 'L',
    'No HP Wali': '081234567894',
    'Tanggal Lahir': '2007-11-14',
    Alamat: 'Jl. Dahlia No. 22, Jakarta',
  },
];

// Download Template Excel (.xlsx)
export const downloadStudentExcelTemplate = () => {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_STUDENTS_SAMPLE);

  // Set column widths
  ws['!cols'] = [
    { wch: 26 }, // Nama Lengkap
    { wch: 12 }, // NIS
    { wch: 16 }, // NISN
    { wch: 14 }, // Kelas
    { wch: 20 }, // Jenis Kelamin
    { wch: 18 }, // No HP Wali
    { wch: 16 }, // Tanggal Lahir
    { wch: 32 }, // Alamat
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  XLSX.writeFile(wb, 'Template_Data_Siswa_Presensi.xlsx');
};

// Download Template CSV (.csv)
export const downloadStudentCsvTemplate = () => {
  const headers = ['Nama Lengkap', 'NIS', 'NISN', 'Kelas', 'Jenis Kelamin (L/P)', 'No HP Wali', 'Tanggal Lahir', 'Alamat'];
  const rows = TEMPLATE_STUDENTS_SAMPLE.map((row) => [
    `"${row['Nama Lengkap']}"`,
    `"${row['NIS']}"`,
    `"${row['NISN']}"`,
    `"${row['Kelas']}"`,
    `"${row['Jenis Kelamin (L/P)']}"`,
    `"${row['No HP Wali']}"`,
    `"${row['Tanggal Lahir']}"`,
    `"${row['Alamat']}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Data_Siswa_Presensi.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
