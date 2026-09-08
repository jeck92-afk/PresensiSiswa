import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Search,
  School,
  UserCheck,
  DoorOpen,
  Edit2,
  Trash2,
  X,
  BellRing,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { ScheduleItem, SchoolConfig } from '../../types';
import { DEFAULT_CLASSES } from '../../data/initialData';
import { DataImportModal } from '../common/DataImportModal';
import {
  parseScheduleFile,
  downloadScheduleTemplate,
  ScheduleImportData,
} from '../../utils/dataImportUtils';

interface SchedulesViewProps {
  schedules: ScheduleItem[];
  config: SchoolConfig;
  onAddSchedule: (item: ScheduleItem) => void;
  onUpdateSchedule: (id: string, updated: Partial<ScheduleItem>) => void;
  onDeleteSchedule: (id: string) => void;
  onImportSchedules?: (schedules: ScheduleImportData[], mode: 'append' | 'replace') => void;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  schedules,
  config,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onImportSchedules,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Form
  const [day, setDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [className, setClassName] = useState('X IPAS');
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('R. Teori');

  const openAddModal = () => {
    setEditingSchedule(null);
    setDay((selectedDay as any) || 'Senin');
    setClassName(selectedClass === 'ALL' ? 'X IPAS' : selectedClass);
    setSubjectName('');
    setTeacherName('');
    setStartTime('07:30');
    setEndTime('09:00');
    setRoom('R. Teori');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingSchedule(item);
    setDay(item.day);
    setClassName(item.className);
    setSubjectName(item.subjectName);
    setTeacherName(item.teacherName);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setRoom(item.room);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    if (editingSchedule) {
      onUpdateSchedule(editingSchedule.id, {
        day,
        className,
        subjectName,
        teacherName,
        startTime,
        endTime,
        room,
      });
    } else {
      const newItem: ScheduleItem = {
        id: 'SCH-' + Date.now(),
        day,
        className,
        subjectName,
        teacherName,
        startTime,
        endTime,
        room,
      };
      onAddSchedule(newItem);
    }
    setIsModalOpen(false);
  };

  const filteredSchedules = schedules
    .filter((s) => {
      const matchesDay = selectedDay === 'ALL' || s.day === selectedDay;
      const matchesClass = selectedClass === 'ALL' || s.className === selectedClass || s.className === 'Semua Kelas';
      return matchesDay && matchesClass;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-xs border border-slate-200/90 dark:border-slate-750">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 mb-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Jadwal Pembelajaran &amp; Presensi
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Jadwal Pelajaran &amp; Jam Presensi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Alokasi jam pelajaran mingguan dan sinkronisasi batas waktu presensi WIT ({config.timeZone || 'WIT'})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-750 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Unggah Data Jadwal (Excel/CSV)</span>
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. School Timetable & Attendance Policy Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Ketentuan Waktu Presensi Sekolah</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif-academic">
              Waktu Standar Indonesia Timur ({config.timeZone || 'WIT'})
            </h3>
            <p className="text-xs text-slate-300">
              Siswa wajib melakukan pemindaian QR Code sebelum batas toleransi keterlambatan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <div className="text-[10px] text-emerald-300 font-bold uppercase">Batas Tepat Waktu</div>
              <div className="text-lg font-bold font-mono text-white">
                {config.checkInDeadline || '07:15'} WIT
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <div className="text-[10px] text-amber-300 font-bold uppercase">Mulai Jam Pulang</div>
              <div className="text-lg font-bold font-mono text-white">
                {config.checkOutStart || '14:30'} WIT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Day Navigation & Class Filter */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-xs space-y-3">
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedDay === d
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedDay('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDay === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            Semua Hari
          </button>
        </div>

        {/* Class Filter Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 dark:text-slate-400">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {DEFAULT_CLASSES.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-400">
            Ditemukan <strong className="text-slate-900 dark:text-white font-mono">{filteredSchedules.length}</strong> sesi pelajaran
          </div>
        </div>
      </div>

      {/* 4. Timeline / Schedule Items List */}
      <div className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <div className="bg-white dark:bg-slate-850 rounded-3xl p-10 text-center border border-slate-200/90 dark:border-slate-750">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              Tidak ada jadwal pelajaran
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Belum ada mata pelajaran yang dijadwalkan pada hari {selectedDay} untuk kelas yang dipilih.
            </p>
          </div>
        ) : (
          filteredSchedules.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-850 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-750 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                {/* Time Badge */}
                <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 text-center shrink-0">
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {item.day}
                  </div>
                  <div className="font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                    {item.startTime} - {item.endTime}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {item.subjectName}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                      {item.className}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      {item.teacherName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                      {item.room}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus sesi ${item.subjectName} pada hari ${item.day}?`)) {
                      onDeleteSchedule(item.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
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
              {editingSchedule ? 'Ubah Jadwal Pelajaran' : 'Tambah Sesi Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Tentukan hari, waktu, kelas, dan pengajar
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hari
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    {DEFAULT_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                    <option value="Semua Kelas">Semua Kelas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Contoh: Informatika & Literasi Digital"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
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
                  placeholder="Contoh: Jecky Marantika, S.Pd., Gr"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ruang Pembelajaran
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Lab Komputer 01 / R. Teori 201"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal for Schedules */}
      <DataImportModal<ScheduleImportData>
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Jadwal Pelajaran (Excel & CSV)"
        entityName="Jadwal Pelajaran"
        description="Unggah berkas spreadsheet (.xlsx, .xls) atau CSV (.csv) untuk memperbarui susunan jadwal mata pelajaran dan ruang kelas."
        icon={<CalendarDays className="w-5 h-5" />}
        currentCount={schedules.length}
        onDownloadTemplate={downloadScheduleTemplate}
        onParseFile={parseScheduleFile}
        onImportData={(data, mode) => {
          if (onImportSchedules) {
            onImportSchedules(data, mode);
          }
        }}
        previewHeaders={['Hari', 'Kelas', 'Mata Pelajaran', 'Guru Pengajar', 'Waktu', 'Ruang']}
        renderPreviewRow={(sch) => (
          <>
            <td className="py-2 px-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                {sch.day}
              </span>
            </td>
            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
              {sch.className}
            </td>
            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
              {sch.subjectName}
            </td>
            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
              {sch.teacherName}
            </td>
            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
              {sch.startTime} - {sch.endTime}
            </td>
            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
              {sch.room}
            </td>
          </>
        )}
      />
    </div>
  );
};
