import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  TableProperties,
  Search,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Calendar,
  Users,
  GraduationCap,
  School,
  BookOpen,
  BookMarked,
  CheckSquare,
  Settings,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  SchoolConfig,
  Teacher,
  SchoolClass,
  SubjectItem,
  ScheduleItem,
  TeacherJournal,
} from '../types';
import {
  getDatabaseStats,
  DatabaseStats,
  generateDatabaseBackup,
  downloadDatabaseBackupFile,
  validateBackupJson,
  FullDatabaseBackup,
  runDatabaseOptimization,
  STORAGE_KEYS,
  formatBytes,
} from '../services/localStorageDatabaseService';

interface LocalStorageDatabaseViewProps {
  config: SchoolConfig;
  students: Student[];
  records: AttendanceRecord[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: SubjectItem[];
  schedules: ScheduleItem[];
  journals: TeacherJournal[];
  onUpdateConfig: (config: SchoolConfig) => void;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateRecords: (records: AttendanceRecord[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onUpdateClasses: (classes: SchoolClass[]) => void;
  onUpdateSubjects: (subjects: SubjectItem[]) => void;
  onUpdateSchedules: (schedules: ScheduleItem[]) => void;
  onUpdateJournals: (journals: TeacherJournal[]) => void;
  onResetToSampleData: () => void;
  onNavigateToSheets?: () => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

type SubTab = 'overview' | 'inspector' | 'backup_restore' | 'maintenance';
type InspectorTable = 'students' | 'records' | 'teachers' | 'classes' | 'subjects' | 'schedules' | 'journals' | 'config';

export const LocalStorageDatabaseView: React.FC<LocalStorageDatabaseViewProps> = ({
  config,
  students,
  records,
  teachers,
  classes,
  subjects,
  schedules,
  journals,
  onUpdateConfig,
  onUpdateStudents,
  onUpdateRecords,
  onUpdateTeachers,
  onUpdateClasses,
  onUpdateSubjects,
  onUpdateSchedules,
  onUpdateJournals,
  onResetToSampleData,
  onNavigateToSheets,
  onShowNotification,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [stats, setStats] = useState<DatabaseStats>(getDatabaseStats());
  const [selectedTable, setSelectedTable] = useState<InspectorTable>('students');
  const [searchQuery, setSearchQuery] = useState('');

  // Backup & Restore states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<FullDatabaseBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [confirmPurgeRecordsOpen, setConfirmPurgeRecordsOpen] = useState(false);
  const [confirmResetDefaultOpen, setConfirmResetDefaultOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh stats whenever props change
  useEffect(() => {
    setStats(getDatabaseStats());
  }, [students, records, teachers, classes, subjects, schedules, journals, config]);

  const handleDownloadBackup = () => {
    try {
      const backup = generateDatabaseBackup(
        config,
        students,
        records,
        teachers,
        classes,
        subjects,
        schedules,
        journals
      );
      downloadDatabaseBackupFile(backup);
      setStats(getDatabaseStats());
      onShowNotification('Cadangan basis data lokal (.json) berhasil diunduh.', 'success');
    } catch (err: any) {
      console.error(err);
      onShowNotification('Gagal mencadangkan basis data: ' + err.message, 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupJson(content);
      if (validation.valid && validation.data) {
        setRestorePreview(validation.data);
        setRestoreError(null);
      } else {
        setRestorePreview(null);
        setRestoreError(validation.message);
      }
    };
    reader.onerror = () => {
      setRestoreError('Gagal membaca berkas yang diunggah.');
      setRestorePreview(null);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!restorePreview || !restorePreview.data) return;

    const data = restorePreview.data;

    try {
      if (restoreMode === 'replace') {
        if (data.config) onUpdateConfig(data.config);
        if (Array.isArray(data.students)) onUpdateStudents(data.students);
        if (Array.isArray(data.records)) onUpdateRecords(data.records);
        if (Array.isArray(data.teachers)) onUpdateTeachers(data.teachers);
        if (Array.isArray(data.classes)) onUpdateClasses(data.classes);
        if (Array.isArray(data.subjects)) onUpdateSubjects(data.subjects);
        if (Array.isArray(data.schedules)) onUpdateSchedules(data.schedules);
        if (Array.isArray(data.journals)) onUpdateJournals(data.journals);
        onShowNotification('Seluruh basis data lokal berhasil dipulihkan (mode ganti penuh).', 'success');
      } else {
        // Merge mode
        if (Array.isArray(data.students)) {
          const existingNis = new Set(students.map((s) => s.nis));
          const toAdd = data.students.filter((s) => !existingNis.has(s.nis));
          onUpdateStudents([...students, ...toAdd]);
        }
        if (Array.isArray(data.records)) {
          const existingIds = new Set(records.map((r) => r.id));
          const toAdd = data.records.filter((r) => !existingIds.has(r.id));
          onUpdateRecords([...toAdd, ...records]);
        }
        if (Array.isArray(data.teachers)) {
          const existingNips = new Set(teachers.map((t) => t.nip));
          const toAdd = data.teachers.filter((t) => !existingNips.has(t.nip));
          onUpdateTeachers([...teachers, ...toAdd]);
        }
        if (Array.isArray(data.classes)) {
          const existingNames = new Set(classes.map((c) => c.name.toLowerCase()));
          const toAdd = data.classes.filter((c) => !existingNames.has(c.name.toLowerCase()));
          onUpdateClasses([...classes, ...toAdd]);
        }
        if (Array.isArray(data.subjects)) {
          const existingCodes = new Set(subjects.map((s) => s.code.toLowerCase()));
          const toAdd = data.subjects.filter((s) => !existingCodes.has(s.code.toLowerCase()));
          onUpdateSubjects([...subjects, ...toAdd]);
        }
        if (Array.isArray(data.schedules)) {
          const existingIds = new Set(schedules.map((s) => s.id));
          const toAdd = data.schedules.filter((s) => !existingIds.has(s.id));
          onUpdateSchedules([...schedules, ...toAdd]);
        }
        if (Array.isArray(data.journals)) {
          const existingIds = new Set(journals.map((j) => j.id));
          const toAdd = data.journals.filter((j) => !existingIds.has(j.id));
          onUpdateJournals([...toAdd, ...journals]);
        }
        onShowNotification('Basis data lokal berhasil digabungkan dengan berkas cadangan.', 'success');
      }

      setConfirmRestoreOpen(false);
      setRestorePreview(null);
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      onShowNotification('Gagal memulihkan basis data: ' + err.message, 'error');
    }
  };

  const handleRunOptimization = () => {
    const result = runDatabaseOptimization(students, records, classes);
    onUpdateStudents(result.optimizedStudents);
    onUpdateRecords(result.optimizedRecords);

    const totalActions = result.cleanedDuplicates + result.cleanedOrphans + result.normalizedCount;
    if (totalActions > 0) {
      onShowNotification(
        `Optimasi selesai: ${result.cleanedDuplicates} data duplikat dihapus, ${result.cleanedOrphans} data yatim dibersihkan, ${result.normalizedCount} nama kelas distandarkan.`,
        'success'
      );
    } else {
      onShowNotification('Basis data lokal dalam kondisi prima. Tidak ditemukan anomali atau duplikasi.', 'info');
    }
  };

  const handlePurgeAttendanceRecords = () => {
    onUpdateRecords([]);
    setConfirmPurgeRecordsOpen(false);
    onShowNotification('Riwayat log presensi berhasil dikosongkan. Data siswa, guru, dan kelas tetap tersimpan aman.', 'info');
  };

  const handleResetEntireDatabase = () => {
    onResetToSampleData();
    setConfirmResetDefaultOpen(false);
    onShowNotification('Basis data lokal dikembalikan ke data sampel resmi Maluku.', 'info');
  };

  // Export single table to JSON
  const handleExportSingleTableJson = (table: InspectorTable) => {
    let dataToExport: any = [];
    let filename = `tabel_${table}.json`;

    switch (table) {
      case 'students':
        dataToExport = students;
        break;
      case 'records':
        dataToExport = records;
        break;
      case 'teachers':
        dataToExport = teachers;
        break;
      case 'classes':
        dataToExport = classes;
        break;
      case 'subjects':
        dataToExport = subjects;
        break;
      case 'schedules':
        dataToExport = schedules;
        break;
      case 'journals':
        dataToExport = journals;
        break;
      case 'config':
        dataToExport = config;
        break;
    }

    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotification(`Tabel ${table} berhasil diekspor sebagai JSON`, 'success');
  };

  // Inspector Table Data Filter
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery) ||
      s.nisn.includes(searchQuery) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecords = records.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentNis.includes(searchQuery) ||
      r.studentClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.date.includes(searchQuery) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.homeroomTeacher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSchedules = schedules.filter(
    (s) =>
      s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.day.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJournals = journals.filter(
    (j) =>
      j.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Institutional Context */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-700 shadow-xs relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200/70 dark:border-blue-800">
                <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                BASIS DATA LOKAL BROWSER (LOCAL STORAGE)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                100% Offline-Ready
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-serif-academic text-slate-900 dark:text-white tracking-tight">
              Pusat Basis Data &amp; Penyimpanan Lokal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Seluruh data kependidikan, profil siswa, kartu pelajar, dewan guru, dan log absensi QR Code tersimpan secara mandiri di penyimpanan lokal perangkat (Local Storage). Anda dapat mencadangkan, memulihkan, maupun memeriksa isi tabel kapan saja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Cadangkan Database (.JSON)</span>
            </button>

            {onNavigateToSheets && (
              <button
                type="button"
                onClick={onNavigateToSheets}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                title="Buka Basis Data Google Spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Google Sheets</span>
              </button>
            )}
          </div>
        </div>

        {/* Storage Metrics Meter */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ruang Penyimpanan Terpakai
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {stats.totalBytesFormatted}
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.percentUsed > 80 ? 'bg-rose-500' : stats.percentUsed > 50 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.max(4, stats.percentUsed)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>{stats.percentUsed}% dari ~5 MB kuota browser</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Entri Record
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {stats.totalRecords.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Tersebar di {stats.tables.length} tabel lokal</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status Integritas Relasi
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              <span>Optimal</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Struktur JSON valid &amp; sinkron
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cadangan Terakhir
            </div>
            <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1.5 truncate">
              {stats.lastBackupDate || 'Belum pernah diunduh'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Disarankan cadangkan tiap minggu
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Koleksi Tabel Basis Data</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('inspector')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'inspector'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>Penjelajah Data Tabel (Inspector)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backup_restore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'backup_restore'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileJson className="w-4 h-4" />
          <span>Cadangkan &amp; Pulihkan (Backup / Restore)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'maintenance'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Perawatan &amp; Optimasi</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: OVERVIEW (TABEL KOLEKSI) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Daftar Tabel Tersimpan di Local Storage Browser ({stats.tables.length} Tabel)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Klik &quot;Buka Tabel&quot; untuk melihat baris rekaman
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.tables.map((tbl) => (
              <div
                key={tbl.key}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                        {tbl.key}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {tbl.name}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                      {tbl.count} Baris
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                    {tbl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                    Ukuran: {tbl.sizeFormatted}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        ['students', 'records', 'teachers', 'classes', 'subjects', 'schedules', 'journals', 'config'].includes(
                          tbl.tableId
                        )
                      ) {
                        setSelectedTable(tbl.tableId as InspectorTable);
                        setActiveSubTab('inspector');
                      }
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Buka Tabel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INSPECTOR (TABLE DATA VIEWER) */}
      {activeSubTab === 'inspector' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-5">
          {/* Table Selector & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: 'students' as InspectorTable, label: 'Siswa', count: students.length },
                { id: 'records' as InspectorTable, label: 'Presensi', count: records.length },
                { id: 'teachers' as InspectorTable, label: 'Guru', count: teachers.length },
                { id: 'classes' as InspectorTable, label: 'Kelas', count: classes.length },
                { id: 'subjects' as InspectorTable, label: 'Mapel', count: subjects.length },
                { id: 'schedules' as InspectorTable, label: 'Jadwal', count: schedules.length },
                { id: 'journals' as InspectorTable, label: 'Jurnal', count: journals.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTable(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    selectedTable === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[10px] opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari entri data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleExportSingleTableJson(selectedTable)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Ekspor tabel ini sebagai JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ekspor JSON</span>
              </button>
            </div>
          </div>

          {/* Table Content Render */}
          <div className="border border-slate-200/90 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              {/* TABEL SISWA */}
              {selectedTable === 'students' && (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3 font-mono">NIS / NISN</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">No. WA Ortu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Tidak ada data siswa ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{st.name}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {st.nis} / {st.nisn}
                          </td>
                          <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{st.className}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                st.gender === 'L'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {st.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">{st.parentPhone || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TABEL PRESENSI */}
              {selectedTable === 'records' && (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Tipe</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Tidak ada log presensi ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                          <td className="p-3 font-mono text-[11px]">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{r.date}</div>
                            <div className="text-slate-400">{r.time} WIT</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.studentName}</td>
                          <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{r.studentClass}</td>
                          <td className="p-3">
                            <span className="font-mono text-[11px] font-bold">{r.type}</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                r.status === 'HADIR'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : r.status === 'TERLAMBAT'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{r.note || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TABEL GURU */}
              {selectedTable === 'teachers' && (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Guru</th>
                      <th className="p-3 font-mono">NIP</th>
                      <th className="p-3">Mata Pelajaran</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">No. Telepon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Tidak ada data guru ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{t.name}</td>
                          <td className="p-3 font-mono text-[11px]">{t.nip}</td>
                          <td className="p-3 font-medium text-blue-600 dark:text-blue-400">{t.subject}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700">
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">{t.phone}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TABEL KELAS */}
              {selectedTable === 'classes' && (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3">Nama Kelas</th>
                      <th className="p-3">Tingkat</th>
                      <th className="p-3">Wali Kelas</th>
                      <th className="p-3">Ruangan</th>
                      <th className="p-3">Tahun Ajaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClasses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="p-3 font-mono">Kelas {c.grade}</td>
                        <td className="p-3 font-medium text-emerald-600 dark:text-emerald-400">{c.homeroomTeacher}</td>
                        <td className="p-3 font-mono">{c.roomNumber}</td>
                        <td className="p-3 text-slate-500">{c.academicYear}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TABEL MAPEL */}
              {selectedTable === 'subjects' && (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3">Kode</th>
                      <th className="p-3">Nama Mata Pelajaran</th>
                      <th className="p-3">Guru Pengampu</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Beban Jam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSubjects.map((sb) => (
                      <tr key={sb.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{sb.code}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{sb.name}</td>
                        <td className="p-3">{sb.teacherName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700">
                            {sb.category}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{sb.hoursPerWeek} JP/Minggu</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TABEL JADWAL */}
              {selectedTable === 'schedules' && (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3">Hari</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Mata Pelajaran</th>
                      <th className="p-3">Guru</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Ruang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSchedules.map((sc) => (
                      <tr key={sc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{sc.day}</td>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{sc.className}</td>
                        <td className="p-3 font-semibold">{sc.subjectName}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{sc.teacherName}</td>
                        <td className="p-3 font-mono text-[11px]">
                          {sc.startTime} - {sc.endTime} WIT
                        </td>
                        <td className="p-3 font-mono">{sc.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TABEL JURNAL */}
              {selectedTable === 'journals' && (
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Guru &amp; Mapel</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Materi / Topik</th>
                      <th className="p-3">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredJournals.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{j.date}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{j.teacherName}</div>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400">{j.subject}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{j.className}</td>
                        <td className="p-3 max-w-xs truncate">{j.topic}</td>
                        <td className="p-3 font-mono text-[11px]">
                          {j.studentsPresent}/{j.studentsCount} Siswa
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeSubTab === 'backup_restore' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Cadangkan (Export Backup) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                <Download className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Cadangkan Basis Data Lokal (Export .JSON)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Menyimpan seluruh basis data aplikasi saat ini menjadi berkas arsip standar JSON tunggal. Berkas ini mencakup data siswa, kartu pelajar, dewan guru, rombel, mapel, jadwal, log absensi, serta identitas sekolah.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300">Isi Cadangan yang Disertakan:</div>
                <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{students.length} Data Siswa &amp; Pasfoto Digital</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{records.length} Log Riwayat Presensi Masuk &amp; Pulang</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{teachers.length} Data Dewan Guru &amp; Tenaga Pendidik</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{classes.length} Rombongan Belajar (Kelas)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{subjects.length} Mata Pelajaran &amp; {schedules.length} Jadwal Pelajaran</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Pengaturan Institusi, Logo, &amp; Kepala Sekolah</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Lengkap Sekarang (.JSON)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Pulihkan (Restore Backup) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pulihkan Basis Data Lokal (Restore .JSON)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Unggah berkas cadangan JSON yang pernah diunduh sebelumnya untuk memulihkan basis data pada perangkat ini atau memindahkan data ke perangkat/laptop lain.
                </p>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 rounded-2xl p-5 text-center transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="backup-file-input"
                />
                <label htmlFor="backup-file-input" className="cursor-pointer block">
                  <FileJson className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {restoreFile ? restoreFile.name : 'Pilih atau Tarik Berkas Cadangan JSON'}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Hanya menerima format berkas .json cadangan resmi</p>
                </label>
              </div>

              {restoreError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {restorePreview && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 text-xs">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Berkas Cadangan Valid Terdeteksi!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    <div>Lembaga: {restorePreview.schoolName}</div>
                    <div>Versi: {restorePreview.version}</div>
                    <div>Siswa: {restorePreview.recordsCount.students}</div>
                    <div>Log Presensi: {restorePreview.recordsCount.records}</div>
                    <div>Guru: {restorePreview.recordsCount.teachers}</div>
                    <div>Kelas: {restorePreview.recordsCount.classes}</div>
                  </div>

                  {/* Mode Restore */}
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">Pilih Metode Pemulihan:</div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'replace'}
                          onChange={() => setRestoreMode('replace')}
                          className="text-blue-600"
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Ganti Penuh (Replace)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="text-blue-600"
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Gabungkan (Merge)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                disabled={!restorePreview}
                onClick={() => setConfirmRestoreOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Terapkan Pemulihan Basis Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MAINTENANCE & OPTIMIZATION */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Alat Perawatan &amp; Optimasi Integritas Basis Data
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Jalankan pemeliharaan berkala untuk merawat performa dan kecepatan baca-tulis basis data lokal peramban.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tool 1: Optimasi Integritas */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pindai &amp; Optimalkan</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Mendeteksi dan menghapus duplikasi presensi yang tidak sengaja terklik, membersihkan data yatim, dan merapikan format penamaan rombel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunOptimization}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Jalankan Optimasi
                </button>
              </div>

              {/* Tool 2: Bersihkan Riwayat Presensi */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Kosongkan Log Presensi</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Menghapus seluruh riwayat scan presensi lama (misalnya saat memasuki semester baru). Data siswa, guru, jadwal, dan kelas tetap utuh.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmPurgeRecordsOpen(true)}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Bersihkan Log Presensi
                </button>
              </div>

              {/* Tool 3: Reset ke Sampel Default */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Reset Data Sampel</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Mengembalikan seluruh tabel basis data lokal kembali ke data sampel resmi Pemerintah Provinsi Maluku.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmResetDefaultOpen(true)}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Reset ke Data Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESTORE BACKUP */}
      {confirmRestoreOpen && restorePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Konfirmasi Pemulihan Basis Data</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {restoreMode === 'replace'
                  ? 'Tindakan ini akan menggantikan seluruh data lokal saat ini dengan isi berkas cadangan.'
                  : 'Tindakan ini akan menambahkan data dari berkas cadangan ke dalam basis data lokal saat ini.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setConfirmRestoreOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
              >
                Ya, Terapkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: PURGE RECORDS */}
      {confirmPurgeRecordsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kosongkan Riwayat Log Presensi?</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Seluruh riwayat presensi harian ({records.length} rekaman) akan dikosongkan. Data siswa, kartu pelajar, dewan guru, dan jadwal KBM tidak akan terpengaruh.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setConfirmPurgeRecordsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePurgeAttendanceRecords}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
              >
                Kosongkan Riwayat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET DEFAULT */}
      {confirmResetDefaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Seluruh Basis Data ke Default?</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Tindakan ini akan mengembalikan seluruh tabel data (siswa, kelas, presensi, guru, mapel, jadwal) ke data sampel awal Pemerintah Provinsi Maluku.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setConfirmResetDefaultOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetEntireDatabase}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
