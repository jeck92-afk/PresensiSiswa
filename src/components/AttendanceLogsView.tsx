import React, { useState } from 'react';
import {
  Filter,
  ListFilter,
  Calendar,
  CalendarRange,
  FileSpreadsheet,
  BarChart3,
  X,
  FileText,
  Printer,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceType, SchoolConfig } from '../types';
import { getTodayDateString } from '../data/initialData';
import { getCurrentTimeString } from '../utils/time';
import { WhatsAppNotifyModal } from './WhatsAppNotifyModal';
import { BulkWhatsAppModal, BulkWhatsAppTargetType } from './BulkWhatsAppModal';
import { AttendanceFilterLogsView } from './recap/AttendanceFilterLogsView';
import { RecapDailyView } from './recap/RecapDailyView';
import { RecapWeeklyView } from './recap/RecapWeeklyView';
import { RecapMonthlyView } from './recap/RecapMonthlyView';
import { RecapYearlyView } from './recap/RecapYearlyView';
import { AdminAbsenceModal } from './attendance/AdminAbsenceModal';
import { PrintReportModal } from './recap/PrintReportModal';

export type RecapTimeframeType = 'filter' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface AttendanceLogsViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  onUpdateRecordStatus: (recordId: string, newStatus: AttendanceStatus, note?: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onAddManualAttendance: (record: AttendanceRecord) => void;
  onUpdateStudent?: (id: string, updated: Partial<Student>) => void;
}

export const AttendanceLogsView: React.FC<AttendanceLogsViewProps> = ({
  students,
  records,
  config,
  onUpdateRecordStatus,
  onDeleteRecord,
  onAddManualAttendance,
  onUpdateStudent,
}) => {
  // Active timeframe:
  // 'filter' (Filter dataset berdasarkan kelas, status Hadir/Terlambat/Alpa, dan rentang tanggal)
  // 'daily' (per hari)
  // 'weekly' (per minggu)
  // 'monthly' (per bulan)
  // 'yearly' (per tahun)
  const [activeTimeframe, setActiveTimeframe] = useState<RecapTimeframeType>('filter');

  // Selected date for daily view
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('IZIN');
  const [manualType, setManualType] = useState<AttendanceType>('MASUK');
  const [manualNote, setManualNote] = useState<string>('');

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [waModalData, setWaModalData] = useState<{ student: Student; record: AttendanceRecord } | null>(null);

  const [isBulkWaModalOpen, setIsBulkWaModalOpen] = useState<boolean>(false);
  const [bulkWaTargetType, setBulkWaTargetType] = useState<BulkWhatsAppTargetType>('BELUM_HADIR');

  const handleOpenBulkWhatsApp = (target: BulkWhatsAppTargetType = 'BELUM_HADIR') => {
    setBulkWaTargetType(target);
    setIsBulkWaModalOpen(true);
  };

  const handleOpenWhatsAppForRecord = (record: AttendanceRecord) => {
    const student = students.find((s) => s.id === record.studentId);
    if (!student) return;
    setWaModalData({ student, record });
  };

  const handleSendAbsentReminder = (student: Student) => {
    const fakeRecord: AttendanceRecord = {
      id: `ATT-ABSENT-${student.id}-${selectedDate}`,
      studentId: student.id,
      studentNis: student.nis,
      studentNisn: student.nisn,
      studentName: student.name,
      studentClass: student.className,
      gender: student.gender,
      date: selectedDate,
      time: getCurrentTimeString(new Date(), false, config.timeZone || 'WIT'),
      type: 'MASUK',
      status: 'ALPA',
      note: 'Belum hadir / konfirmasi kehadiran',
      timestamp: Date.now(),
    };
    setWaModalData({ student, record: fakeRecord });
  };

  // Handle Manual Attendance Submission
  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) return;

    const student = students.find((s) => s.id === manualStudentId);
    if (!student) return;

    const timeString = getCurrentTimeString(new Date(), true, config.timeZone || 'WIT');

    const newRecord: AttendanceRecord = {
      id: 'ATT-MANUAL-' + Date.now(),
      studentId: student.id,
      studentNis: student.nis,
      studentNisn: student.nisn,
      studentName: student.name,
      studentClass: student.className,
      gender: student.gender,
      date: selectedDate,
      time: timeString,
      type: manualType,
      status: manualStatus,
      note: manualNote || `Dicatat manual (${manualStatus})`,
      timestamp: Date.now(),
    };

    onAddManualAttendance(newRecord);
    setIsManualModalOpen(false);
    setManualStudentId('');
    setManualNote('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Timeframe & Filter Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Rekapitulasi Kehadiran Siswa
            </div>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan &amp; Rekapitulasi Presensi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sistem filter dan analisis kehadiran siswa berdasarkan kelas, status (Hadir, Terlambat, Alpa), serta rentang tanggal
            </p>
          </div>

          {/* Action Tools & Timeframe Selector Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tombol Cetak Laporan (PDF) */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Cetak & ekspor laporan presensi ke dokumen PDF resmi untuk arsip fisik sekolah"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan (PDF)</span>
            </button>

            {/* Timeframe & Filter Selector Pill Tabs */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs self-start md:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTimeframe('filter')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTimeframe === 'filter'
                    ? 'bg-white text-blue-900 shadow-xs border border-blue-200/90 ring-1 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter &amp; Log Riwayat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTimeframe('daily')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTimeframe === 'daily'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Per Hari</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTimeframe('weekly')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTimeframe === 'weekly'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                <span>Per Minggu</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTimeframe('monthly')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTimeframe === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Per Bulan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTimeframe('yearly')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTimeframe === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Per Tahun</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Render Corresponding Recap or Filter View */}
      {activeTimeframe === 'filter' && (
        <AttendanceFilterLogsView
          students={students}
          records={records}
          config={config}
          onUpdateRecordStatus={onUpdateRecordStatus}
          onDeleteRecord={onDeleteRecord}
          onOpenManualModal={() => setIsManualModalOpen(true)}
          onOpenRecordWa={handleOpenWhatsAppForRecord}
          onOpenBulkWa={handleOpenBulkWhatsApp}
          onEditRecord={(r) => setEditingRecord(r)}
        />
      )}

      {activeTimeframe === 'daily' && (
        <RecapDailyView
          students={students}
          records={records}
          config={config}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onUpdateRecordStatus={onUpdateRecordStatus}
          onDeleteRecord={onDeleteRecord}
          onOpenManualModal={() => setIsManualModalOpen(true)}
          onOpenRecordWa={handleOpenWhatsAppForRecord}
          onOpenAbsentWa={handleSendAbsentReminder}
          onOpenBulkWa={handleOpenBulkWhatsApp}
          onEditRecord={(r) => setEditingRecord(r)}
        />
      )}

      {activeTimeframe === 'weekly' && (
        <RecapWeeklyView
          students={students}
          records={records}
          config={config}
        />
      )}

      {activeTimeframe === 'monthly' && (
        <RecapMonthlyView
          students={students}
          records={records}
          config={config}
        />
      )}

      {activeTimeframe === 'yearly' && (
        <RecapYearlyView
          students={students}
          records={records}
          config={config}
        />
      )}

      {/* 3. Sakit, Izin, Alpa & Manual Attendance Modal */}
      <AdminAbsenceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        students={students}
        records={records}
        config={config}
        initialStudentId={manualStudentId}
        initialStatus={manualStatus}
        initialDate={selectedDate}
        initialNote={manualNote}
        onSaveSingle={(sId, d, st, nt, tp) => {
          const existing = records.find(
            (r) => r.studentId === sId && r.date === d && r.type === (tp || 'MASUK')
          );
          if (existing) {
            onUpdateRecordStatus(existing.id, st, nt);
          } else {
            const student = students.find((s) => s.id === sId);
            if (!student) return;
            const timeString = getCurrentTimeString(new Date(), true, config.timeZone || 'WIT');
            onAddManualAttendance({
              id: 'ATT-MANUAL-' + Date.now(),
              studentId: student.id,
              studentNis: student.nis,
              studentNisn: student.nisn,
              studentName: student.name,
              studentClass: student.className,
              gender: student.gender,
              date: d,
              time: timeString,
              type: tp || 'MASUK',
              status: st,
              note: nt,
              timestamp: Date.now(),
            });
          }
          setIsManualModalOpen(false);
        }}
        onSaveBatch={(sIds, d, st, nt, tp) => {
          sIds.forEach((sId, index) => {
            const student = students.find((s) => s.id === sId);
            if (!student) return;
            const existing = records.find(
              (r) => r.studentId === sId && r.date === d && r.type === (tp || 'MASUK')
            );
            if (existing) {
              onUpdateRecordStatus(existing.id, st, nt);
            } else {
              const timeString = getCurrentTimeString(new Date(), true, config.timeZone || 'WIT');
              onAddManualAttendance({
                id: 'ATT-BATCH-' + Date.now() + '-' + index,
                studentId: student.id,
                studentNis: student.nis,
                studentNisn: student.nisn,
                studentName: student.name,
                studentClass: student.className,
                gender: student.gender,
                date: d,
                time: timeString,
                type: tp || 'MASUK',
                status: st,
                note: nt,
                timestamp: Date.now() + index,
              });
            }
          });
          setIsManualModalOpen(false);
        }}
      />

      {/* 4. Edit Status Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Ubah Status Presensi
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Siswa: <strong>{editingRecord.studentName}</strong> ({editingRecord.studentClass})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Baru
                </label>
                <select
                  value={editingRecord.status}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      status: e.target.value as AttendanceStatus,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                >
                  <option value="HADIR">HADIR</option>
                  <option value="TERLAMBAT">TERLAMBAT</option>
                  <option value="IZIN">IZIN</option>
                  <option value="SAKIT">SAKIT</option>
                  <option value="ALPA">ALPA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={editingRecord.note || ''}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      note: e.target.value,
                    })
                  }
                  placeholder="Catatan baru..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateRecordStatus(
                      editingRecord.id,
                      editingRecord.status,
                      editingRecord.note
                    );
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. WhatsApp Notification Modal (Individual) */}
      {waModalData && (
        <WhatsAppNotifyModal
          student={waModalData.student}
          record={waModalData.record}
          config={config}
          isOpen={!!waModalData}
          onClose={() => setWaModalData(null)}
          onUpdateStudentPhone={(studentId, newPhone) => {
            if (onUpdateStudent) {
              onUpdateStudent(studentId, { parentPhone: newPhone });
            }
          }}
        />
      )}

      {/* 6. WhatsApp Bulk Notification Modal */}
      {isBulkWaModalOpen && (
        <BulkWhatsAppModal
          isOpen={isBulkWaModalOpen}
          onClose={() => setIsBulkWaModalOpen(false)}
          initialTargetType={bulkWaTargetType}
          selectedDate={selectedDate}
          selectedClass="ALL"
          students={students}
          records={records}
          config={config}
          onUpdateStudentPhone={(studentId, newPhone) => {
            if (onUpdateStudent) {
              onUpdateStudent(studentId, { parentPhone: newPhone });
            }
          }}
        />
      )}
      {/* 5. Print & Official PDF Archive Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={records}
        students={students}
        config={config}
        defaultTitle="LAPORAN REKAPITULASI PRESENSI SISWA"
        defaultPeriodLabel={`Semua Data Presensi Terkini (${records.length} Catatan)`}
        defaultClass="Semua Rombongan Belajar"
      />
    </div>
  );
};
