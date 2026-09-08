import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  MapPin,
  X,
  RotateCcw,
  Check,
  CreditCard,
  QrCode,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, Gender } from '../types';
import { DEFAULT_CLASSES } from '../data/initialData';
import { DataImportModal } from './common/DataImportModal';
import {
  parseStudentFileDirect,
  downloadStudentTemplate,
  StudentImportData,
} from '../utils/dataImportUtils';

interface StudentsManagementViewProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (id: string, updated: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onResetToSampleData: () => void;
  onNavigateToCards: (studentId: string) => void;
  onNavigateToImport?: () => void;
  onImportStudents?: (students: StudentImportData[], mode: 'append' | 'replace') => void;
}

export const StudentsManagementView: React.FC<StudentsManagementViewProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onResetToSampleData,
  onNavigateToCards,
  onNavigateToImport,
  onImportStudents,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [nisn, setNisn] = useState<string>('');
  const [nis, setNis] = useState<string>('');
  const [className, setClassName] = useState<string>('X MIPA 1');
  const [customClass, setCustomClass] = useState<string>('');
  const [gender, setGender] = useState<Gender>('L');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const classList = useMemo(() => {
    const fromStudents = students.map((s) => s.className);
    return Array.from(new Set([...DEFAULT_CLASSES, ...fromStudents])).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.nisn.includes(searchQuery);
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, searchQuery]);

  const resetForm = () => {
    setName('');
    setNisn('');
    setNis('');
    setClassName(classList[0] || 'X IPAS');
    setCustomClass('');
    setGender('L');
    setParentPhone('');
    setBirthDate('');
    setAddress('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (st: Student) => {
    setEditingStudent(st);
    setName(st.name);
    setNisn(st.nisn);
    setNis(st.nis);
    setClassName(st.className);
    setGender(st.gender);
    setParentPhone(st.parentPhone || '');
    setBirthDate(st.birthDate || '');
    setAddress(st.address || '');
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClass = customClass.trim() ? customClass.trim() : className;
    if (!name.trim() || !nisn.trim() || !nis.trim() || !finalClass) return;

    onAddStudent({
      name: name.trim(),
      nisn: nisn.trim(),
      nis: nis.trim(),
      className: finalClass,
      gender,
      parentPhone: parentPhone.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      address: address.trim() || undefined,
    });

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const finalClass = customClass.trim() ? customClass.trim() : className;

    onUpdateStudent(editingStudent.id, {
      name: name.trim(),
      nisn: nisn.trim(),
      nis: nis.trim(),
      className: finalClass,
      gender,
      parentPhone: parentPhone.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      address: address.trim() || undefined,
    });

    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-1">
            <Users className="w-3.5 h-3.5" />
            Database Siswa
          </div>
          <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Data Siswa & Kelas
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola data siswa terdaftar, kode unik NISN/NIS, dan informasi kontak wali murid.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File Siswa (Excel/CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Siswa Baru
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  'Apakah Anda yakin ingin mengatur ulang data siswa ke data contoh bawaan sekolah?'
                )
              ) {
                onResetToSampleData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Kembalikan ke data contoh siswa bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data Contoh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Class selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedClass('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedClass === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({students.length})
          </button>
          {classList.map((cls) => {
            const count = students.filter((s) => s.className === cls).length;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIS, atau NISN..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>
      </div>

      {/* Student List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((st) => (
          <div
            key={st.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                    {st.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate leading-tight">
                      {st.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                        {st.className}
                      </span>
                      <span>•</span>
                      <span>{st.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToCards(st.id)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Lihat & Cetak Kartu Pelajar"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* Student Detail Rows */}
              <div className="space-y-1.5 py-2.5 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">NIS / NISN:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {st.nis} / {st.nisn}
                  </span>
                </div>

                {st.parentPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> No. HP Wali:
                    </span>
                    <span className="font-mono font-medium text-slate-700">
                      {st.parentPhone}
                    </span>
                  </div>
                )}

                {st.birthDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Tgl Lahir:
                    </span>
                    <span className="font-medium text-slate-700">{st.birthDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigateToCards(st.id)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Kartu QR
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(st)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Edit Data Siswa"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus data siswa ${st.name}?`)) {
                      onDeleteStudent(st.id);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Hapus Siswa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Tambah Siswa Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Data yang dimasukkan akan langsung dibuatkan kode QR presensi otomatis.
            </p>

            <form onSubmit={handleSubmitAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Muhammad Rayhan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NISN (10 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="0078129035"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIS Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="23015"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                  >
                    {classList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Kelas Baru Lainnya</option>
                  </select>
                  {className === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder="Ketik nama kelas baru..."
                      value={customClass}
                      onChange={(e) => setCustomClass(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. HP Orang Tua / WA
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="12 Mei 2008"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Rumah
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Merdeka No. 10"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Edit Data Siswa
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui informasi profil siswa {editingStudent.name}.
            </p>

            <form onSubmit={handleSubmitEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIS Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                  >
                    {classList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. HP Orang Tua / WA
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal for Students */}
      <DataImportModal<StudentImportData>
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Data Siswa (Excel & CSV)"
        entityName="Siswa"
        description="Unggah berkas spreadsheet (.xlsx, .xls) atau CSV (.csv) untuk memperbarui data siswa atau menambahkan siswa baru secara massal."
        icon={<Users className="w-5 h-5" />}
        currentCount={students.length}
        onDownloadTemplate={downloadStudentTemplate}
        onParseFile={parseStudentFileDirect}
        onImportData={(data, mode) => {
          if (onImportStudents) {
            onImportStudents(data, mode);
          }
        }}
        previewHeaders={['NIS', 'NISN', 'Nama Siswa', 'Kelas', 'L/P', 'No. HP Ortu / WA', 'Alamat']}
        renderPreviewRow={(st) => (
          <>
            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
              {st.nis}
            </td>
            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
              {st.nisn}
            </td>
            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
              {st.name}
            </td>
            <td className="py-2 px-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {st.className}
              </span>
            </td>
            <td className="py-2 px-3 text-center">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                st.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
              }`}>
                {st.gender}
              </span>
            </td>
            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
              {st.parentPhone || '-'}
            </td>
            <td className="py-2 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
              {st.address || '-'}
            </td>
          </>
        )}
      />
    </div>
  );
};
