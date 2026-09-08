import * as XLSX from 'xlsx';
import {
  Teacher,
  Student,
  SchoolClass,
  SubjectItem,
  ScheduleItem,
  TeacherJournal,
  TeacherJournalStatus,
  Gender,
} from '../types';

export interface ParsedItemRow<T> {
  rowNumber: number;
  data: T;
  isValid: boolean;
  errors: string[];
  raw: Record<string, any>;
}

export interface GenericParseResult<T> {
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: ParsedItemRow<T>[];
  invalidRows: ParsedItemRow<T>[];
  headersFound: string[];
}

// Helpers
export const normalizeHeaderKey = (header: string): string => {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

export const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  return str;
};

export const parseGenderValue = (val: any): Gender => {
  const str = safeString(val).toUpperCase();
  if (
    str.startsWith('P') ||
    str.includes('PEREMPUAN') ||
    str.includes('WANITA') ||
    str.includes('FEMALE')
  ) {
    return 'P';
  }
  return 'L';
};

export const findMatchingFieldValue = (
  row: Record<string, any>,
  possiblePatterns: string[]
): any => {
  for (const [key, value] of Object.entries(row)) {
    const normKey = normalizeHeaderKey(key);
    if (
      possiblePatterns.some(
        (pattern) => normKey === pattern || normKey.includes(pattern)
      )
    ) {
      return value;
    }
  }
  return undefined;
};

// Generic read workbook
const readWorkbookRows = async (file: File): Promise<{ rawRows: Record<string, any>[]; headersFound: string[] }> => {
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
    throw new Error('Berkas kosong atau tidak ditemukan baris data.');
  }

  const headersFound = Object.keys(rawRows[0] || {});
  return { rawRows, headersFound };
};

// Generic Download helper
const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadWorkbook = (data: Record<string, any>[], sheetName: string, fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, `${fileName}.xlsx`);
};

export const downloadCsv = (data: Record<string, any>[], fileName: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${fileName}.csv`);
};

// ==========================================
// 1. TEACHERS (DATA GURU)
// ==========================================
export type TeacherImportData = Omit<Teacher, 'id'>;

export const parseTeacherFile = async (file: File): Promise<GenericParseResult<TeacherImportData>> => {
  const { rawRows, headersFound } = await readWorkbookRows(file);
  const validRows: ParsedItemRow<TeacherImportData>[] = [];
  const invalidRows: ParsedItemRow<TeacherImportData>[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = safeString(findMatchingFieldValue(row, ['nama', 'namaguru', 'namalengkap', 'teachername', 'name']));
    const nip = safeString(findMatchingFieldValue(row, ['nip', 'nopegawai', 'nomorindukpegawai', 'idguru'])) || '-';
    const rawGender = findMatchingFieldValue(row, ['jk', 'jeniskelamin', 'gender', 'lp', 'sex']);
    const subject = safeString(findMatchingFieldValue(row, ['mapel', 'matapelajaran', 'subject', 'pengampu'])) || 'Tenaga Pendidik';
    const phone = safeString(findMatchingFieldValue(row, ['nohp', 'telepon', 'hp', 'phone', 'whatsapp', 'wa']));
    const email = safeString(findMatchingFieldValue(row, ['email', 'surel', 'mail']));
    const rawStatus = safeString(findMatchingFieldValue(row, ['status', 'statuskepegawaian', 'kepegawaian'])).toUpperCase();
    const homeroomClass = safeString(findMatchingFieldValue(row, ['walikelas', 'kelas', 'wali', 'rombel']));

    const errors: string[] = [];
    if (!name) {
      errors.push('Nama guru wajib diisi');
    }

    let status: 'PNS' | 'PPPK' | 'GTT' | 'Honor' = 'PNS';
    if (rawStatus.includes('PPPK')) status = 'PPPK';
    else if (rawStatus.includes('GTT')) status = 'GTT';
    else if (rawStatus.includes('HONOR') || rawStatus.includes('HONORER')) status = 'Honor';

    const teacherData: TeacherImportData = {
      name,
      nip,
      gender: parseGenderValue(rawGender),
      subject,
      phone: phone || '-',
      email: email || undefined,
      status,
      homeroomClass: homeroomClass || undefined,
    };

    const parsed: ParsedItemRow<TeacherImportData> = {
      rowNumber,
      data: teacherData,
      isValid: errors.length === 0,
      errors,
      raw: row,
    };

    if (parsed.isValid) validRows.push(parsed);
    else invalidRows.push(parsed);
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

export const downloadTeacherTemplate = (format: 'xlsx' | 'csv') => {
  const sampleData = [
    {
      'Nama Guru': 'Drs. Johanes Pattinama, M.Pd.',
      'NIP': '197508122001121002',
      'Jenis Kelamin (L/P)': 'L',
      'Mata Pelajaran': 'Matematika Peminatan',
      'No WhatsApp / HP': '081248901234',
      'Email': 'johanes.pattinama@sekolah.sch.id',
      'Status Kepegawaian (PNS/PPPK/GTT/Honor)': 'PNS',
      'Wali Kelas (Opsional)': 'XII MIPA 1',
    },
    {
      'Nama Guru': 'Maria Christina Wattimena, S.Pd.',
      'NIP': '198304152008012009',
      'Jenis Kelamin (L/P)': 'P',
      'Mata Pelajaran': 'Bahasa Indonesia',
      'No WhatsApp / HP': '085233445566',
      'Email': 'maria.wattimena@sekolah.sch.id',
      'Status Kepegawaian (PNS/PPPK/GTT/Honor)': 'PPPK',
      'Wali Kelas (Opsional)': 'XI MIPA 2',
    },
    {
      'Nama Guru': 'Frederik Soumokil, S.Kom.',
      'NIP': '-',
      'Jenis Kelamin (L/P)': 'L',
      'Mata Pelajaran': 'Informatika & TIK',
      'No WhatsApp / HP': '081388990011',
      'Email': 'frederik.s@sekolah.sch.id',
      'Status Kepegawaian (PNS/PPPK/GTT/Honor)': 'GTT',
      'Wali Kelas (Opsional)': 'X IPAS 1',
    },
  ];

  if (format === 'xlsx') {
    downloadWorkbook(sampleData, 'Data Guru', 'Template_Data_Guru_SIADIK');
  } else {
    downloadCsv(sampleData, 'Template_Data_Guru_SIADIK');
  }
};

// ==========================================
// 2. STUDENTS (DATA SISWA)
// ==========================================
export type StudentImportData = Omit<Student, 'id'>;

export const parseStudentFileDirect = async (file: File): Promise<GenericParseResult<StudentImportData>> => {
  const { rawRows, headersFound } = await readWorkbookRows(file);
  const validRows: ParsedItemRow<StudentImportData>[] = [];
  const invalidRows: ParsedItemRow<StudentImportData>[] = [];
  const seenNis = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = safeString(findMatchingFieldValue(row, ['nama', 'namasiswa', 'namalengkap', 'studentname', 'name']));
    const nis = safeString(findMatchingFieldValue(row, ['nis', 'noinduk', 'nomorinduk', 'studentid']));
    const nisn = safeString(findMatchingFieldValue(row, ['nisn', 'nonisn', 'nomorinduksiswanasional']));
    const className = safeString(findMatchingFieldValue(row, ['kelas', 'rombel', 'classname', 'tingkat']));
    const rawGender = findMatchingFieldValue(row, ['jk', 'jeniskelamin', 'gender', 'lp', 'sex']);
    const parentPhone = safeString(findMatchingFieldValue(row, ['nohp', 'nohportu', 'nohpwali', 'telepon', 'hp', 'wa', 'kontakwali']));
    const birthDate = safeString(findMatchingFieldValue(row, ['tgllahir', 'tanggallahir', 'birthdate', 'dob']));
    const address = safeString(findMatchingFieldValue(row, ['alamat', 'tempattinggal', 'domisili', 'address']));

    const errors: string[] = [];
    if (!name) errors.push('Nama siswa wajib diisi');
    if (!nis) errors.push('NIS wajib diisi sebagai identitas & QR');
    else if (seenNis.has(nis)) errors.push(`NIS ${nis} duplikat di berkas ini`);
    if (!className) errors.push('Kelas wajib diisi');

    if (nis) seenNis.add(nis);

    const studentData: StudentImportData = {
      name,
      nis,
      nisn: nisn || `00${nis.padStart(8, '0')}`,
      className: className || 'Kelas Umum',
      gender: parseGenderValue(rawGender),
      parentPhone: parentPhone || undefined,
      birthDate: birthDate || undefined,
      address: address || undefined,
    };

    const parsed: ParsedItemRow<StudentImportData> = {
      rowNumber,
      data: studentData,
      isValid: errors.length === 0,
      errors,
      raw: row,
    };

    if (parsed.isValid) validRows.push(parsed);
    else invalidRows.push(parsed);
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

export const downloadStudentTemplate = (format: 'xlsx' | 'csv') => {
  const sampleData = [
    {
      'NIS': '8901',
      'NISN': '0067890123',
      'Nama Siswa': 'Geraldine Matitaputty',
      'Kelas': 'X IPAS 1',
      'Jenis Kelamin (L/P)': 'P',
      'No HP / WhatsApp Ortu': '081248901122',
      'Tanggal Lahir (YYYY-MM-DD)': '2008-05-14',
      'Alamat': 'Jl. Sirimau No. 12, Ambon',
    },
    {
      'NIS': '8902',
      'NISN': '0067890124',
      'Nama Siswa': 'Samuel Leatemia',
      'Kelas': 'X IPAS 1',
      'Jenis Kelamin (L/P)': 'L',
      'No HP / WhatsApp Ortu': '085233448899',
      'Tanggal Lahir (YYYY-MM-DD)': '2008-09-22',
      'Alamat': 'Jl. Rijali No. 45, Ambon',
    },
    {
      'NIS': '8903',
      'NISN': '0067890125',
      'Nama Siswa': 'Beatrix Hitipeuw',
      'Kelas': 'XI MIPA 2',
      'Jenis Kelamin (L/P)': 'P',
      'No HP / WhatsApp Ortu': '081399887766',
      'Tanggal Lahir (YYYY-MM-DD)': '2007-11-03',
      'Alamat': 'Jl. Diponegoro No. 88, Ambon',
    },
  ];

  if (format === 'xlsx') {
    downloadWorkbook(sampleData, 'Data Siswa', 'Template_Data_Siswa_SIADIK');
  } else {
    downloadCsv(sampleData, 'Template_Data_Siswa_SIADIK');
  }
};

// ==========================================
// 3. PARENTS (DATA ORANG TUA / WALI)
// ==========================================
export interface ParentImportData {
  studentNis: string;
  studentName?: string;
  parentName: string;
  relation: 'Ayah' | 'Ibu' | 'Wali';
  parentPhone: string;
  address?: string;
  job?: string;
}

export const parseParentFile = async (file: File): Promise<GenericParseResult<ParentImportData>> => {
  const { rawRows, headersFound } = await readWorkbookRows(file);
  const validRows: ParsedItemRow<ParentImportData>[] = [];
  const invalidRows: ParsedItemRow<ParentImportData>[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const studentNis = safeString(findMatchingFieldValue(row, ['nis', 'nissiswa', 'noinduk', 'studentid']));
    const studentName = safeString(findMatchingFieldValue(row, ['namasiswa', 'namamurid', 'siswa', 'studentname']));
    const parentName = safeString(findMatchingFieldValue(row, ['namaortu', 'namaorangtua', 'namawali', 'parentname', 'nama']));
    const rawRelation = safeString(findMatchingFieldValue(row, ['hubungan', 'relasi', 'statuswali', 'relation'])).toLowerCase();
    const parentPhone = safeString(findMatchingFieldValue(row, ['nohp', 'nohportu', 'nohpwali', 'telepon', 'hp', 'wa', 'whatsapp', 'phone']));
    const address = safeString(findMatchingFieldValue(row, ['alamat', 'tempattinggal', 'domisili', 'address']));
    const job = safeString(findMatchingFieldValue(row, ['pekerjaan', 'job', 'profesi']));

    const errors: string[] = [];
    if (!studentNis && !studentName) {
      errors.push('NIS atau Nama Siswa wajib diisi untuk mengaitkan orang tua');
    }
    if (!parentPhone) {
      errors.push('Nomor WhatsApp / HP Orang Tua wajib diisi');
    }

    let relation: 'Ayah' | 'Ibu' | 'Wali' = 'Wali';
    if (rawRelation.includes('ayah') || rawRelation.includes('bapak')) relation = 'Ayah';
    else if (rawRelation.includes('ibu') || rawRelation.includes('mama')) relation = 'Ibu';

    const parentData: ParentImportData = {
      studentNis,
      studentName: studentName || undefined,
      parentName: parentName || 'Orang Tua / Wali',
      relation,
      parentPhone,
      address: address || undefined,
      job: job || undefined,
    };

    const parsed: ParsedItemRow<ParentImportData> = {
      rowNumber,
      data: parentData,
      isValid: errors.length === 0,
      errors,
      raw: row,
    };

    if (parsed.isValid) validRows.push(parsed);
    else invalidRows.push(parsed);
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

export const downloadParentTemplate = (format: 'xlsx' | 'csv') => {
  const sampleData = [
    {
      'NIS Siswa': '8901',
      'Nama Siswa': 'Geraldine Matitaputty',
      'Nama Orang Tua / Wali': 'Bpk. Ronald Matitaputty',
      'Hubungan (Ayah/Ibu/Wali)': 'Ayah',
      'No WhatsApp / HP Ortu': '081248901122',
      'Alamat Domisili': 'Jl. Sirimau No. 12, Ambon',
      'Pekerjaan': 'PNS Pemprov Maluku',
    },
    {
      'NIS Siswa': '8902',
      'Nama Siswa': 'Samuel Leatemia',
      'Nama Orang Tua / Wali': 'Ibu Grace Leatemia',
      'Hubungan (Ayah/Ibu/Wali)': 'Ibu',
      'No WhatsApp / HP Ortu': '085233448899',
      'Alamat Domisili': 'Jl. Rijali No. 45, Ambon',
      'Pekerjaan': 'Wiraswasta',
    },
  ];

  if (format === 'xlsx') {
    downloadWorkbook(sampleData, 'Data Orang Tua', 'Template_Data_Orang_Tua_SIADIK');
  } else {
    downloadCsv(sampleData, 'Template_Data_Orang_Tua_SIADIK');
  }
};

// ==========================================
// 4. CLASSES (DATA KELAS / ROMBEL)
// ==========================================
export type ClassImportData = Omit<SchoolClass, 'id'>;

export const parseClassFile = async (file: File, defaultAcademicYear: string = '2026/2027'): Promise<GenericParseResult<ClassImportData>> => {
  const { rawRows, headersFound } = await readWorkbookRows(file);
  const validRows: ParsedItemRow<ClassImportData>[] = [];
  const invalidRows: ParsedItemRow<ClassImportData>[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = safeString(findMatchingFieldValue(row, ['kelas', 'namakelas', 'rombel', 'classname', 'nama']));
    const rawGrade = safeString(findMatchingFieldValue(row, ['tingkat', 'grade', 'tingkatkelas']));
    const homeroomTeacher = safeString(findMatchingFieldValue(row, ['walikelas', 'guruwali', 'homeroomteacher', 'wali']));
    const homeroomTeacherPhone = safeString(findMatchingFieldValue(row, ['nohpwalikelas', 'nohpwali', 'teleponwali', 'hpwali', 'wa']));
    const roomNumber = safeString(findMatchingFieldValue(row, ['ruang', 'ruangan', 'room', 'nomorruang', 'roomnumber'])) || 'R. Teori';
    const academicYear = safeString(findMatchingFieldValue(row, ['tahunajaran', 'tahun', 'academicyear'])) || defaultAcademicYear;

    const errors: string[] = [];
    if (!name) {
      errors.push('Nama kelas wajib diisi (misal: X IPAS 1, XI MIPA 2)');
    }

    let grade: '10' | '11' | '12' = '10';
    if (rawGrade.includes('12') || rawGrade.includes('XII') || name.toUpperCase().startsWith('XII')) {
      grade = '12';
    } else if (rawGrade.includes('11') || rawGrade.includes('XI') || name.toUpperCase().startsWith('XI')) {
      grade = '11';
    }

    const classData: ClassImportData = {
      name,
      grade,
      homeroomTeacher: homeroomTeacher || 'Belum Ditentukan',
      homeroomTeacherPhone: homeroomTeacherPhone || undefined,
      roomNumber,
      academicYear,
    };

    const parsed: ParsedItemRow<ClassImportData> = {
      rowNumber,
      data: classData,
      isValid: errors.length === 0,
      errors,
      raw: row,
    };

    if (parsed.isValid) validRows.push(parsed);
    else invalidRows.push(parsed);
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

export const downloadClassTemplate = (format: 'xlsx' | 'csv') => {
  const sampleData = [
    {
      'Nama Kelas (Rombel)': 'X IPAS 1',
      'Tingkat (10/11/12)': '10',
      'Nama Wali Kelas': 'Frederik Soumokil, S.Kom.',
      'No HP / WA Wali Kelas': '081388990011',
      'Ruangan Belajar': 'Ruang 101 Lantai 1',
      'Tahun Ajaran': '2026/2027',
    },
    {
      'Nama Kelas (Rombel)': 'XI MIPA 2',
      'Tingkat (10/11/12)': '11',
      'Nama Wali Kelas': 'Maria Christina Wattimena, S.Pd.',
      'No HP / WA Wali Kelas': '085233445566',
      'Ruangan Belajar': 'Ruang 204 Lantai 2',
      'Tahun Ajaran': '2026/2027',
    },
    {
      'Nama Kelas (Rombel)': 'XII MIPA 1',
      'Tingkat (10/11/12)': '12',
      'Nama Wali Kelas': 'Drs. Johanes Pattinama, M.Pd.',
      'No HP / WA Wali Kelas': '081248901234',
      'Ruangan Belajar': 'Lab Fisika & Matematika',
      'Tahun Ajaran': '2026/2027',
    },
  ];

  if (format === 'xlsx') {
    downloadWorkbook(sampleData, 'Data Kelas', 'Template_Data_Kelas_SIADIK');
  } else {
    downloadCsv(sampleData, 'Template_Data_Kelas_SIADIK');
  }
};

// ==========================================
// 5. SUBJECTS (DATA MATA PELAJARAN)
// ==========================================
export type SubjectImportData = Omit<SubjectItem, 'id'>;

export const parseSubjectFile = async (file: File): Promise<GenericParseResult<SubjectImportData>> => {
  const { rawRows, headersFound } = await readWorkbookRows(file);
  const validRows: ParsedItemRow<SubjectImportData>[] = [];
  const invalidRows: ParsedItemRow<SubjectImportData>[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const code = safeString(findMatchingFieldValue(row, ['kode', 'kodemapel', 'kodematapelajaran', 'code']));
    const name = safeString(findMatchingFieldValue(row, ['mapel', 'namamapel', 'matapelajaran', 'namamatapelajaran', 'subject', 'name']));
    const teacherName = safeString(findMatchingFieldValue(row, ['guru', 'gurupengampu', 'namaguru', 'pengampu', 'teacher']));
    const rawCategory = safeString(findMatchingFieldValue(row, ['kategori', 'kelompok', 'category', 'jenis'])).toLowerCase();
    const rawHours = safeString(findMatchingFieldValue(row, ['jam', 'jp', 'jamperminggu', 'hours', 'alokasijam']));

    const errors: string[] = [];
    if (!name) {
      errors.push('Nama mata pelajaran wajib diisi');
    }

    let category: 'Wajib' | 'Peminatan MIPA' | 'Muatan Lokal' = 'Wajib';
    if (rawCategory.includes('peminatan') || rawCategory.includes('mipa') || rawCategory.includes('ipa')) {
      category = 'Peminatan MIPA';
    } else if (rawCategory.includes('lokal') || rawCategory.includes('mulok')) {
      category = 'Muatan Lokal';
    }

    const hours = parseInt(rawHours, 10);
    const hoursPerWeek = !isNaN(hours) && hours > 0 ? hours : 3;

    const subjectData: SubjectImportData = {
      code: code || `MP-${Math.floor(100 + Math.random() * 900)}`,
      name,
      teacherName: teacherName || 'Pengajar Belum Ditentukan',
      category,
      hoursPerWeek,
    };

    const parsed: ParsedItemRow<SubjectImportData> = {
      rowNumber,
      data: subjectData,
      isValid: errors.length === 0,
      errors,
      raw: row,
    };

    if (parsed.isValid) validRows.push(parsed);
    else invalidRows.push(parsed);
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

export const downloadSubjectTemplate = (format: 'xlsx' | 'csv') => {
  const sampleData = [
    {
      'Kode Mapel': 'MP-MAT-W',
      'Nama Mata Pelajaran': 'Matematika Umum',
      'Guru Pengampu': 'Drs. Johanes Pattinama, M.Pd.',
      'Kategori (Wajib/Peminatan MIPA/Muatan Lokal)': 'Wajib',
      'Jam per Minggu (JP)': 4,
    },
    {
      'Kode Mapel': 'MP-BIO-PM',
      'Nama Mata Pelajaran': 'Biologi Peminatan',
      'Guru Pengampu': 'Dra. Helena Tahitu, M.Si.',
      'Kategori (Wajib/Peminatan MIPA/Muatan Lokal)': 'Peminatan MIPA',
      'Jam per Minggu (JP)': 4,
    },
    {
      'Kode Mapel': 'MP-ML-BAH',
      'Nama Mata Pelajaran': 'Bahasa Daerah & Budaya Maluku',
      'Guru Pengampu': 'Oktovianus Latuconsina, S.Pd.',
      'Kategori (Wajib/Peminatan MIPA/Muatan Lokal)': 'Muatan Lokal',
      'Jam per Minggu (JP)': 2,
    },
  ];

  if (format === 'xlsx') {
    downloadWorkbook(sampleData, 'Data Mata Pelajaran', 'Template_Data_Mata_Pelajaran_SIADIK');
  } else {
    downloadCsv(sampleData, 'Template_Data_Mata_Pelajaran_SIADIK');
  }
};

// ==========================================
// 6. SCHEDULES (DATA JADWAL PELAJARAN)
// ==========================================
export type ScheduleImportData = Omit<ScheduleItem, 'id'>;

export const parseScheduleFile = async (file: File): Promise<GenericParseResult<ScheduleImportData>> => {
  const { rawRows, headersFound } = await readWorkbookRows(file);
  const validRows: ParsedItemRow<ScheduleImportData>[] = [];
  const invalidRows: ParsedItemRow<ScheduleImportData>[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rawDay = safeString(findMatchingFieldValue(row, ['hari', 'day']));
    const className = safeString(findMatchingFieldValue(row, ['kelas', 'namakelas', 'rombel', 'class']));
    const subjectName = safeString(findMatchingFieldValue(row, ['mapel', 'matapelajaran', 'namamapel', 'subject']));
    const teacherName = safeString(findMatchingFieldValue(row, ['guru', 'gurupengajar', 'namaguru', 'pengajar', 'teacher']));
    const startTime = safeString(findMatchingFieldValue(row, ['jammulai', 'mulai', 'waktumulai', 'starttime', 'start'])) || '07:30';
    const endTime = safeString(findMatchingFieldValue(row, ['jamselesai', 'selesai', 'waktuselesai', 'endtime', 'end'])) || '09:00';
    const room = safeString(findMatchingFieldValue(row, ['ruang', 'ruangan', 'room', 'tempat'])) || 'R. Teori';

    const errors: string[] = [];
    if (!subjectName) errors.push('Nama mata pelajaran wajib diisi');
    if (!className) errors.push('Kelas wajib diisi');

    let day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' = 'Senin';
    const lowerDay = rawDay.toLowerCase();
    if (lowerDay.includes('sel')) day = 'Selasa';
    else if (lowerDay.includes('rab')) day = 'Rabu';
    else if (lowerDay.includes('kam')) day = 'Kamis';
    else if (lowerDay.includes('jum')) day = 'Jumat';
    else if (lowerDay.includes('sab')) day = 'Sabtu';

    const scheduleData: ScheduleImportData = {
      day,
      className,
      subjectName,
      teacherName: teacherName || 'Pengajar Belum Ditentukan',
      startTime,
      endTime,
      room,
    };

    const parsed: ParsedItemRow<ScheduleImportData> = {
      rowNumber,
      data: scheduleData,
      isValid: errors.length === 0,
      errors,
      raw: row,
    };

    if (parsed.isValid) validRows.push(parsed);
    else invalidRows.push(parsed);
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

export const downloadScheduleTemplate = (format: 'xlsx' | 'csv') => {
  const sampleData = [
    {
      'Hari': 'Senin',
      'Kelas': 'X IPAS 1',
      'Mata Pelajaran': 'Matematika Umum',
      'Guru Pengajar': 'Drs. Johanes Pattinama, M.Pd.',
      'Jam Mulai (HH:mm)': '07:30',
      'Jam Selesai (HH:mm)': '09:00',
      'Ruangan': 'Ruang 101',
    },
    {
      'Hari': 'Senin',
      'Kelas': 'X IPAS 1',
      'Mata Pelajaran': 'Bahasa Indonesia',
      'Guru Pengajar': 'Maria Christina Wattimena, S.Pd.',
      'Jam Mulai (HH:mm)': '09:15',
      'Jam Selesai (HH:mm)': '10:45',
      'Ruangan': 'Ruang 101',
    },
    {
      'Hari': 'Selasa',
      'Kelas': 'XI MIPA 2',
      'Mata Pelajaran': 'Biologi Peminatan',
      'Guru Pengajar': 'Dra. Helena Tahitu, M.Si.',
      'Jam Mulai (HH:mm)': '07:30',
      'Jam Selesai (HH:mm)': '09:45',
      'Ruangan': 'Lab Biologi',
    },
  ];

  if (format === 'xlsx') {
    downloadWorkbook(sampleData, 'Data Jadwal', 'Template_Data_Jadwal_Pelajaran_SIADIK');
  } else {
    downloadCsv(sampleData, 'Template_Data_Jadwal_Pelajaran_SIADIK');
  }
};

// ==========================================
// 7. TEACHER JOURNAL (JURNAL GURU)
// ==========================================
export type TeacherJournalImportData = Omit<TeacherJournal, 'id'>;

export const parseTeacherJournalFile = async (file: File): Promise<GenericParseResult<TeacherJournalImportData>> => {
  const { rawRows, headersFound } = await readWorkbookRows(file);

  const validRows: ParsedItemRow<TeacherJournalImportData>[] = [];
  const invalidRows: ParsedItemRow<TeacherJournalImportData>[] = [];

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const errors: string[] = [];

    const dateVal = safeString(findMatchingFieldValue(row, ['tanggal', 'date', 'tgl']));
    const teacherName = safeString(findMatchingFieldValue(row, ['gurupengajar', 'namaguru', 'guru', 'teacher', 'pengajar', 'nama']));
    const teacherNip = safeString(findMatchingFieldValue(row, ['nip', 'nipguru']));
    const subjectName = safeString(findMatchingFieldValue(row, ['matapelajaran', 'mapel', 'subject', 'pelajaran']));
    const className = safeString(findMatchingFieldValue(row, ['kelas', 'rombel', 'class', 'kelassiswa']));
    const lessonPeriod = safeString(findMatchingFieldValue(row, ['jampelajaran', 'jamke', 'jp', 'period', 'jam'])) || '1 - 2 (2 JP)';
    const timeRange = safeString(findMatchingFieldValue(row, ['waktu', 'timerange', 'jamwaktu', 'pukul'])) || '07:30 - 09:00';
    const topic = safeString(findMatchingFieldValue(row, ['materipokok', 'materi', 'topik', 'topic', 'kd', 'kompetensidasar', 'tujuanpembelajaran', 'judul']));
    const learningActivities = safeString(findMatchingFieldValue(row, ['uraiankegiatan', 'kegiatan', 'kegiatanpembelajaran', 'aktivitas', 'metode', 'deskripsi']));
    
    const totalStudentsRaw = findMatchingFieldValue(row, ['jumlahsiswa', 'totalsiswa', 'jumlahsiswatotal', 'total']);
    const presentCountRaw = findMatchingFieldValue(row, ['hadir', 'siswahadir', 'siswayanghadir', 'jumlahhadir']);
    const absentCountRaw = findMatchingFieldValue(row, ['tidakhadir', 'absen', 'siswatidakhadir', 'jumlahabsen']);
    const absentNotes = safeString(findMatchingFieldValue(row, ['keteranganabsen', 'keterangan', 'siswatsakit', 'catatanabsen', 'absennotes']));
    
    const statusRaw = safeString(findMatchingFieldValue(row, ['status', 'keterlaksanaan', 'statuskegiatan'])).toLowerCase();
    const notes = safeString(findMatchingFieldValue(row, ['catatankhusus', 'catatan', 'evaluasi', 'notes', 'keteranganlain']));

    if (!teacherName) {
      errors.push('Nama guru pengajar tidak boleh kosong');
    }
    if (!subjectName) {
      errors.push('Mata pelajaran tidak boleh kosong');
    }
    if (!className) {
      errors.push('Nama kelas / rombel tidak boleh kosong');
    }
    if (!topic) {
      errors.push('Materi pokok / topik pembelajaran tidak boleh kosong');
    }

    let status: TeacherJournalStatus = 'Terlaksana';
    if (statusRaw.includes('tugas') || statusRaw.includes('mandiri')) {
      status = 'Tugas Mandiri';
    } else if (statusRaw.includes('ganti') || statusRaw.includes('sub')) {
      status = 'Digantikan';
    } else if (statusRaw.includes('tunda') || statusRaw.includes('batal')) {
      status = 'Tertunda';
    }

    const totalStudents = Number(totalStudentsRaw) || 30;
    const presentCount = presentCountRaw !== undefined && presentCountRaw !== '' ? Number(presentCountRaw) : totalStudents;
    const absentCount = absentCountRaw !== undefined && absentCountRaw !== '' ? Number(absentCountRaw) : Math.max(0, totalStudents - presentCount);

    const data: TeacherJournalImportData = {
      date: dateVal || new Date().toISOString().split('T')[0],
      lessonPeriod,
      timeRange,
      teacherName: teacherName || 'Guru Mata Pelajaran',
      teacherNip: teacherNip || undefined,
      subjectName: subjectName || 'Mata Pelajaran',
      className: className || 'X IPAS',
      topic: topic || 'Materi Pembelajaran',
      learningActivities: learningActivities || 'Penyampaian materi pokok, diskusi kelompok, dan evaluasi pembelajaran.',
      totalStudents,
      presentCount,
      absentCount,
      absentNotes: absentNotes || undefined,
      status,
      notes: notes || undefined,
    };

    if (errors.length === 0) {
      validRows.push({ rowNumber, data, isValid: true, errors: [], raw: row });
    } else {
      invalidRows.push({ rowNumber, data, isValid: false, errors, raw: row });
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

export const downloadTeacherJournalTemplate = (format: 'xlsx' | 'csv') => {
  const sampleData = [
    {
      'Tanggal (YYYY-MM-DD)': '2026-09-07',
      'Jam Ke': '1 - 2 (2 JP)',
      'Waktu': '07:30 - 09:00',
      'Guru Pengajar': 'Jecky Marantika, S.Pd., Gr',
      'NIP': '19850612 200902 1 003',
      'Mata Pelajaran': 'Informatika & Literasi Digital',
      'Kelas': 'X IPAS',
      'Materi Pokok / KD': 'Pengolahan Data & Pemrograman Visual Scratch',
      'Uraian Kegiatan Pembelajaran': 'Penjelasan konsep logika algoritma, praktik pembuatan game sains di Lab Komputer, dan presentasi hasil.',
      'Jumlah Siswa': 32,
      'Siswa Hadir': 31,
      'Siswa Tidak Hadir': 1,
      'Keterangan Siswa Tidak Hadir': 'Aldo Latumahina (Izin)',
      'Status': 'Terlaksana',
      'Catatan Khusus': 'Siswa sangat aktif dan seluruh modul praktik selesai tepat waktu.',
    },
    {
      'Tanggal (YYYY-MM-DD)': '2026-09-07',
      'Jam Ke': '3 - 4 (2 JP)',
      'Waktu': '09:15 - 10:45',
      'Guru Pengajar': 'Dra. Maria Martha Patty, M.Si.',
      'NIP': '19820319 200801 2 015',
      'Mata Pelajaran': 'Biologi Kelautan & Konservasi',
      'Kelas': 'XI IPAS',
      'Materi Pokok / KD': 'Biodiversitas Terumbu Karang Maluku',
      'Uraian Kegiatan Pembelajaran': 'Pengamatan mikroskop preparat alga dan diskusi analisis kerusakan ekosistem laut.',
      'Jumlah Siswa': 30,
      'Siswa Hadir': 30,
      'Siswa Tidak Hadir': 0,
      'Keterangan Siswa Tidak Hadir': '',
      'Status': 'Terlaksana',
      'Catatan Khusus': 'Seluruh siswa hadir lengkap dan tertib di laboratorium.',
    },
  ];

  if (format === 'xlsx') {
    downloadWorkbook(sampleData, 'Jurnal Mengajar Guru', 'Template_Jurnal_Guru_SIADIK');
  } else {
    downloadCsv(sampleData, 'Template_Jurnal_Guru_SIADIK');
  }
};

