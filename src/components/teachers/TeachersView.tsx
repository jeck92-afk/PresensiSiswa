import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Phone,
  Mail,
  UserCheck,
  Shield,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  Award,
  BookOpen,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Teacher, SchoolConfig } from '../../types';
import { formatDisplayPhone, getAdminWhatsAppUrl } from '../../utils/whatsapp';
import { DataImportModal } from '../common/DataImportModal';
import {
  parseTeacherFile,
  downloadTeacherTemplate,
  TeacherImportData,
} from '../../utils/dataImportUtils';

interface TeachersViewProps {
  teachers: Teacher[];
  config: SchoolConfig;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (id: string, updated: Partial<Teacher>) => void;
  onDeleteTeacher: (id: string) => void;
  onImportTeachers?: (teachers: TeacherImportData[], mode: 'append' | 'replace') => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  config,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onImportTeachers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'PNS' | 'PPPK' | 'GTT' | 'Honor'>('PNS');
  const [homeroomClass, setHomeroomClass] = useState('');

  const openAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setNip('');
    setGender('L');
    setSubject('');
    setPhone('');
    setEmail('');
    setStatus('PNS');
    setHomeroomClass('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setName(t.name);
    setNip(t.nip);
    setGender(t.gender);
    setSubject(t.subject);
    setPhone(t.phone);
    setEmail(t.email || '');
    setStatus(t.status);
    setHomeroomClass(t.homeroomClass || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTeacher) {
      onUpdateTeacher(editingTeacher.id, {
        name,
        nip,
        gender,
        subject,
        phone,
        email,
        status,
        homeroomClass: homeroomClass || undefined,
      });
    } else {
      const newTeacher: Teacher = {
        id: 'TCH-' + Date.now(),
        name,
        nip: nip || '-',
        gender,
        subject: subject || 'Tenaga Pendidik',
        phone,
        email,
        status,
        homeroomClass: homeroomClass || undefined,
      };
      onAddTeacher(newTeacher);
    }
    setIsModalOpen(false);
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pnsCount = teachers.filter((t) => t.status === 'PNS').length;
  const pppkCount = teachers.filter((t) => t.status === 'PPPK').length;
  const waliKelasCount = teachers.filter((t) => t.homeroomClass).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-slate-750">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              Pendidik &amp; Tenaga Kependidikan
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Data Guru &amp; Tenaga Pendidik
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola profil pengajar, NIP, penugasan mata pelajaran, dan wali kelas di {config.schoolName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-750 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Unggah Data Guru (Excel/CSV)</span>
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Pengajar</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {teachers.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Aktif Mengajar
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status PNS</div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
            {pnsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Aparatur Sipil Negara</div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status PPPK / Honor</div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
            {pppkCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pegawai Pemerintah PK</div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Wali Kelas</div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
            {waliKelasCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Penanggung Jawab Rombel</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, atau mata pelajaran..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Filter Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
            <option value="GTT">GTT / Honor</option>
          </select>
        </div>
      </div>

      {/* 4. Teachers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-750 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-800/60">
                    {teacher.gender === 'L' ? '👨‍🏫' : '👩‍🏫'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {teacher.name}
                    </h4>
                    <div className="text-[11px] font-mono text-slate-400">
                      NIP. {teacher.nip}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    teacher.status === 'PNS'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {teacher.status}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium truncate">{teacher.subject}</span>
                </div>

                {teacher.homeroomClass && (
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                    <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Wali Kelas: {teacher.homeroomClass}</span>
                  </div>
                )}

                {teacher.phone && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDisplayPhone(teacher.phone)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <a
                href={getAdminWhatsAppUrl(
                  teacher.phone,
                  `Halo Bapak/Ibu ${teacher.name}, salam dari Admin Presensi ${config.schoolName}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat WA</span>
              </a>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(teacher)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  title="Ubah data guru"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus data guru ${teacher.name}?`)) {
                      onDeleteTeacher(teacher.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                  title="Hapus guru"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative border border-slate-200 dark:border-slate-750">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingTeacher ? 'Ubah Data Guru' : 'Tambah Guru Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Lengkapi data profil pendidik di lingkungan {config.schoolName}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dra. Maria Martha Patty, M.Si."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19820319 200801 2 015"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Biologi, Informatika"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT">GTT</option>
                    <option value="Honor">Honor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp Aktif
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Wali Kelas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={homeroomClass}
                    onChange={(e) => setHomeroomClass(e.target.value)}
                    placeholder="Contoh: X IPAS"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Data Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal */}
      <DataImportModal<TeacherImportData>
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Data Guru (Excel & CSV)"
        entityName="Guru / Tenaga Pendidik"
        description="Unggah berkas spreadsheet (.xlsx, .xls) atau CSV (.csv) untuk memperbarui atau menambahkan data guru secara massal."
        icon={<GraduationCap className="w-5 h-5" />}
        currentCount={teachers.length}
        onDownloadTemplate={downloadTeacherTemplate}
        onParseFile={parseTeacherFile}
        onImportData={(data, mode) => {
          if (onImportTeachers) {
            onImportTeachers(data, mode);
          }
        }}
        previewHeaders={['Nama Guru', 'NIP', 'L/P', 'Mata Pelajaran', 'No WhatsApp', 'Status', 'Wali Kelas']}
        renderPreviewRow={(t) => (
          <>
            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
              {t.name}
            </td>
            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
              {t.nip}
            </td>
            <td className="py-2 px-3 text-center">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                t.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
              }`}>
                {t.gender}
              </span>
            </td>
            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
              {t.subject}
            </td>
            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
              {t.phone}
            </td>
            <td className="py-2 px-3">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300">
                {t.status}
              </span>
            </td>
            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
              {t.homeroomClass || '-'}
            </td>
          </>
        )}
      />
    </div>
  );
};
