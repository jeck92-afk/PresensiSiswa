import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  BookMarked,
  Plus,
  Search,
  Calendar,
  Clock,
  UserCheck,
  School,
  GraduationCap,
  Edit2,
  Trash2,
  X,
  Printer,
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock4,
  RotateCcw,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  Eye,
  Send,
  HelpCircle,
  FileText,
  UserX,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TeacherJournal, TeacherJournalStatus, Teacher, SchoolClass, SubjectItem, SchoolConfig } from '../../types';
import { DataImportModal } from '../common/DataImportModal';
import {
  parseTeacherJournalFile,
  downloadTeacherJournalTemplate,
  TeacherJournalImportData,
} from '../../utils/dataImportUtils';
import { SchoolLogo } from '../SchoolLogo';

interface TeacherJournalsViewProps {
  journals: TeacherJournal[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: SubjectItem[];
  config: SchoolConfig;
  onAddJournal: (journal: TeacherJournal) => void;
  onUpdateJournal: (id: string, updated: Partial<TeacherJournal>) => void;
  onDeleteJournal: (id: string) => void;
  onImportJournals?: (journals: TeacherJournalImportData[], mode: 'append' | 'replace') => void;
}

export const TeacherJournalsView: React.FC<TeacherJournalsViewProps> = ({
  journals,
  teachers,
  classes,
  subjects,
  config,
  onAddJournal,
  onUpdateJournal,
  onDeleteJournal,
  onImportJournals,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, THIS_WEEK, THIS_MONTH, SPECIFIC
  const [specificDate, setSpecificDate] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [detailJournal, setDetailJournal] = useState<TeacherJournal | null>(null);
  const [editingJournal, setEditingJournal] = useState<TeacherJournal | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formLessonPeriod, setFormLessonPeriod] = useState('1 - 2 (2 JP)');
  const [formTimeRange, setFormTimeRange] = useState('07:30 - 09:00');
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formTeacherNip, setFormTeacherNip] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formClassName, setFormClassName] = useState('X IPAS');
  const [formTopic, setFormTopic] = useState('');
  const [formLearningActivities, setFormLearningActivities] = useState('');
  const [formTotalStudents, setFormTotalStudents] = useState<number>(32);
  const [formPresentCount, setFormPresentCount] = useState<number>(32);
  const [formAbsentCount, setFormAbsentCount] = useState<number>(0);
  const [formAbsentNotes, setFormAbsentNotes] = useState('');
  const [formStatus, setFormStatus] = useState<TeacherJournalStatus>('Terlaksana');
  const [formNotes, setFormNotes] = useState('');

  // Handle Teacher selection autofill
  const handleTeacherChange = (teacherName: string) => {
    setFormTeacherName(teacherName);
    const foundTeacher = teachers.find((t) => t.name === teacherName);
    if (foundTeacher) {
      setFormTeacherNip(foundTeacher.nip || '');
      // If teacher has default subject
      if (foundTeacher.subject && !formSubjectName) {
        setFormSubjectName(foundTeacher.subject);
      }
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingJournal(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLessonPeriod('1 - 2 (2 JP)');
    setFormTimeRange('07:30 - 09:00');
    const defaultTeacher = teachers[0]?.name || '';
    setFormTeacherName(defaultTeacher);
    setFormTeacherNip(teachers[0]?.nip || '');
    setFormSubjectName(subjects[0]?.name || teachers[0]?.subject || 'Informatika & Literasi Digital');
    setFormClassName(classes[0]?.name || 'X IPAS');
    setFormTopic('');
    setFormLearningActivities('');
    setFormTotalStudents(32);
    setFormPresentCount(32);
    setFormAbsentCount(0);
    setFormAbsentNotes('');
    setFormStatus('Terlaksana');
    setFormNotes('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (journal: TeacherJournal) => {
    setEditingJournal(journal);
    setFormDate(journal.date);
    setFormLessonPeriod(journal.lessonPeriod);
    setFormTimeRange(journal.timeRange);
    setFormTeacherName(journal.teacherName);
    setFormTeacherNip(journal.teacherNip || '');
    setFormSubjectName(journal.subjectName);
    setFormClassName(journal.className);
    setFormTopic(journal.topic);
    setFormLearningActivities(journal.learningActivities);
    setFormTotalStudents(journal.totalStudents);
    setFormPresentCount(journal.presentCount);
    setFormAbsentCount(journal.absentCount);
    setFormAbsentNotes(journal.absentNotes || '');
    setFormStatus(journal.status);
    setFormNotes(journal.notes || '');
    setIsFormModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeacherName.trim() || !formSubjectName.trim() || !formTopic.trim()) {
      return;
    }

    if (editingJournal) {
      onUpdateJournal(editingJournal.id, {
        date: formDate,
        lessonPeriod: formLessonPeriod,
        timeRange: formTimeRange,
        teacherName: formTeacherName,
        teacherNip: formTeacherNip || undefined,
        subjectName: formSubjectName,
        className: formClassName,
        topic: formTopic,
        learningActivities: formLearningActivities,
        totalStudents: formTotalStudents,
        presentCount: formPresentCount,
        absentCount: formAbsentCount,
        absentNotes: formAbsentNotes || undefined,
        status: formStatus,
        notes: formNotes || undefined,
      });
    } else {
      const newJournal: TeacherJournal = {
        id: `JRN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: formDate,
        lessonPeriod: formLessonPeriod,
        timeRange: formTimeRange,
        teacherName: formTeacherName,
        teacherNip: formTeacherNip || undefined,
        subjectName: formSubjectName,
        className: formClassName,
        topic: formTopic,
        learningActivities: formLearningActivities,
        totalStudents: formTotalStudents,
        presentCount: formPresentCount,
        absentCount: formAbsentCount,
        absentNotes: formAbsentNotes || undefined,
        status: formStatus,
        notes: formNotes || undefined,
      };
      onAddJournal(newJournal);
    }
    setIsFormModalOpen(false);
  };

  // Filtered Journals List
  const filteredJournals = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return journals.filter((j) => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        j.teacherName.toLowerCase().includes(q) ||
        j.subjectName.toLowerCase().includes(q) ||
        j.className.toLowerCase().includes(q) ||
        j.topic.toLowerCase().includes(q) ||
        j.learningActivities.toLowerCase().includes(q) ||
        (j.notes && j.notes.toLowerCase().includes(q));

      // Class Filter
      const matchClass = classFilter === 'ALL' || j.className === classFilter;

      // Teacher Filter
      const matchTeacher = teacherFilter === 'ALL' || j.teacherName === teacherFilter;

      // Status Filter
      const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;

      // Date Filter
      let matchDate = true;
      if (dateFilter === 'TODAY') {
        matchDate = j.date === todayStr;
      } else if (dateFilter === 'THIS_WEEK') {
        const jDate = new Date(j.date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24));
        matchDate = diffDays >= 0 && diffDays <= 7;
      } else if (dateFilter === 'THIS_MONTH') {
        const jMonth = j.date.slice(0, 7);
        const curMonth = todayStr.slice(0, 7);
        matchDate = jMonth === curMonth;
      } else if (dateFilter === 'SPECIFIC' && specificDate) {
        matchDate = j.date === specificDate;
      }

      return matchSearch && matchClass && matchTeacher && matchStatus && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journals, searchQuery, classFilter, teacherFilter, statusFilter, dateFilter, specificDate]);

  // Statistics
  const totalEntries = filteredJournals.length;
  const completedEntries = filteredJournals.filter((j) => j.status === 'Terlaksana').length;
  const totalPresent = filteredJournals.reduce((acc, curr) => acc + (curr.presentCount || 0), 0);
  const totalAllStudents = filteredJournals.reduce((acc, curr) => acc + (curr.totalStudents || 0), 0);
  const avgAttendanceRate = totalAllStudents > 0 ? ((totalPresent / totalAllStudents) * 100).toFixed(1) : '100';
  const uniqueTeachersCount = new Set(filteredJournals.map((j) => j.teacherName)).size;

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredJournals.map((j, idx) => ({
      'No': idx + 1,
      'Tanggal': j.date,
      'Jam Pelajaran': j.lessonPeriod,
      'Waktu': j.timeRange,
      'Guru Pengajar': j.teacherName,
      'NIP': j.teacherNip || '-',
      'Mata Pelajaran': j.subjectName,
      'Kelas / Rombel': j.className,
      'Materi Pokok / KD': j.topic,
      'Uraian Kegiatan Pembelajaran': j.learningActivities,
      'Jml Siswa': j.totalStudents,
      'Hadir': j.presentCount,
      'Tidak Hadir': j.absentCount,
      'Keterangan Absen': j.absentNotes || '-',
      'Status': j.status,
      'Catatan Khusus': j.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Mengajar Guru');
    XLSX.writeFile(wb, `Rekap_Jurnal_Guru_${config.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (journal: TeacherJournal) => {
    const message = `*JURNAL MENGAJAR GURU (KBM)*\n` +
      `*${config.schoolName}*\n\n` +
      `📅 *Tanggal:* ${journal.date}\n` +
      `⏰ *Waktu/JP:* ${journal.lessonPeriod} (${journal.timeRange})\n` +
      `👨‍🏫 *Guru:* ${journal.teacherName}\n` +
      `📚 *Mapel:* ${journal.subjectName}\n` +
      `🏫 *Kelas:* ${journal.className}\n` +
      `🎯 *Materi Pokok:* ${journal.topic}\n\n` +
      `📝 *Kegiatan:* ${journal.learningActivities}\n` +
      `👥 *Kehadiran:* ${journal.presentCount}/${journal.totalStudents} Siswa Hadir${journal.absentCount > 0 ? ` (${journal.absentCount} Tidak Hadir)` : ''}\n` +
      (journal.absentNotes ? `⚠️ *Ket. Absen:* ${journal.absentNotes}\n` : '') +
      `📌 *Status:* ${journal.status}\n` +
      (journal.notes ? `💬 *Catatan:* ${journal.notes}\n` : '') +
      `\n_Laporan KBM digital via SIADIK_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const getStatusBadge = (status: TeacherJournalStatus) => {
    switch (status) {
      case 'Terlaksana':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Terlaksana
          </span>
        );
      case 'Tugas Mandiri':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800/80">
            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Tugas Mandiri
          </span>
        );
      case 'Digantikan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
            <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Digantikan
          </span>
        );
      case 'Tertunda':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Tertunda
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>KBM &amp; Administrasi Pembelajaran Guru</span>
          </div>
          <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Jurnal Mengajar Guru
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Pencatatan harian agenda pembelajaran kelas, materi pokok / kompetensi dasar, tingkat kehadiran siswa, serta catatan evaluasi KBM di {config.schoolName}.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Upload Excel / CSV */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Unggah data jurnal dari file Excel (.xlsx) atau CSV (.csv)"
          >
            <UploadCloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Upload Excel / CSV</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
            title="Unduh seluruh rekap data jurnal ke Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Unduh Excel</span>
          </button>

          {/* Cetak Rekap */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 dark:bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Cetak format laporan KBM resmi"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>

          {/* Tambah Jurnal */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Jurnal KBM</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Highlights Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/40">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Jurnal KBM
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalEntries} <span className="text-xs font-medium text-slate-400">Entri</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              KBM Terlaksana
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {completedEntries} <span className="text-xs font-medium text-slate-400">Kelas</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/40">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Kehadiran Siswa
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {avgAttendanceRate}%
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/40">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Guru Pengajar Aktif
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {uniqueTeachersCount} <span className="text-xs font-medium text-slate-400">Guru</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 print:hidden">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru, mata pelajaran, materi pokok / KD, kelas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kelas */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Guru */}
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
          >
            <option value="ALL">Semua Guru</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="Terlaksana">Terlaksana</option>
            <option value="Tugas Mandiri">Tugas Mandiri</option>
            <option value="Digantikan">Digantikan</option>
            <option value="Tertunda">Tertunda</option>
          </select>

          {/* Waktu */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
          >
            <option value="ALL">Semua Tanggal</option>
            <option value="TODAY">Hari Ini</option>
            <option value="THIS_WEEK">7 Hari Terakhir</option>
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="SPECIFIC">Pilih Tanggal...</option>
          </select>

          {dateFilter === 'SPECIFIC' && (
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          )}

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Tabel Administrasi"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Official Printable Header (Visible only when Printing) */}
      <div className="hidden print:block mb-6 p-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div className="w-16 h-16 shrink-0">
            <img
              src={config.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
              alt="Maluku"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center flex-1">
            <h4 className="text-xs font-serif-academic uppercase tracking-widest text-slate-700 font-bold">
              Pemerintah Provinsi Maluku • Dinas Pendidikan dan Kebudayaan
            </h4>
            <h2 className="text-lg font-serif-academic font-black uppercase text-slate-900 mt-0.5">
              {config.schoolName}
            </h2>
            <p className="text-[10px] text-slate-600">
              {config.schoolAddress} • NPSN: {config.schoolNpsn}
            </p>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mt-2 underline decoration-2">
              REKAPITULASI JURNAL MENGAJAR GURU (KBM) • TAHUN AJARAN {config.academicYear}
            </h3>
          </div>
          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            <SchoolLogo size="lg" />
          </div>
        </div>
      </div>

      {/* 5. Main Content: Empty State vs Cards / Table */}
      {filteredJournals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-serif-academic text-lg font-bold text-slate-900 dark:text-white">
            Belum Ada Entri Jurnal Mengajar
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Tidak ditemukan data jurnal yang sesuai dengan kata kunci pencarian atau filter yang dipilih.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Jurnal Baru</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setClassFilter('ALL');
                setTeacherFilter('ALL');
                setStatusFilter('ALL');
                setDateFilter('ALL');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredJournals.map((journal) => {
            const attendancePct =
              journal.totalStudents > 0
                ? Math.round((journal.presentCount / journal.totalStudents) * 100)
                : 100;

            return (
              <div
                key={journal.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-amber-400/60 dark:hover:border-amber-600/60 transition-all flex flex-col overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {journal.className}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {journal.lessonPeriod}
                      </span>
                      {getStatusBadge(journal.status)}
                    </div>
                    <h3 className="font-serif-academic font-bold text-base text-slate-900 dark:text-white truncate">
                      {journal.subjectName}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center justify-end gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{journal.date}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {journal.timeRange}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 space-y-3.5">
                  {/* Teacher Info */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {journal.teacherName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {journal.teacherName}
                      </div>
                      {journal.teacherNip && (
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-400 truncate">
                          NIP: {journal.teacherNip}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Topic / Materi Pokok */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Materi Pokok / KD:</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      {journal.topic}
                    </p>
                  </div>

                  {/* Kegiatan Pembelajaran */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-500" />
                      <span>Uraian Kegiatan:</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {journal.learningActivities}
                    </p>
                  </div>

                  {/* Kehadiran Siswa in Class */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Kehadiran: {journal.presentCount} / {journal.totalStudents} Siswa
                      </span>
                      <span className={`font-mono font-bold text-[11px] ${
                        attendancePct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {attendancePct}%
                      </span>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          attendancePct >= 95
                            ? 'bg-emerald-500'
                            : attendancePct >= 85
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${attendancePct}%` }}
                      />
                    </div>

                    {journal.absentCount > 0 && journal.absentNotes && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium truncate pt-1 flex items-center gap-1">
                        <UserX className="w-3 h-3 shrink-0" />
                        <span>Absen: {journal.absentNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Catatan Khusus */}
                  {journal.notes && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-100 dark:border-amber-900/40 truncate">
                      💬 "{journal.notes}"
                    </div>
                  )}
                </div>

                {/* Card Footer Actions (Hidden on Print) */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => setDetailJournal(journal)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                    title="Lihat format lembar KBM lengkap"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Detail KBM</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Share WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(journal)}
                      className="p-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
                      title="Kirim ringkasan ke WhatsApp"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(journal)}
                      className="p-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                      title="Edit Jurnal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus jurnal KBM ${journal.subjectName} kelas ${journal.className} tanggal ${journal.date}?`)) {
                          onDeleteJournal(journal.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Tanggal / JP</th>
                  <th className="px-4 py-3.5">Guru Pengajar</th>
                  <th className="px-4 py-3.5">Mapel &amp; Kelas</th>
                  <th className="px-4 py-3.5">Materi Pokok / KD</th>
                  <th className="px-4 py-3.5 text-center">Kehadiran</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredJournals.map((j) => (
                  <tr
                    key={j.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {j.date}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {j.lessonPeriod} ({j.timeRange})
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {j.teacherName}
                      </div>
                      {j.teacherNip && (
                        <div className="text-[10px] font-mono text-slate-400">
                          NIP. {j.teacherNip}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {j.subjectName}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mt-0.5">
                        Kelas {j.className}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {j.topic}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {j.learningActivities}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {j.presentCount} / {j.totalStudents}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(j.status)}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailJournal(j)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Lihat Detail KBM"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(j)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus jurnal KBM ${j.subjectName}?`)) {
                              onDeleteJournal(j.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Form Modal: Tambah & Edit Jurnal Mengajar */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-academic text-xl font-bold text-slate-900 dark:text-white">
                  {editingJournal ? 'Edit Jurnal Mengajar Guru' : 'Tambah Jurnal Mengajar KBM'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isi agenda KBM, materi pembelajaran, kehadiran siswa, dan catatan evaluasi kelas.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Row 1: Tanggal, Jam Ke, Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal KBM *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Pelajaran (JP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLessonPeriod}
                    onChange={(e) => setFormLessonPeriod(e.target.value)}
                    placeholder="Contoh: 1 - 2 (2 JP)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rentang Waktu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTimeRange}
                    onChange={(e) => setFormTimeRange(e.target.value)}
                    placeholder="07:30 - 09:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Row 2: Guru Pengajar & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Guru Pengajar *
                  </label>
                  <select
                    value={formTeacherName}
                    onChange={(e) => handleTeacherChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIP Guru
                  </label>
                  <input
                    type="text"
                    value={formTeacherNip}
                    onChange={(e) => setFormTeacherNip(e.target.value)}
                    placeholder="19850612 200902 1 003"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Mata Pelajaran & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas / Rombel *
                  </label>
                  <select
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Materi Pokok / KD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Materi Pokok / Kompetensi Dasar (KD) / Topik Pembelajaran *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Contoh: Pengolahan Data & Logika Pemrograman Visual Scratch..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 leading-relaxed"
                />
              </div>

              {/* Row 5: Uraian Kegiatan Pembelajaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Uraian Kegiatan Pembelajaran / Metode &amp; Evaluasi *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formLearningActivities}
                  onChange={(e) => setFormLearningActivities(e.target.value)}
                  placeholder="Deskripsikan tahapan pembukaan, kegiatan inti (diskusi, eksperimen, latihan), dan penutup..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 leading-relaxed"
                />
              </div>

              {/* Row 6: Kehadiran Siswa */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kehadiran Siswa di Kelas</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Jumlah Siswa
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={formTotalStudents}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormTotalStudents(val);
                        if (formPresentCount > val) setFormPresentCount(val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      Siswa Hadir
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formTotalStudents}
                      value={formPresentCount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormPresentCount(val);
                        setFormAbsentCount(Math.max(0, formTotalStudents - val));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                      Tidak Hadir
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formTotalStudents}
                      value={formAbsentCount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormAbsentCount(val);
                        setFormPresentCount(Math.max(0, formTotalStudents - val));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600 dark:text-rose-400"
                    />
                  </div>
                </div>

                {formAbsentCount > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Keterangan Siswa Tidak Hadir (Nama &amp; Alasan)
                    </label>
                    <input
                      type="text"
                      value={formAbsentNotes}
                      onChange={(e) => setFormAbsentNotes(e.target.value)}
                      placeholder="Contoh: Aldo (Sakit), Siti (Izin dispensasi OSIS)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Row 7: Status & Catatan Khusus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Keterlaksanaan KBM *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TeacherJournalStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    <option value="Terlaksana">Terlaksana Penuh</option>
                    <option value="Tugas Mandiri">Tugas Mandiri / Daring</option>
                    <option value="Digantikan">Guru Pengganti / Inval</option>
                    <option value="Tertunda">Tertunda / Terjadwal Ulang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Khusus / Evaluasi Kelas
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Kondisi kelas, kendala teknis, dll..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {editingJournal ? 'Simpan Perubahan' : 'Simpan Jurnal KBM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Detail & Cetak Lembar Jurnal Resmi */}
      {detailJournal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setDetailJournal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official KOP inside modal */}
            <div className="border-b-2 border-slate-800 dark:border-slate-200 pb-4 mb-5 text-center">
              <h4 className="text-[10px] font-serif-academic uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">
                Dinas Pendidikan dan Kebudayaan Provinsi Maluku
              </h4>
              <h3 className="font-serif-academic text-base sm:text-lg font-black uppercase text-slate-900 dark:text-white">
                {config.schoolName}
              </h3>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mt-1">
                LEMBAR JURNAL MENGAJAR GURU (KBM)
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Tanggal Pelaksanaan</span>
                  <span className="font-bold text-slate-900 dark:text-white">{detailJournal.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Jam &amp; Waktu</span>
                  <span className="font-bold text-slate-900 dark:text-white">{detailJournal.lessonPeriod} ({detailJournal.timeRange})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Guru Pengajar</span>
                  <span className="font-bold text-slate-900 dark:text-white">{detailJournal.teacherName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Kelas / Rombel</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{detailJournal.className}</span>
                </div>
              </div>

              {/* Subject & Topic */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Mata Pelajaran &amp; Materi Pokok</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {detailJournal.subjectName}
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-slate-800 dark:text-slate-200 mt-1 font-semibold leading-relaxed">
                  {detailJournal.topic}
                </div>
              </div>

              {/* Learning Activities */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Uraian Kegiatan Pembelajaran</span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {detailJournal.learningActivities}
                </div>
              </div>

              {/* Attendance & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold block">Presensi Kelas</span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {detailJournal.presentCount} dari {detailJournal.totalStudents} Siswa Hadir
                  </span>
                  {detailJournal.absentNotes && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                      Ket: {detailJournal.absentNotes}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status Kegiatan</span>
                  <div className="mt-1">
                    {getStatusBadge(detailJournal.status)}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Mengetahui,</div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white mt-0.5">Kepala Sekolah</div>
                  <div className="h-12 flex items-center justify-center font-serif text-[10px] italic text-slate-400">
                    (Tanda Tangan &amp; Cap)
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white underline">
                    {config.principalName}
                  </div>
                  {config.principalNip && (
                    <div className="text-[9px] font-mono text-slate-400">
                      NIP. {config.principalNip}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Guru Mata Pelajaran,</div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white mt-0.5">{detailJournal.subjectName}</div>
                  <div className="h-12 flex items-center justify-center font-serif text-[10px] italic text-slate-400">
                    (Tanda Tangan)
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white underline">
                    {detailJournal.teacherName}
                  </div>
                  {detailJournal.teacherNip && (
                    <div className="text-[9px] font-mono text-slate-400">
                      NIP. {detailJournal.teacherNip}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(detailJournal)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Data Import Modal (Excel/CSV Upload) */}
      <DataImportModal<TeacherJournalImportData>
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Upload Data Jurnal Mengajar Guru"
        entityName="Jurnal Mengajar Guru"
        description="Unggah rekaman agenda KBM, materi pokok, dan kehadiran siswa dari file Excel (.xlsx, .xls) atau CSV (.csv)."
        icon={<BookMarked className="w-5 h-5" />}
        currentCount={journals.length}
        onDownloadTemplate={downloadTeacherJournalTemplate}
        onParseFile={parseTeacherJournalFile}
        onImportData={(data, mode) => {
          if (onImportJournals) {
            onImportJournals(data, mode);
          }
        }}
        previewHeaders={['Tanggal', 'Guru', 'Mata Pelajaran', 'Kelas', 'Materi', 'Hadir / Total']}
        renderPreviewRow={(j) => (
          <>
            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
              {j.date}
            </td>
            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
              {j.teacherName}
            </td>
            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
              {j.subjectName}
            </td>
            <td className="py-2 px-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {j.className}
              </span>
            </td>
            <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
              {j.topic}
            </td>
            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
              {j.presentCount} / {j.totalStudents}
            </td>
          </>
        )}
      />
    </div>
  );
};
