import React, { useState } from 'react';
import {
  HeartHandshake,
  Search,
  Phone,
  MessageSquare,
  Users,
  Edit2,
  X,
  Send,
  Building,
  UserCheck,
  CheckCircle,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, SchoolConfig } from '../../types';
import { formatDisplayPhone, getAdminWhatsAppUrl } from '../../utils/whatsapp';
import { DEFAULT_CLASSES } from '../../data/initialData';
import { DataImportModal } from '../common/DataImportModal';
import {
  parseParentFile,
  downloadParentTemplate,
  ParentImportData,
} from '../../utils/dataImportUtils';

interface ParentsViewProps {
  students: Student[];
  config: SchoolConfig;
  onUpdateStudent: (id: string, updated: Partial<Student>) => void;
  onImportParents?: (parents: ParentImportData[], mode: 'append' | 'replace') => void;
}

export const ParentsView: React.FC<ParentsViewProps> = ({
  students,
  config,
  onUpdateStudent,
  onImportParents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const classList = Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery) ||
      (s.parentPhone || '').includes(searchQuery) ||
      (s.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const studentsWithPhone = students.filter((s) => s.parentPhone && s.parentPhone.trim().length > 5).length;
  const studentsWithoutPhone = students.length - studentsWithPhone;

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditPhone(student.parentPhone || '');
    setEditAddress(student.address || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    onUpdateStudent(editingStudent.id, {
      parentPhone: editPhone,
      address: editAddress,
    });
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-slate-750">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 mb-1">
              <HeartHandshake className="w-3.5 h-3.5" />
              Kemitraan Sekolah &amp; Keluarga
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Data Orang Tua &amp; Wali Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola nomor kontak WhatsApp orang tua, alamat domisili, dan saluran komunikasi presensi real-time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah Kontak Ortu (Excel/CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Terdata</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Orang Tua / Wali Siswa</div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kontak WA Terhubung</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {studentsWithPhone}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Siap Terima Notifikasi Presensi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Belum Ada Nomor WA</div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
            {studentsWithoutPhone}
          </div>
          <div className="text-[11px] text-rose-500 mt-0.5">Perlu Pembaruan Data</div>
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
            placeholder="Cari nama siswa, nomor WhatsApp, atau alamat..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Kelas:
          </span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">Semua Kelas ({students.length})</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>
                Kelas {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-750 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Nomor WhatsApp Orang Tua</th>
                <th className="py-3 px-3">Alamat Domisili</th>
                <th className="py-3 px-3 text-center">Status Kontak</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredStudents.map((student, idx) => (
                <tr
                  key={student.id}
                  className="hover:bg-rose-50/30 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {student.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      NIS: {student.nis} • NISN: {student.nisn}
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {student.className}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {student.parentPhone ? (
                      <div className="flex items-center gap-1.5 font-mono text-slate-900 dark:text-slate-100 font-bold">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{formatDisplayPhone(student.parentPhone)}</span>
                      </div>
                    ) : (
                      <span className="text-rose-500 italic font-semibold">
                        Belum diisi
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    <span className="truncate block max-w-xs">{student.address || '-'}</span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {student.parentPhone ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Terhubung</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <span>Belum Ada</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {student.parentPhone && (
                        <a
                          href={getAdminWhatsAppUrl(
                            student.parentPhone,
                            `Halo Bapak/Ibu Wali dari ${student.name} (${student.className}), salam dari Pihak Sekolah ${config.schoolName}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-emerald-200/60 transition-colors"
                          title="Kirim pesan WhatsApp langsung ke orang tua"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(student)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200/60 transition-colors cursor-pointer"
                        title="Ubah nomor WA dan alamat"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-slate-200 dark:border-slate-750">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Perbarui Kontak Orang Tua
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Siswa: <strong>{editingStudent.name}</strong> ({editingStudent.className})
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nomor ini akan digunakan untuk pengiriman laporan presensi otomatis via WhatsApp.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Domisili
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Jl. Pattimura No. ..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal for Parents */}
      <DataImportModal<ParentImportData>
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Kontak Orang Tua / Wali (Excel & CSV)"
        entityName="Kontak Orang Tua"
        description="Unggah berkas spreadsheet (.xlsx, .xls) atau CSV (.csv) untuk memperbarui nomor WhatsApp dan alamat domisili orang tua/wali murid secara massal."
        icon={<HeartHandshake className="w-5 h-5" />}
        currentCount={students.length}
        onDownloadTemplate={downloadParentTemplate}
        onParseFile={parseParentFile}
        onImportData={(data, mode) => {
          if (onImportParents) {
            onImportParents(data, mode);
          }
        }}
        previewHeaders={['NIS Siswa', 'Nama Siswa', 'Nama Orang Tua / Wali', 'Relasi', 'No WhatsApp Ortu', 'Pekerjaan']}
        renderPreviewRow={(p) => (
          <>
            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
              {p.studentNis || '-'}
            </td>
            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
              {p.studentName || '-'}
            </td>
            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
              {p.parentName}
            </td>
            <td className="py-2 px-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                {p.relation}
              </span>
            </td>
            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
              {p.parentPhone}
            </td>
            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
              {p.job || '-'}
            </td>
          </>
        )}
      />
    </div>
  );
};
