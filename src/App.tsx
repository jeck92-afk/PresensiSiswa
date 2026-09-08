import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Clock,
  ArrowUp,
  ShieldCheck,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Database,
  CheckCircle2,
  AlertCircle,
  Info,
  LogOut,
  Lock,
  Sparkles,
  Settings,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  Student,
  AttendanceRecord,
  SchoolConfig,
  AttendanceStatus,
  AttendanceType,
  Teacher,
  SchoolClass,
  SubjectItem,
  ScheduleItem,
  TeacherJournal,
  AdminAuthSession,
  AdminAccount,
} from './types';
import {
  DEFAULT_SCHOOL_CONFIG,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE_RECORDS,
  getTodayDateString,
  normalizeClassName,
} from './data/initialData';
import {
  INITIAL_TEACHERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_SCHEDULES,
  INITIAL_JOURNALS,
} from './data/mockSchoolData';
import { getCurrentTimeString } from './utils/time';
import {
  getAdminWhatsAppUrl,
  formatDisplayPhone,
  DEFAULT_ADMIN_WA,
} from './utils/whatsapp';
import { getCurrentAuthSession, clearAuthSession } from './utils/authService';
import { Sidebar, AppMenuTab } from './components/Sidebar';
import { AdminLoginView } from './components/AdminLoginView';
import { AdminLandingView } from './components/AdminLandingView';
import { ScannerView } from './components/ScannerView';
import { StudentCardsView } from './components/StudentCardsView';
import { AttendanceLogsView } from './components/AttendanceLogsView';
import { StudentsManagementView } from './components/StudentsManagementView';
import { SettingsView } from './components/SettingsView';
import { StudentImportView } from './components/StudentImportView';
import { GoogleSheetsDatabaseView } from './components/GoogleSheetsDatabaseView';
import { SchoolLogo } from './components/SchoolLogo';
import { DeveloperProfileModal } from './components/DeveloperProfileModal';
import { TeachersView } from './components/teachers/TeachersView';
import { ParentsView } from './components/parents/ParentsView';
import { ClassesView } from './components/classes/ClassesView';
import { SubjectsView } from './components/subjects/SubjectsView';
import { SchedulesView } from './components/schedules/SchedulesView';
import { TeacherJournalsView } from './components/journals/TeacherJournalsView';
import { ActiveAttendanceView } from './components/attendance/ActiveAttendanceView';
import { initAuth } from './services/googleAuth';
import {
  SpreadsheetInfo,
  appendAttendanceToSpreadsheet,
} from './services/googleSheetsService';
import {
  TeacherImportData,
  ParentImportData,
  ClassImportData,
  SubjectImportData,
  ScheduleImportData,
  TeacherJournalImportData,
  StudentImportData,
} from './utils/dataImportUtils';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export type ExtendedTab = AppMenuTab | 'cards' | 'import' | 'sheets' | 'settings';

export default function App() {
  const { isOnline } = useOnlineStatus();

  // 1. Dark Mode State with persistence & HTML root class sync
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('presensi_dark_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('presensi_dark_mode', String(isDarkMode));
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // 2. School Config State
  const [config, setConfig] = useState<SchoolConfig>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isOldPrincipal =
          !parsed.principalName ||
          parsed.principalName.includes('Bambang Sujarwo') ||
          parsed.principalNip === '19720415 199803 1 004';

        return {
          ...DEFAULT_SCHOOL_CONFIG,
          ...parsed,
          principalName: isOldPrincipal
            ? DEFAULT_SCHOOL_CONFIG.principalName
            : parsed.principalName,
          principalNip: isOldPrincipal
            ? DEFAULT_SCHOOL_CONFIG.principalNip
            : parsed.principalNip,
          developerName: parsed.developerName || DEFAULT_SCHOOL_CONFIG.developerName,
          developerTitle: parsed.developerTitle || DEFAULT_SCHOOL_CONFIG.developerTitle,
          developerPhotoUrl: parsed.developerPhotoUrl || DEFAULT_SCHOOL_CONFIG.developerPhotoUrl,
          developerEmail: parsed.developerEmail || DEFAULT_SCHOOL_CONFIG.developerEmail,
          developerWhatsApp: parsed.developerWhatsApp || DEFAULT_SCHOOL_CONFIG.developerWhatsApp,
          developerBio: parsed.developerBio || DEFAULT_SCHOOL_CONFIG.developerBio,
        };
      }
      return DEFAULT_SCHOOL_CONFIG;
    } catch {
      return DEFAULT_SCHOOL_CONFIG;
    }
  });

  // 3. Students State
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_students');
      const list: Student[] = saved ? JSON.parse(saved) : INITIAL_STUDENTS;
      return list.map((s) => ({
        ...s,
        className: normalizeClassName(s.className),
      }));
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // 4. Attendance Records State
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_records');
      const list: AttendanceRecord[] = saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
      return list.map((r) => ({
        ...r,
        studentClass: normalizeClassName(r.studentClass),
      }));
    } catch {
      return INITIAL_ATTENDANCE_RECORDS;
    }
  });

  // 5. Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_teachers');
      return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  // 6. Classes State
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_classes');
      return saved ? JSON.parse(saved) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  });

  // 7. Subjects State
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_subjects');
      return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
    } catch {
      return INITIAL_SUBJECTS;
    }
  });

  // 8. Schedules State
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_schedules');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  // 8b. Teacher Journals State (Jurnal Guru KBM)
  const [journals, setJournals] = useState<TeacherJournal[]>(() => {
    try {
      const saved = localStorage.getItem('presensi_qr_journals');
      return saved ? JSON.parse(saved) : INITIAL_JOURNALS;
    } catch {
      return INITIAL_JOURNALS;
    }
  });

  // 9. Google Sheets & Auth State
  const [user, setUser] = useState<User | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(() => {
    try {
      const saved = localStorage.getItem('presensi_spreadsheet_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 10. Navigation & Modal States
  // Default is 'dashboard' (Dasboard)
  const [activeTab, setActiveTab] = useState<ExtendedTab>('dashboard');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [developerModalOpen, setDeveloperModalOpen] = useState<boolean>(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);

  // 11. Admin Authentication Session
  const [adminSession, setAdminSession] = useState<AdminAuthSession>(() =>
    getCurrentAuthSession()
  );

  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Live real-time clock synced with school timezone (default WIT)
  const [currentTime, setCurrentTime] = useState<string>(() =>
    getCurrentTimeString(undefined, true, config.timeZone || 'WIT')
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeString(undefined, true, config.timeZone || 'WIT'));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.timeZone]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_config', JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_students', JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_records', JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_teachers', JSON.stringify(teachers));
    } catch (e) {
      console.error(e);
    }
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_classes', JSON.stringify(classes));
    } catch (e) {
      console.error(e);
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_subjects', JSON.stringify(subjects));
    } catch (e) {
      console.error(e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_schedules', JSON.stringify(schedules));
    } catch (e) {
      console.error(e);
    }
  }, [schedules]);

  useEffect(() => {
    try {
      localStorage.setItem('presensi_qr_journals', JSON.stringify(journals));
    } catch (e) {
      console.error(e);
    }
  }, [journals]);

  useEffect(() => {
    try {
      if (spreadsheetInfo) {
        localStorage.setItem('presensi_spreadsheet_info', JSON.stringify(spreadsheetInfo));
      } else {
        localStorage.removeItem('presensi_spreadsheet_info');
      }
    } catch (e) {
      console.error(e);
    }
  }, [spreadsheetInfo]);

  // Attendance recording logic
  const handleRecordAttendance = (newRecord: AttendanceRecord): {
    success: boolean;
    message: string;
    record?: AttendanceRecord;
  } => {
    const today = getTodayDateString();
    const existing = records.find(
      (r) => r.studentId === newRecord.studentId && r.date === today && r.type === newRecord.type
    );

    if (existing) {
      const tzLabel = config.timeZone || 'WIT';
      return {
        success: false,
        message: `Siswa sudah tercatat absen ${existing.type.toLowerCase()} pada pukul ${existing.time} ${tzLabel}.`,
        record: existing,
      };
    }

    setRecords((prev) => [newRecord, ...prev]);

    if (spreadsheetInfo && spreadsheetInfo.autoSync) {
      appendAttendanceToSpreadsheet(spreadsheetInfo.id, newRecord)
        .then((res) => {
          if (res.success) {
            const tzLabel = config.timeZone || 'WIT';
            const nowTime = getCurrentTimeString(new Date(), true, tzLabel);
            setSpreadsheetInfo((prev) =>
              prev ? { ...prev, lastSynced: `${nowTime} ${tzLabel}` } : null
            );
          }
        })
        .catch((err) => {
          console.warn('Auto-sync to Google Sheets failed:', err);
        });
    }

    const statusLabel =
      newRecord.type === 'PULANG'
        ? 'Absen Pulang Berhasil'
        : newRecord.status === 'TERLAMBAT'
        ? 'Tercatat (Terlambat)'
        : 'Tercatat (Tepat Waktu)';

    const tzLabel = config.timeZone || 'WIT';
    return {
      success: true,
      message: `Presensi berhasil! Status: ${statusLabel} (${newRecord.time} ${tzLabel})`,
      record: newRecord,
    };
  };

  // Student Handlers
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: 'STD-' + Date.now(),
    };
    setStudents((prev) => [newStudent, ...prev]);
    showNotification(`Siswa ${studentData.name} berhasil ditambahkan!`, 'success');
  };

  const handleUpdateStudent = (id: string, updated: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    showNotification('Data siswa berhasil diperbarui', 'success');
  };

  const handleBatchUpdateStudentPhotos = (updates: { id: string; avatarUrl: string }[]) => {
    const updateMap = new Map(updates.map((u) => [u.id, u.avatarUrl]));
    setStudents((prev) =>
      prev.map((s) => (updateMap.has(s.id) ? { ...s, avatarUrl: updateMap.get(s.id) } : s))
    );
    showNotification(`${updates.length} pasfoto siswa berhasil diperbarui!`, 'success');
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showNotification('Siswa berhasil dihapus', 'info');
  };

  const handleImportStudents = (
    importedStudents: Omit<Student, 'id'>[],
    mode: 'append' | 'replace'
  ) => {
    const formatted: Student[] = importedStudents.map((st, idx) => ({
      ...st,
      id: `STD-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    }));

    if (mode === 'replace') {
      setStudents(formatted);
    } else {
      setStudents((prev) => {
        const existingNisMap = new Map(prev.map((s) => [s.nis, s]));
        const updated = [...prev];

        formatted.forEach((newS) => {
          if (existingNisMap.has(newS.nis)) {
            const idx = updated.findIndex((s) => s.nis === newS.nis);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                ...newS,
              };
            }
          } else {
            updated.unshift(newS);
          }
        });
        return updated;
      });
    }
    showNotification(`${importedStudents.length} siswa berhasil diimpor!`, 'success');
  };

  const handleResetToSampleData = () => {
    setStudents(INITIAL_STUDENTS);
    setRecords(INITIAL_ATTENDANCE_RECORDS);
    setTeachers(INITIAL_TEACHERS);
    setClasses(INITIAL_CLASSES);
    setSubjects(INITIAL_SUBJECTS);
    setSchedules(INITIAL_SCHEDULES);
    setConfig(DEFAULT_SCHOOL_CONFIG);
    showNotification('Data dikembalikan ke data sampel resmi Maluku', 'info');
  };

  // Record Handlers
  const handleUpdateRecordStatus = (
    recordId: string,
    newStatus: AttendanceStatus,
    note?: string
  ) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: newStatus,
              note: note !== undefined ? note : r.note,
            }
          : r
      )
    );
    showNotification('Status absensi berhasil diperbarui', 'success');
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    showNotification('Catatan presensi dihapus', 'info');
  };

  const handleAddManualAttendance = (record: AttendanceRecord) => {
    setRecords((prev) => [record, ...prev]);
    showNotification(`Presensi ${record.studentName} berhasil dicatat`, 'success');
  };

  const handleSetStudentAttendance = (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    note?: string,
    type: AttendanceType = 'MASUK'
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const tzLabel = config.timeZone || 'WIT';
    const timeStr = getCurrentTimeString(new Date(), true, tzLabel);

    setRecords((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.studentId === studentId && r.date === date && r.type === type
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          status,
          note: note !== undefined ? note : updated[existingIdx].note,
        };
        return updated;
      } else {
        const newRec: AttendanceRecord = {
          id: 'ATT-ADMIN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          studentId: student.id,
          studentNis: student.nis,
          studentNisn: student.nisn,
          studentName: student.name,
          studentClass: student.className,
          gender: student.gender,
          date,
          time: timeStr,
          type,
          status,
          note: note || `Dicatat oleh admin (${status})`,
          timestamp: Date.now(),
        };
        return [newRec, ...prev];
      }
    });

    showNotification(`Status ${student.name} (${status}) berhasil disimpan`, 'success');
  };

  const handleBatchSetAttendance = (
    studentIds: string[],
    date: string,
    status: AttendanceStatus,
    note?: string,
    type: AttendanceType = 'MASUK'
  ) => {
    if (studentIds.length === 0) return;

    const tzLabel = config.timeZone || 'WIT';
    const timeStr = getCurrentTimeString(new Date(), true, tzLabel);

    setRecords((prev) => {
      const updated = [...prev];
      const newRecords: AttendanceRecord[] = [];

      studentIds.forEach((sId, index) => {
        const student = students.find((s) => s.id === sId);
        if (!student) return;

        const existingIdx = updated.findIndex(
          (r) => r.studentId === sId && r.date === date && r.type === type
        );

        if (existingIdx !== -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            status,
            note: note !== undefined ? note : updated[existingIdx].note,
          };
        } else {
          newRecords.push({
            id: 'ATT-BATCH-' + Date.now() + '-' + index + '-' + Math.random().toString(36).substring(2, 5),
            studentId: student.id,
            studentNis: student.nis,
            studentNisn: student.nisn,
            studentName: student.name,
            studentClass: student.className,
            gender: student.gender,
            date,
            time: timeStr,
            type,
            status,
            note: note || `Dicatat masal oleh admin (${status})`,
            timestamp: Date.now() + index,
          });
        }
      });

      return [...newRecords, ...updated];
    });

    showNotification(`${studentIds.length} siswa berhasil diatur statusnya menjadi ${status}`, 'success');
  };

  const handleNavigateToCards = (studentId?: string) => {
    if (studentId) {
      setSelectedStudentForCard(studentId);
    }
    setActiveTab('cards');
  };

  // Teacher Handlers
  const handleAddTeacher = (teacher: Teacher) => {
    setTeachers((prev) => [teacher, ...prev]);
    showNotification(`Data guru ${teacher.name} berhasil ditambahkan`, 'success');
  };

  const handleUpdateTeacher = (id: string, updated: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    showNotification('Data guru berhasil diperbarui', 'success');
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    showNotification('Data guru berhasil dihapus', 'info');
  };

  const handleImportTeachers = (
    imported: TeacherImportData[],
    mode: 'append' | 'replace'
  ) => {
    const formatted: Teacher[] = imported.map((t, idx) => ({
      id: `TCH-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      nip: t.nip,
      name: t.name,
      gender: t.gender,
      subject: t.subject,
      phone: t.phone,
      email: t.email,
      status: t.status,
      homeroomClass: t.homeroomClass,
    }));

    if (mode === 'replace') {
      setTeachers(formatted);
    } else {
      setTeachers((prev) => {
        const existingNipMap = new Map(prev.map((t) => [t.nip, t]));
        const updated = [...prev];

        formatted.forEach((newT) => {
          if (newT.nip && newT.nip !== '-' && existingNipMap.has(newT.nip)) {
            const idx = updated.findIndex((t) => t.nip === newT.nip);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], ...newT };
            }
          } else {
            updated.unshift(newT);
          }
        });
        return updated;
      });
    }
    showNotification(`${imported.length} data guru berhasil diimpor!`, 'success');
  };

  // Parent Handlers (Updates student contact & parent info)
  const handleImportParents = (
    imported: ParentImportData[],
    mode: 'append' | 'replace'
  ) => {
    setStudents((prev) => {
      const updated = [...prev];
      let matchedCount = 0;

      imported.forEach((p) => {
        // Match by studentNis or studentName
        const idx = updated.findIndex(
          (s) =>
            (p.studentNis && s.nis.trim() === p.studentNis.trim()) ||
            (p.studentName && s.name.trim().toLowerCase() === p.studentName.trim().toLowerCase())
        );

        if (idx !== -1) {
          matchedCount++;
          updated[idx] = {
            ...updated[idx],
            parentPhone: p.parentPhone || updated[idx].parentPhone,
            address: p.address || updated[idx].address,
          };
        }
      });

      return updated;
    });

    showNotification(`${imported.length} data kontak orang tua / wali diproses & disinkronkan!`, 'success');
  };

  // Class Handlers
  const handleAddClass = (cls: SchoolClass) => {
    setClasses((prev) => [...prev, cls]);
    showNotification(`Kelas ${cls.name} berhasil ditambahkan`, 'success');
  };

  const handleUpdateClass = (id: string, updated: Partial<SchoolClass>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    showNotification('Data kelas berhasil diperbarui', 'success');
  };

  const handleDeleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    showNotification('Data kelas dihapus', 'info');
  };

  const handleImportClasses = (
    imported: ClassImportData[],
    mode: 'append' | 'replace'
  ) => {
    const formatted: SchoolClass[] = imported.map((c, idx) => ({
      id: `CLS-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: c.name,
      grade: c.grade,
      homeroomTeacher: c.homeroomTeacher,
      homeroomTeacherPhone: c.homeroomTeacherPhone,
      roomNumber: c.roomNumber,
      academicYear: c.academicYear || config.academicYear,
    }));

    if (mode === 'replace') {
      setClasses(formatted);
    } else {
      setClasses((prev) => {
        const existingMap = new Map(prev.map((c) => [c.name.toLowerCase(), c]));
        const updated = [...prev];

        formatted.forEach((newC) => {
          if (existingMap.has(newC.name.toLowerCase())) {
            const idx = updated.findIndex((c) => c.name.toLowerCase() === newC.name.toLowerCase());
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], ...newC };
            }
          } else {
            updated.push(newC);
          }
        });
        return updated;
      });
    }
    showNotification(`${imported.length} rombel kelas berhasil diimpor!`, 'success');
  };

  // Subject Handlers
  const handleAddSubject = (subj: SubjectItem) => {
    setSubjects((prev) => [...prev, subj]);
    showNotification(`Mata pelajaran ${subj.name} berhasil ditambahkan`, 'success');
  };

  const handleUpdateSubject = (id: string, updated: Partial<SubjectItem>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    showNotification('Mata pelajaran berhasil diperbarui', 'success');
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showNotification('Mata pelajaran dihapus', 'info');
  };

  const handleImportSubjects = (
    imported: SubjectImportData[],
    mode: 'append' | 'replace'
  ) => {
    const formatted: SubjectItem[] = imported.map((s, idx) => ({
      id: `SBJ-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      code: s.code || `MP-${Math.floor(100 + Math.random() * 900)}`,
      name: s.name,
      teacherName: s.teacherName,
      category: s.category,
      hoursPerWeek: s.hoursPerWeek,
    }));

    if (mode === 'replace') {
      setSubjects(formatted);
    } else {
      setSubjects((prev) => {
        const existingMap = new Map(prev.map((s) => [s.name.toLowerCase(), s]));
        const updated = [...prev];

        formatted.forEach((newS) => {
          if (existingMap.has(newS.name.toLowerCase())) {
            const idx = updated.findIndex((s) => s.name.toLowerCase() === newS.name.toLowerCase());
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], ...newS };
            }
          } else {
            updated.push(newS);
          }
        });
        return updated;
      });
    }
    showNotification(`${imported.length} mata pelajaran berhasil diimpor!`, 'success');
  };

  // Schedule Handlers
  const handleAddSchedule = (sch: ScheduleItem) => {
    setSchedules((prev) => [...prev, sch]);
    showNotification(`Jadwal ${sch.subjectName} berhasil ditambahkan`, 'success');
  };

  const handleUpdateSchedule = (id: string, updated: Partial<ScheduleItem>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    showNotification('Jadwal pelajaran berhasil diperbarui', 'success');
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showNotification('Jadwal pelajaran dihapus', 'info');
  };

  const handleImportSchedules = (
    imported: ScheduleImportData[],
    mode: 'append' | 'replace'
  ) => {
    const formatted: ScheduleItem[] = imported.map((sch, idx) => ({
      id: `SCH-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      day: sch.day,
      className: sch.className,
      subjectName: sch.subjectName,
      teacherName: sch.teacherName,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room,
    }));

    if (mode === 'replace') {
      setSchedules(formatted);
    } else {
      setSchedules((prev) => [...prev, ...formatted]);
    }
    showNotification(`${imported.length} jadwal pelajaran berhasil diimpor!`, 'success');
  };

  // Journal Handlers (Jurnal Guru KBM)
  const handleAddJournal = (journal: TeacherJournal) => {
    setJournals((prev) => [journal, ...prev]);
    showNotification(`Jurnal KBM ${journal.subjectName} (${journal.className}) berhasil disimpan`, 'success');
  };

  const handleUpdateJournal = (id: string, updated: Partial<TeacherJournal>) => {
    setJournals((prev) => prev.map((j) => (j.id === id ? { ...j, ...updated } : j)));
    showNotification('Jurnal KBM berhasil diperbarui', 'success');
  };

  const handleDeleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    showNotification('Jurnal KBM berhasil dihapus', 'info');
  };

  const handleImportJournals = (
    imported: TeacherJournalImportData[],
    mode: 'append' | 'replace'
  ) => {
    const formatted: TeacherJournal[] = imported.map((j, idx) => ({
      ...j,
      id: `JRN-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    if (mode === 'replace') {
      setJournals(formatted);
    } else {
      setJournals((prev) => [...formatted, ...prev]);
    }
    showNotification(`${imported.length} data jurnal KBM berhasil diimpor!`, 'success');
  };


  // Stats for today
  const todayStr = getTodayDateString();
  const todayRecordCount = records.filter(
    (r) => r.date === todayStr && ['HADIR', 'TERLAMBAT'].includes(r.status)
  ).length;

  // If not authenticated as Admin, show the Admin Login Screen
  if (!adminSession.isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <AdminLoginView
          config={config}
          isDarkMode={isDarkMode}
          onLoginSuccess={(user) => {
            setAdminSession({
              isAuthenticated: true,
              user,
              loginTimestamp: Date.now(),
              rememberMe: true,
            });
            showNotification(`Selamat datang kembali, ${user.fullName}!`, 'success');
          }}
          onOpenDeveloperModal={() => setDeveloperModalOpen(true)}
        />

        {/* Developer Profile Modal in Login Screen */}
        <DeveloperProfileModal
          isOpen={developerModalOpen}
          onClose={() => setDeveloperModalOpen(false)}
          config={config}
          onUpdateConfig={setConfig}
        />

        {/* Floating Toast Notification */}
        {toastNotification && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
                toastNotification.type === 'success'
                  ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
                  : toastNotification.type === 'error'
                  ? 'bg-rose-900/90 text-rose-100 border-rose-700'
                  : 'bg-slate-900/90 text-slate-100 border-slate-700'
              } backdrop-blur-md`}
            >
              {toastNotification.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {toastNotification.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {toastNotification.type === 'info' && (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span>{toastNotification.message}</span>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-institutional-canvas text-slate-900'} selection:bg-blue-100 selection:text-blue-900 font-sans-ui`}>
      {/* 1. LEFT SIDEBAR NAVIGATION MENU (Sequential Top to Bottom: 1 to 12) */}
      <Sidebar
        activeTab={activeTab as AppMenuTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'cards') setSelectedStudentForCard(null);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenLogout={() => setLogoutModalOpen(true)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        config={config}
        studentCount={students.length}
        teacherCount={teachers.length}
        classCount={classes.length}
        todayRecordCount={todayRecordCount}
        journalCount={journals.length}
        onOpenDeveloperModal={() => setDeveloperModalOpen(true)}
        adminUser={adminSession.user}
      />

      {/* 2. MAIN CONTENT AREA (On the Right of Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Government Ribbon */}
        <div className="bg-slate-950 text-slate-300 text-xs border-b border-slate-800 py-1.5 px-4 sm:px-6 print:hidden shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Government Breadcrumbs */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
              <span className="inline-flex items-center gap-1.5 text-slate-200 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white/30 shrink-0" />
                Pemerintah Provinsi Maluku
              </span>
              <span className="text-slate-650 hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-400">Dinas Pendidikan</span>
              <span className="text-slate-650 hidden md:inline">•</span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded bg-slate-850 text-slate-300 font-mono text-[10px] font-semibold border border-slate-700/60">
                NPSN {config.schoolNpsn}
              </span>
              <span className="text-slate-650 hidden lg:inline">•</span>
              <span className="hidden lg:inline text-slate-400">T.A. {config.academicYear}</span>
            </div>

            {/* Live Clock & Quick WA Admin */}
            <div className="flex items-center gap-3 text-[11px] ml-auto">
              <div
                className="flex items-center gap-1.5 font-mono text-slate-200 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800 shadow-inner"
                title={`Waktu Standar Sekolah (${config.timeZone || 'WIT'})`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold tracking-wider text-white text-[11px]">{currentTime}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold border border-emerald-500/30">
                  {config.timeZone || 'WIT'}
                </span>
              </div>

              <a
                href={getAdminWhatsAppUrl(
                  config.adminWhatsApp || DEFAULT_ADMIN_WA,
                  `Halo Admin Presensi ${config.schoolName}, saya menghubungi langsung melalui aplikasi presensi.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold text-[11px] transition-colors"
                title="Hubungi Admin WhatsApp Langsung"
              >
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                <span>WA Admin:</span>
                <span className="font-mono text-white underline decoration-emerald-500/50 underline-offset-2">
                  {formatDisplayPhone(config.adminWhatsApp || DEFAULT_ADMIN_WA)}
                </span>
              </a>

              <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'} shrink-0`} />
                <span className="hidden sm:inline text-slate-300">{isOnline ? 'Online' : 'Mode Offline (Lokal)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Header Bar with Mobile Drawer Toggle & Quick Actions */}
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 shadow-xs print:hidden transition-all">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            {/* Left: Hamburger (Mobile) + Current View Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-base sm:text-lg font-bold font-serif-academic text-slate-900 dark:text-white capitalize">
                  {activeTab === 'dashboard' && 'SIADIK (SISTEM ABSENSI DIGITAL KITA)'}
                  {activeTab === 'teachers' && 'Data Guru & Pendidik'}
                  {activeTab === 'students' && 'Data Siswa'}
                  {activeTab === 'parents' && 'Data Orang Tua / Wali'}
                  {activeTab === 'classes' && 'Data KElas (Rombel)'}
                  {activeTab === 'subjects' && 'Mata Pelajaran'}
                  {activeTab === 'schedules' && 'Jadwal Pelajaran'}
                  {activeTab === 'journals' && 'Jurnal Mengajar Guru (KBM)'}
                  {activeTab === 'attendance' && 'Absensi Harian'}
                  {activeTab === 'recap' && 'Rekap Absensi & Laporan'}
                  {activeTab === 'scanner' && 'Scan QR Code'}
                  {activeTab === 'cards' && 'Cetak Kartu Tanda Pelajar'}
                  {activeTab === 'import' && 'Unggah Data Siswa'}
                  {activeTab === 'sheets' && 'Database Google Sheets'}
                  {activeTab === 'settings' && 'Pengaturan Aplikasi'}
                </h2>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  {config.schoolName} • Tahun Ajaran {config.academicYear}
                </div>
              </div>
            </div>

            {/* Right: PWA Install Button, Quick Sheets indicator & Admin Profile & Settings shortcut */}
            <div className="flex items-center gap-2">
              {/* In-App PWA Install Button */}
              <PWAInstallButton variant="header" />

              <button
                type="button"
                onClick={() => setActiveTab('sheets')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  spreadsheetInfo
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Status Sinkronisasi Google Sheets"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {spreadsheetInfo ? spreadsheetInfo.title : 'Google Sheets'}
                </span>
              </button>

              {/* Admin User Header Badge */}
              {adminSession.user && (
                <div
                  className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  title={`Login sebagai: ${adminSession.user.fullName} (${adminSession.user.role})`}
                >
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {adminSession.user.fullName.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {adminSession.user.fullName}
                  </span>
                </div>
              )}

              {/* Quick Lock / Logout Header Action */}
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                title="Kunci Sesi / Keluar Portal"
              >
                <Lock className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Pengaturan Aplikasi"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* 3. Main Views Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {/* 1. Dasboard */}
          {activeTab === 'dashboard' && (
            <AdminLandingView
              config={config}
              students={students}
              records={records}
              spreadsheetInfo={spreadsheetInfo}
              onNavigate={(tab) => {
                setActiveTab(tab);
                if (tab !== 'cards') setSelectedStudentForCard(null);
              }}
              onNavigateToCards={handleNavigateToCards}
              onOpenDeveloperModal={() => setDeveloperModalOpen(true)}
            />
          )}

          {/* 2. Data Guru */}
          {activeTab === 'teachers' && (
            <TeachersView
              teachers={teachers}
              config={config}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onImportTeachers={handleImportTeachers}
            />
          )}

          {/* 3. Data Siswa */}
          {activeTab === 'students' && (
            <StudentsManagementView
              students={students}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onResetToSampleData={handleResetToSampleData}
              onNavigateToCards={handleNavigateToCards}
              onNavigateToImport={() => setActiveTab('import')}
              onImportStudents={handleImportStudents}
            />
          )}

          {/* 4. Data Orang Tua */}
          {activeTab === 'parents' && (
            <ParentsView
              students={students}
              config={config}
              onUpdateStudent={handleUpdateStudent}
              onImportParents={handleImportParents}
            />
          )}

          {/* 5. Data KElas */}
          {activeTab === 'classes' && (
            <ClassesView
              classes={classes}
              students={students}
              config={config}
              onAddClass={handleAddClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
              onNavigateToStudentsByClass={(clsName) => {
                setActiveTab('students');
              }}
              onImportClasses={handleImportClasses}
            />
          )}

          {/* 6. Mata Pelajaran */}
          {activeTab === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              config={config}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              onImportSubjects={handleImportSubjects}
            />
          )}

          {/* 7. Jadwal */}
          {activeTab === 'schedules' && (
            <SchedulesView
              schedules={schedules}
              config={config}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onImportSchedules={handleImportSchedules}
            />
          )}

          {/* 7b. Jurnal Guru (KBM) */}
          {activeTab === 'journals' && (
            <TeacherJournalsView
              journals={journals}
              teachers={teachers}
              classes={classes}
              subjects={subjects}
              config={config}
              onAddJournal={handleAddJournal}
              onUpdateJournal={handleUpdateJournal}
              onDeleteJournal={handleDeleteJournal}
              onImportJournals={handleImportJournals}
            />
          )}

          {/* 8. Absensi */}
          {activeTab === 'attendance' && (
            <ActiveAttendanceView
              students={students}
              records={records}
              config={config}
              onAddAttendance={handleAddManualAttendance}
              onUpdateRecordStatus={handleUpdateRecordStatus}
              onSetStudentAttendance={handleSetStudentAttendance}
              onBatchSetAttendance={handleBatchSetAttendance}
              onOpenRecordWa={(rec) => {
                const s = students.find((st) => st.id === rec.studentId);
                const phone = s?.parentPhone || config.adminWhatsApp || DEFAULT_ADMIN_WA;
                const msg = `Pemberitahuan Presensi ${config.schoolName}:\nSiswa: ${rec.studentName} (${rec.studentClass})\nStatus: ${rec.status}\nPukul: ${rec.time} WIT\nTanggal: ${rec.date}`;
                window.open(getAdminWhatsAppUrl(phone, msg), '_blank');
              }}
              onOpenAbsentWa={(st) => {
                const phone = st.parentPhone || config.adminWhatsApp || DEFAULT_ADMIN_WA;
                const msg = `Pemberitahuan Sekolah ${config.schoolName}:\nSiswa: ${st.name} (${st.className}) belum tercatat hadir hingga saat ini. Mohon konfirmasi kehadiran.`;
                window.open(getAdminWhatsAppUrl(phone, msg), '_blank');
              }}
              onOpenScanner={() => setActiveTab('scanner')}
            />
          )}

          {/* 9. Rekap Absensi */}
          {activeTab === 'recap' && (
            <AttendanceLogsView
              students={students}
              records={records}
              config={config}
              onUpdateRecordStatus={handleUpdateRecordStatus}
              onDeleteRecord={handleDeleteRecord}
              onAddManualAttendance={handleAddManualAttendance}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {/* 10. Scan QR */}
          {activeTab === 'scanner' && (
            <ScannerView
              students={students}
              records={records}
              config={config}
              spreadsheetInfo={spreadsheetInfo}
              onRecordAttendance={handleRecordAttendance}
              onNavigateToCards={handleNavigateToCards}
              onUpdateStudent={handleUpdateStudent}
              onUpdateConfig={setConfig}
            />
          )}

          {/* Additional Sub-Views */}
          {activeTab === 'cards' && (
            <StudentCardsView
              students={students}
              config={config}
              selectedStudentId={selectedStudentForCard}
              onUpdateStudent={handleUpdateStudent}
              onBatchUpdateStudents={handleBatchUpdateStudentPhotos}
            />
          )}

          {activeTab === 'import' && (
            <StudentImportView
              currentStudentsCount={students.length}
              onImportStudents={handleImportStudents}
              onNavigateToStudents={() => setActiveTab('students')}
              onNavigateToCards={() => setActiveTab('cards')}
              onNavigateToScanner={() => setActiveTab('scanner')}
            />
          )}

          {activeTab === 'sheets' && (
            <GoogleSheetsDatabaseView
              user={user}
              spreadsheetInfo={spreadsheetInfo}
              config={config}
              students={students}
              records={records}
              onSetUser={setUser}
              onSetSpreadsheetInfo={setSpreadsheetInfo}
              onUpdateStudents={setStudents}
              onUpdateRecords={setRecords}
              onShowNotification={showNotification}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              config={config}
              onSaveConfig={setConfig}
              onSessionUserUpdated={(acc) =>
                setAdminSession((prev) => ({
                  ...prev,
                  user: acc,
                }))
              }
            />
          )}
        </main>

        {/* 4. Professional Institutional Multi-Column Footer */}
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-10 pb-8 px-4 sm:px-6 lg:px-8 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Col 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={config.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
                      alt="Maluku"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 p-1 flex items-center justify-center shrink-0">
                    <SchoolLogo
                      src={config.schoolLogoUrl}
                      alt={config.schoolName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Pemerintah Provinsi Maluku
                    </div>
                    <h3 className="font-serif-academic text-sm font-bold text-white leading-tight">
                      {config.schoolName}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistem Informasi Presensi &amp; Identitas Digital Siswa berbasis pemindaian QR Code standar internasional ISO 7810 ID-1 terintegrasi WhatsApp &amp; Cloud Sheets.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-300">
                    <Building2 className="w-3 h-3 text-emerald-400" />
                    NPSN {config.schoolNpsn}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    Provinsi Maluku
                  </span>
                </div>
              </div>

              {/* Col 2 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Menu Utama Portal</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {[
                    { id: 'dashboard', label: '1. SIADIK (Dasboard)' },
                    { id: 'teachers', label: '2. Data Guru' },
                    { id: 'students', label: '3. Data Siswa' },
                    { id: 'parents', label: '4. Data Orang Tua' },
                    { id: 'classes', label: '5. Data KElas' },
                    { id: 'subjects', label: '6. Mata Pelajaran' },
                    { id: 'schedules', label: '7. Jadwal' },
                    { id: 'journals', label: '8. Jurnal Guru' },
                    { id: 'attendance', label: '9. Absensi' },
                    { id: 'recap', label: '10. Rekap Absensi' },
                    { id: 'scanner', label: '11. Scan QR' },
                  ].map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id as ExtendedTab);
                          scrollToTop();
                        }}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group text-left"
                      >
                        <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3: Developer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Pengembang Aplikasi</span>
                </h4>

                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl bg-white p-0.5 shadow-md ring-2 ring-emerald-500/80 overflow-hidden cursor-pointer"
                      onClick={() => setDeveloperModalOpen(true)}
                    >
                      <img
                        src={config.developerPhotoUrl || '/developer_jecky.svg'}
                        alt={config.developerName || 'Jecky Marantika'}
                        className="w-full h-full object-cover rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-xs font-bold text-white truncate cursor-pointer hover:text-emerald-400"
                        onClick={() => setDeveloperModalOpen(true)}
                      >
                        {config.developerName || 'Jecky Marantika, S.Pd., Gr'}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5 truncate">
                        Pengembang &amp; Pendidik
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatDisplayPhone(config.developerWhatsApp || config.adminWhatsApp || DEFAULT_ADMIN_WA)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={getAdminWhatsAppUrl(
                        config.developerWhatsApp || config.adminWhatsApp || DEFAULT_ADMIN_WA,
                        `Halo Bapak Jecky Marantika, S.Pd., Gr, salam dari Presensi ${config.schoolName}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat WA</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeveloperModalOpen(true)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-650 text-white text-xs border border-slate-600"
                    >
                      <span>Profil</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Col 4: Keamanan */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Standar &amp; Keamanan</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-[11px]">ISO 7810 ID-1 Standard</div>
                      <div className="text-[10px] text-slate-400">Dimensi resmi kartu tanda pelajar (85.60 × 53.98 mm).</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2">
                    <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-[11px]">Google Sheets Sync</div>
                      <div className="text-[10px] text-slate-400">Pencadangan data real-time ke spreadsheet Google.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-slate-800 pt-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                © {new Date().getFullYear()} {config.schoolName} • Pemerintah Provinsi Maluku
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Ke Atas</span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border text-xs font-semibold ${
              toastNotification.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-700/80 shadow-emerald-950/20'
                : toastNotification.type === 'error'
                ? 'bg-rose-950 text-white border-rose-700/80 shadow-rose-950/20'
                : 'bg-slate-900 text-white border-slate-700 shadow-slate-950/20'
            }`}
          >
            {toastNotification.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toastNotification.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toastNotification.type === 'info' && (
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{toastNotification.message}</div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 12. Keluar (Logout Confirmation Modal) */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-750 relative space-y-4">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Konfirmasi Keluar dari Portal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin mengakhiri sesi administrasi presensi pada portal {config.schoolName}?
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Sesi Aktif:</div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{adminSession.user?.fullName || 'Administrator SIADIK'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                  {adminSession.user?.role || 'Admin'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Pemerintah Provinsi Maluku • T.A. {config.academicYear}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-750 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  setAdminSession({
                    isAuthenticated: false,
                    user: null,
                    loginTimestamp: 0,
                    rememberMe: false,
                  });
                  setLogoutModalOpen(false);
                  setActiveTab('dashboard');
                  showNotification('Sesi berhasil dikunci dan keluar dari sistem.', 'info');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar / Kunci Sesi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Profile Modal */}
      <DeveloperProfileModal
        isOpen={developerModalOpen}
        onClose={() => setDeveloperModalOpen(false)}
        config={config}
        onUpdateConfig={setConfig}
      />

      {/* Offline Mode Banner & Reconnection Indicator */}
      <OfflineIndicator
        onManualSync={() => {
          showNotification('Mencoba sinkronisasi data presensi dengan Google Sheets...', 'info');
        }}
      />
    </div>
  );
}
