import React, { useState } from 'react';
import {
  School,
  Users,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  DoorOpen,
  ArrowRight,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, SchoolClass, SchoolConfig } from '../../types';
import { formatDisplayPhone } from '../../utils/whatsapp';
import { DataImportModal } from '../common/DataImportModal';
import {
  parseClassFile,
  downloadClassTemplate,
  ClassImportData,
} from '../../utils/dataImportUtils';

interface ClassesViewProps {
  classes: SchoolClass[];
  students: Student[];
  config: SchoolConfig;
  onAddClass: (cls: SchoolClass) => void;
  onUpdateClass: (id: string, updated: Partial<SchoolClass>) => void;
  onDeleteClass: (id: string) => void;
  onNavigateToStudentsByClass: (className: string) => void;
  onImportClasses?: (classes: ClassImportData[], mode: 'append' | 'replace') => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  config,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onNavigateToStudentsByClass,
  onImportClasses,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<'10' | '11' | '12'>('10');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [homeroomTeacherPhone, setHomeroomTeacherPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const openAddModal = () => {
    setEditingClass(null);
    setName('');
    setGrade('10');
    setHomeroomTeacher('');
    setHomeroomTeacherPhone('');
    setRoomNumber('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: SchoolClass) => {
    setEditingClass(c);
    setName(c.name);
    setGrade(c.grade);
    setHomeroomTeacher(c.homeroomTeacher);
    setHomeroomTeacherPhone(c.homeroomTeacherPhone || '');
    setRoomNumber(c.roomNumber);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClass) {
      onUpdateClass(editingClass.id, {
        name,
        grade,
        homeroomTeacher,
        homeroomTeacherPhone,
        roomNumber,
      });
    } else {
      const newClass: SchoolClass = {
        id: 'CLS-' + Date.now(),
        name,
        grade,
        homeroomTeacher,
        homeroomTeacherPhone,
        roomNumber,
        academicYear: config.academicYear,
      };
      onAddClass(newClass);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-slate-750">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 mb-1">
              <School className="w-3.5 h-3.5" />
              Rombongan Belajar (Rombel)
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Data Kelas &amp; Wali Kelas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manajemen rombel, alokasi ruang belajar, dan guru pembina wali kelas di {config.schoolName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-750 text-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Unggah Data Kelas (Excel/CSV)</span>
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const classStudents = students.filter((s) => s.className === cls.name);
          const maleCount = classStudents.filter((s) => s.gender === 'L').length;
          const femaleCount = classStudents.filter((s) => s.gender === 'P').length;

          return (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-850 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-750 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header Card */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Tingkat {cls.grade}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Kelas {cls.name}
                    </h3>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <School className="w-5 h-5" />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                      Ruang Kelas:
                    </span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {cls.roomNumber || 'R. Teori'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 space-y-1">
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Wali Kelas:
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white pl-5">
                      {cls.homeroomTeacher}
                    </div>
                    {cls.homeroomTeacherPhone && (
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                        WA: {formatDisplayPhone(cls.homeroomTeacherPhone)}
                      </div>
                    )}
                  </div>

                  {/* Student Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <div className="text-[10px] text-slate-400">Total</div>
                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {classStudents.length}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40">
                      <div className="text-[10px] text-blue-600 dark:text-blue-400">Laki-laki</div>
                      <div className="text-sm font-bold font-mono text-blue-700 dark:text-blue-300">
                        {maleCount}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-pink-50/60 dark:bg-pink-950/40">
                      <div className="text-[10px] text-pink-600 dark:text-pink-400">Perempuan</div>
                      <div className="text-sm font-bold font-mono text-pink-700 dark:text-pink-300">
                        {femaleCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onNavigateToStudentsByClass(cls.name)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 group-hover:underline cursor-pointer"
                >
                  <span>Lihat {classStudents.length} Siswa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(cls)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus kelas ${cls.name}?`)) {
                        onDeleteClass(cls.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
              {editingClass ? 'Ubah Data Kelas' : 'Tambah Kelas Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Konfigurasi rombel dan penugasan wali kelas
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kelas / Rombel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: X IPAS, XI IPAS 2"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="10">Kelas 10</option>
                    <option value="11">Kelas 11</option>
                    <option value="12">Kelas 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ruang Kelas
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="R. 201"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Wali Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={homeroomTeacher}
                  onChange={(e) => setHomeroomTeacher(e.target.value)}
                  placeholder="Contoh: Dra. Maria Martha Patty, M.Si."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No. WhatsApp Wali Kelas
                </label>
                <input
                  type="text"
                  value={homeroomTeacherPhone}
                  onChange={(e) => setHomeroomTeacherPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Data Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal for Classes */}
      <DataImportModal<ClassImportData>
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Data Kelas (Excel & CSV)"
        entityName="Rombel / Kelas"
        description="Unggah berkas spreadsheet (.xlsx, .xls) atau CSV (.csv) untuk memperbarui daftar rombongan belajar dan wali kelas."
        icon={<School className="w-5 h-5" />}
        currentCount={classes.length}
        onDownloadTemplate={downloadClassTemplate}
        onParseFile={(file) => parseClassFile(file, config.academicYear)}
        onImportData={(data, mode) => {
          if (onImportClasses) {
            onImportClasses(data, mode);
          }
        }}
        previewHeaders={['Nama Kelas', 'Tingkat', 'Wali Kelas', 'No WhatsApp Wali', 'Ruang', 'Tahun Ajaran']}
        renderPreviewRow={(c) => (
          <>
            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
              {c.name}
            </td>
            <td className="py-2 px-3 text-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                Kelas {c.grade}
              </span>
            </td>
            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
              {c.homeroomTeacher}
            </td>
            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
              {c.homeroomTeacherPhone || '-'}
            </td>
            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
              {c.roomNumber}
            </td>
            <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
              {c.academicYear}
            </td>
          </>
        )}
      />
    </div>
  );
};
