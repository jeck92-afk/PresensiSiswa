import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  UserCheck,
  Edit2,
  Trash2,
  X,
  Bookmark,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { SubjectItem, SchoolConfig } from '../../types';
import { DataImportModal } from '../common/DataImportModal';
import {
  parseSubjectFile,
  downloadSubjectTemplate,
  SubjectImportData,
} from '../../utils/dataImportUtils';

interface SubjectsViewProps {
  subjects: SubjectItem[];
  config: SchoolConfig;
  onAddSubject: (subj: SubjectItem) => void;
  onUpdateSubject: (id: string, updated: Partial<SubjectItem>) => void;
  onDeleteSubject: (id: string) => void;
  onImportSubjects?: (subjects: SubjectImportData[], mode: 'append' | 'replace') => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  config,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onImportSubjects,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [category, setCategory] = useState<'Wajib' | 'Peminatan MIPA' | 'Muatan Lokal'>('Wajib');
  const [hoursPerWeek, setHoursPerWeek] = useState(3);

  const openAddModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setTeacherName('');
    setCategory('Wajib');
    setHoursPerWeek(3);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SubjectItem) => {
    setEditingSubject(s);
    setCode(s.code);
    setName(s.name);
    setTeacherName(s.teacherName);
    setCategory(s.category);
    setHoursPerWeek(s.hoursPerWeek);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSubject) {
      onUpdateSubject(editingSubject.id, {
        code,
        name,
        teacherName,
        category,
        hoursPerWeek,
      });
    } else {
      const newSubject: SubjectItem = {
        id: 'SBJ-' + Date.now(),
        code: code || `MP-${Math.floor(100 + Math.random() * 900)}`,
        name,
        teacherName,
        category,
        hoursPerWeek,
      };
      onAddSubject(newSubject);
    }
    setIsModalOpen(false);
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-slate-750">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              Kurikulum Merdeka
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Mata Pelajaran &amp; Muatan Kurikulum
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar mata pelajaran umum, peminatan MIPA, dan muatan lokal kemaritiman di {config.schoolName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-750 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Unggah Data Mapel (Excel/CSV)</span>
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama mata pelajaran, kode, atau guru pengampu..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Kategori:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Wajib">Wajib Nasional</option>
            <option value="Peminatan MIPA">Peminatan MIPA</option>
            <option value="Muatan Lokal">Muatan Lokal</option>
          </select>
        </div>
      </div>

      {/* 3. Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-750 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {s.code}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    s.category === 'Wajib'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200'
                      : s.category === 'Peminatan MIPA'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                      : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200'
                  }`}
                >
                  {s.category}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {s.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{s.teacherName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Beban Belajar:
                </span>
                <strong className="font-mono text-slate-900 dark:text-white">
                  {s.hoursPerWeek} Jam / Pekan
                </strong>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => openEditModal(s)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus mata pelajaran ${s.name}?`)) {
                    onDeleteSubject(s.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-slate-200 dark:border-slate-750">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingSubject ? 'Ubah Mata Pelajaran' : 'Tambah Mapel Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Konfigurasi kode, kategori kurikulum, dan guru pengampu
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Mapel
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="INF-101"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam / Pekan
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Informatika & Literasi Digital"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Guru Pengampu
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Nama guru yang mengajar"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Kurikulum
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Wajib">Wajib Nasional</option>
                  <option value="Peminatan MIPA">Peminatan MIPA</option>
                  <option value="Muatan Lokal">Muatan Lokal (Bahari Maluku)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal for Subjects */}
      <DataImportModal<SubjectImportData>
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Data Mata Pelajaran (Excel & CSV)"
        entityName="Mata Pelajaran"
        description="Unggah berkas spreadsheet (.xlsx, .xls) atau CSV (.csv) untuk memperbarui daftar mata pelajaran, guru pengampu, dan alokasi jam tatap muka."
        icon={<BookOpen className="w-5 h-5" />}
        currentCount={subjects.length}
        onDownloadTemplate={downloadSubjectTemplate}
        onParseFile={parseSubjectFile}
        onImportData={(data, mode) => {
          if (onImportSubjects) {
            onImportSubjects(data, mode);
          }
        }}
        previewHeaders={['Kode Mapel', 'Nama Mata Pelajaran', 'Guru Pengampu', 'Kategori', 'Alokasi Jam']}
        renderPreviewRow={(s) => (
          <>
            <td className="py-2 px-3 font-mono font-bold text-amber-700 dark:text-amber-300">
              {s.code}
            </td>
            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
              {s.name}
            </td>
            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
              {s.teacherName}
            </td>
            <td className="py-2 px-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {s.category}
              </span>
            </td>
            <td className="py-2 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
              {s.hoursPerWeek} JP
            </td>
          </>
        )}
      />
    </div>
  );
};
