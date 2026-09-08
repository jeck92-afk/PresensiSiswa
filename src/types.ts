export type Gender = 'L' | 'P';

export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';

export type AttendanceType = 'MASUK' | 'PULANG';

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  gender: Gender;
  className: string;
  avatarUrl?: string;
  parentPhone?: string;
  birthDate?: string;
  address?: string;
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  gender: Gender;
  subject: string;
  phone: string;
  email?: string;
  status: 'PNS' | 'PPPK' | 'GTT' | 'Honor';
  homeroomClass?: string;
}

export interface ParentInfo {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  parentName: string;
  relation: 'Ayah' | 'Ibu' | 'Wali';
  phone: string;
  address: string;
  job?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: '10' | '11' | '12';
  homeroomTeacher: string;
  homeroomTeacherPhone?: string;
  roomNumber: string;
  academicYear: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  teacherName: string;
  category: 'Wajib' | 'Peminatan MIPA' | 'Muatan Lokal';
  hoursPerWeek: number;
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  className: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentNis: string;
  studentNisn: string;
  studentName: string;
  studentClass: string;
  gender: Gender;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  type: AttendanceType;
  status: AttendanceStatus;
  note?: string;
  timestamp: number;
}

export interface SchoolConfig {
  schoolName: string;
  schoolNpsn: string;
  schoolAddress: string;
  schoolLogoUrl?: string;
  provincialLogoUrl?: string;
  showProvincialLogo?: boolean;
  principalName: string;
  principalNip?: string;
  academicYear: string;
  adminWhatsApp?: string; // e.g. "085211798843"
  timeZone?: 'WIT' | 'WITA' | 'WIB'; // Timezone, default 'WIT'
  checkInDeadline: string; // HH:mm, e.g. "07:15"
  checkOutStart: string; // HH:mm, e.g. "14:30"
  enableAudio: boolean;
  scanMode: 'AUTO' | 'MASUK' | 'PULANG';
  enableWhatsAppNotification?: boolean;
  autoOpenWhatsApp?: boolean;
  waTemplateMasuk?: string;
  waTemplatePulang?: string;
  waTemplateTerlambat?: string;
  waTemplateBelumHadir?: string;
  autoClearScanResult?: boolean;
  autoClearDelaySeconds?: number;
  developerName?: string;
  developerTitle?: string;
  developerPhotoUrl?: string;
  developerEmail?: string;
  developerWhatsApp?: string;
  developerBio?: string;
}

export interface ScanResultDetail {
  record: AttendanceRecord;
  student: Student;
  isDuplicate?: boolean;
}

export type AdminRole = 'Super Admin' | 'Operator Presensi' | 'Kepala Sekolah' | 'Wali Kelas';

export interface AdminAccount {
  id: string;
  username: string;
  passwordHash: string; // Plain or hashed string for demonstration
  fullName: string;
  role: AdminRole;
  email?: string;
  nip?: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface AdminAuthSession {
  isAuthenticated: boolean;
  user: AdminAccount | null;
  loginTimestamp: number;
  rememberMe: boolean;
}

export type TeacherJournalStatus = 'Terlaksana' | 'Tugas Mandiri' | 'Digantikan' | 'Tertunda';

export interface TeacherJournal {
  id: string;
  date: string; // YYYY-MM-DD
  lessonPeriod: string; // Jam Ke- (e.g. "1 - 2", "3 - 4", "5 - 6")
  timeRange: string; // e.g. "07:30 - 09:00"
  teacherName: string;
  teacherNip?: string;
  subjectName: string;
  className: string;
  topic: string; // Materi Pokok / Kompetensi Dasar / Tujuan Pembelajaran
  learningActivities: string; // Uraian Kegiatan / Metode Pembelajaran
  totalStudents: number; // Jumlah Siswa Total
  presentCount: number; // Siswa Hadir
  absentCount: number; // Siswa Tidak Hadir
  absentNotes?: string; // Keterangan Siswa Tidak Hadir (misal: "Budi (Sakit), Siti (Izin)")
  status: TeacherJournalStatus;
  notes?: string; // Catatan Khusus / Evaluasi Kelas / Kejadian
  attachmentUrl?: string;
}

