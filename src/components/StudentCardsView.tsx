import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Maximize2,
  Search,
  QrCode,
  Sparkles,
  X,
  CreditCard,
  Layers,
  Shield,
  Phone,
  RotateCw,
  Eye,
  CheckCircle2,
  Camera,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';
import { Student, SchoolConfig } from '../types';
import { DEFAULT_CLASSES } from '../data/initialData';
import { createStudentQrPayload, generateQrDataUrl } from '../utils/qr';
import { SchoolLogo } from './SchoolLogo';
import { StudentPhotoUploadModal } from './cards/StudentPhotoUploadModal';

interface StudentCardsViewProps {
  students: Student[];
  config: SchoolConfig;
  selectedStudentId?: string | null;
  onUpdateStudent?: (id: string, updated: Partial<Student>) => void;
  onBatchUpdateStudents?: (updates: { id: string; avatarUrl: string }[]) => void;
}

type CardFaceMode = 'FRONT' | 'BACK' | 'BOTH';
type CardThemeMode = 'NAVY_GOLD' | 'WHITE_ACADEMIC';

export const StudentCardsView: React.FC<StudentCardsViewProps> = ({
  students,
  config,
  selectedStudentId,
  onUpdateStudent,
  onBatchUpdateStudents,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [fullscreenStudent, setFullscreenStudent] = useState<Student | null>(null);
  const [fullscreenQrUrl, setFullscreenQrUrl] = useState<string>('');
  const [cardFaceMode, setCardFaceMode] = useState<CardFaceMode>('FRONT');
  const [cardTheme, setCardTheme] = useState<CardThemeMode>('NAVY_GOLD');
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);
  const [selectedStudentForPhoto, setSelectedStudentForPhoto] = useState<string | null>(null);

  // Extract unique classes
  const classList = Array.from(new Set([...DEFAULT_CLASSES, ...students.map((s) => s.className)])).sort();

  // Generate QR codes for all students
  useEffect(() => {
    let isMounted = true;
    const loadQrs = async () => {
      const map: Record<string, string> = {};
      for (const student of students) {
        const payload = createStudentQrPayload(student);
        const dataUrl = await generateQrDataUrl(payload, 280);
        map[student.id] = dataUrl;
      }
      if (isMounted) {
        setQrMap(map);
      }
    };
    loadQrs();
    return () => {
      isMounted = false;
    };
  }, [students]);

  // Set default filtered query if selectedStudentId is provided
  useEffect(() => {
    if (selectedStudentId) {
      const st = students.find((s) => s.id === selectedStudentId);
      if (st) {
        setSearchQuery(st.name);
      }
    }
  }, [selectedStudentId, students]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
    const matchesSearch =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery) ||
      s.nisn.includes(searchQuery);
    return matchesClass && matchesSearch;
  });

  const handleOpenFullscreenQr = async (student: Student) => {
    setFullscreenStudent(student);
    const url = qrMap[student.id] || (await generateQrDataUrl(createStudentQrPayload(student), 400));
    setFullscreenQrUrl(url);
  };

  const handleDownloadQr = (student: Student) => {
    const dataUrl = qrMap[student.id];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${student.nis}_${student.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper component for Front Card Face
  const renderCardFront = (student: Student, qrUrl?: string) => {
    const isNavy = cardTheme === 'NAVY_GOLD';

    return (
      <div
        className={`p-4 sm:p-5 relative rounded-2xl overflow-hidden transition-all ${
          isNavy
            ? 'bg-gradient-to-br from-[#0c1f38] via-[#09172a] to-[#0c1f38] text-white'
            : 'bg-white text-slate-900 border-2 border-slate-300'
        }`}
      >
        {/* Security watermark pattern */}
        <div
          className={`absolute inset-0 pointer-events-none opacity-10 ${
            isNavy
              ? 'bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]'
              : 'bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:12px_12px]'
          }`}
        />
        {isNavy && (
          <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        )}

        {/* Institutional Kop / Letterhead */}
        <div
          className={`relative flex items-center justify-between pb-3 mb-3.5 border-b ${
            isNavy ? 'border-amber-400/30' : 'border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Logo Provinsi Maluku di Pojok Kiri Atas */}
            <div
              className={`w-10 h-10 rounded-xl p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs ${
                isNavy
                  ? 'bg-white/95 border-2 border-amber-400/40 ring-1 ring-amber-400/20'
                  : 'bg-white border-2 border-emerald-700/30'
              }`}
              title="Pemerintah Provinsi Maluku"
            >
              <img
                src={config.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
                alt="Provinsi Maluku"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Logo Satuan Pendidikan */}
            <div
              className={`w-10 h-10 rounded-xl p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs ${
                isNavy
                  ? 'bg-slate-900 border-2 border-amber-400/40 ring-1 ring-amber-400/20'
                  : 'bg-slate-50 border-2 border-blue-900/30'
              }`}
            >
              <SchoolLogo
                src={config.schoolLogoUrl}
                alt={config.schoolName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[8px] font-black tracking-widest uppercase ${
                    isNavy ? 'text-amber-300' : 'text-blue-900'
                  }`}
                >
                  KARTU TANDA PELAJAR
                </span>
                <span
                  className={`text-[8px] font-mono ${
                    isNavy ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  • PROV. MALUKU
                </span>
              </div>
              <div
                className={`font-serif-academic text-sm sm:text-base font-bold leading-tight truncate ${
                  isNavy ? 'text-white' : 'text-slate-950'
                }`}
              >
                {config.schoolName}
              </div>
              <div
                className={`text-[8px] truncate max-w-xs ${
                  isNavy ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                NPSN: {config.schoolNpsn} • {config.schoolAddress}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`inline-block text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold shadow-xs ${
                isNavy
                  ? 'bg-amber-400/15 text-amber-300 border border-amber-400/40'
                  : 'bg-blue-900 text-white'
              }`}
            >
              KELAS {student.className}
            </span>
          </div>
        </div>

        {/* Card Body: Formal Photo, Detailed Biodata, and Scannable QR Code */}
        <div className="relative grid grid-cols-12 gap-3 items-center">
          {/* Left: Formal Student Photo Frame (3x4 Portrait) */}
          <div className="col-span-3 shrink-0 flex flex-col items-center">
            <div
              className={`w-full aspect-3/4 rounded-xl p-1 shadow-md flex items-center justify-center relative overflow-hidden border-2 group ${
                isNavy
                  ? 'bg-slate-800 border-amber-400/40'
                  : 'bg-slate-100 border-slate-400'
              }`}
            >
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                /* Authentic Indonesian Student Formal Photo Background (Red/Blue backdrop) */
                <div
                  className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-center p-1 relative overflow-hidden ${
                    student.gender === 'L'
                      ? 'bg-gradient-to-b from-blue-700 to-blue-900'
                      : 'bg-gradient-to-b from-rose-700 to-rose-900'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white font-serif-academic font-bold text-lg shadow-sm">
                    {student.name.charAt(0)}
                  </div>
                  <span className="text-[8px] text-white/90 font-bold mt-1 leading-none uppercase tracking-wide">
                    {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
              )}

              {/* Quick photo upload hover badge on card photo frame (hidden when printing) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudentForPhoto(student.id);
                  setIsPhotoUploadModalOpen(true);
                }}
                className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold p-1 cursor-pointer print:hidden"
                title="Ganti / Unggah Pasfoto (JPG/JPEG)"
              >
                <Camera className="w-4 h-4 mb-0.5 text-rose-300" />
                <span className="leading-tight text-center">
                  {student.avatarUrl ? 'Ubah Foto' : 'Unggah JPG'}
                </span>
              </button>
            </div>
            <div
              className={`text-[8px] font-mono font-bold mt-1 text-center ${
                isNavy ? 'text-amber-200' : 'text-slate-700'
              }`}
            >
              NIS: {student.nis}
            </div>
          </div>

          {/* Middle: Student Biodata Fields */}
          <div
            className={`col-span-6 min-w-0 space-y-1.5 ${
              isNavy ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            <div>
              <div
                className={`text-[8px] font-bold uppercase tracking-wider ${
                  isNavy ? 'text-amber-300' : 'text-blue-900'
                }`}
              >
                Nama Lengkap Siswa
              </div>
              <div
                className={`text-xs sm:text-sm font-extrabold truncate leading-snug ${
                  isNavy ? 'text-white' : 'text-slate-950'
                }`}
              >
                {student.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>
                <div
                  className={`text-[8px] font-semibold uppercase ${
                    isNavy ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  NISN
                </div>
                <div
                  className={`font-mono font-bold text-[11px] ${
                    isNavy ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {student.nisn}
                </div>
              </div>
              <div>
                <div
                  className={`text-[8px] font-semibold uppercase ${
                    isNavy ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Rombel / Kelas
                </div>
                <div
                  className={`font-bold text-[11px] ${
                    isNavy ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {student.className}
                </div>
              </div>
            </div>

            <div className="text-[10px]">
              <div
                className={`text-[8px] font-semibold uppercase ${
                  isNavy ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Tgl Lahir / Kontak
              </div>
              <div
                className={`text-[10px] truncate ${
                  isNavy ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {student.birthDate || '-'} • {student.parentPhone || '-'}
              </div>
            </div>
          </div>

          {/* Right: Integrated Scannable QR Code */}
          <div className="col-span-3 shrink-0 flex flex-col items-center justify-center">
            <div
              className={`bg-white p-1.5 rounded-xl shadow-md flex flex-col items-center border-2 ${
                isNavy ? 'border-amber-400/50' : 'border-blue-900/40'
              }`}
            >
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR Code ${student.name}`}
                  className="w-20 h-20 sm:w-22 sm:h-22 object-contain rounded-md"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-100 flex items-center justify-center rounded-md">
                  <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                </div>
              )}
            </div>
            <div
              className={`text-[8px] font-mono font-bold mt-1 uppercase tracking-wider text-center ${
                isNavy ? 'text-amber-300' : 'text-blue-900'
              }`}
            >
              Scan Presensi
            </div>
          </div>
        </div>

        {/* Card Bottom: Official Validation & Principal Signature Section */}
        <div
          className={`relative mt-3.5 pt-2.5 border-t flex items-end justify-between text-[9px] ${
            isNavy ? 'border-white/15 text-slate-300' : 'border-slate-300 text-slate-600'
          }`}
        >
          <div>
            <div>
              Tahun Ajaran:{' '}
              <strong className={isNavy ? 'text-white' : 'text-slate-900'}>
                {config.academicYear}
              </strong>
            </div>
            <div className="text-[8px] opacity-80">
              Kartu sah tanda pengenal siswa aktif
            </div>
          </div>

          {/* Principal Signature & Stamp Block */}
          <div className="text-right relative pr-1">
            <div className="text-[8px] opacity-80">Kepala Sekolah,</div>
            {/* Authentic Indonesian School Circular Stamp graphic */}
            <div className="relative inline-block mt-0.5">
              <span
                className="absolute -left-7 -top-2 w-14 h-14 rounded-full border-2 border-indigo-500/70 bg-indigo-600/10 flex flex-col items-center justify-center text-[6px] font-black text-indigo-400 rotate-[-10deg] pointer-events-none uppercase tracking-tighter shadow-xs"
                style={{ backdropFilter: 'blur(0.5px)' }}
              >
                <span>DINAS PENDIDIKAN</span>
                <span className="font-serif-academic text-[7px] text-indigo-300">★ CAP RESMI ★</span>
                <span>SEKOLAH</span>
              </span>
              <div
                className={`font-extrabold text-[10px] relative z-10 ${
                  isNavy ? 'text-white' : 'text-slate-900'
                }`}
              >
                {config.principalName}
              </div>
            </div>
            <div className="text-[8px] font-mono opacity-80">
              NIP. {config.principalNip || '19750812 199903 1 005'}
            </div>
          </div>
        </div>

        {/* Micro Barcode Security Band at the very bottom */}
        <div
          className={`mt-2.5 pt-1 border-t flex items-center justify-between opacity-70 ${
            isNavy ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}
        >
          <span className="text-[7px] font-mono tracking-widest">
            KARTU TANDA PELAJAR RESMI • TERVERIFIKASI DIGITAL
          </span>
          <span className="text-[7px] font-mono">
            NIS: {student.nis}
          </span>
        </div>
      </div>
    );
  };

  // Helper component for Back Card Face (Tata Tertib & Ketentuan Siswa)
  const renderCardBack = (student: Student) => {
    const isNavy = cardTheme === 'NAVY_GOLD';

    return (
      <div
        className={`p-4 sm:p-5 relative rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
          isNavy
            ? 'bg-gradient-to-br from-[#0c1f38] via-[#09172a] to-[#0c1f38] text-white'
            : 'bg-white text-slate-900 border-2 border-slate-300'
        }`}
      >
        {/* Security watermark pattern */}
        <div
          className={`absolute inset-0 pointer-events-none opacity-10 ${
            isNavy
              ? 'bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]'
              : 'bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:12px_12px]'
          }`}
        />

        {/* Header Back Side */}
        <div
          className={`pb-2.5 mb-2.5 border-b flex items-center justify-between ${
            isNavy ? 'border-amber-400/30' : 'border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${isNavy ? 'text-amber-300' : 'text-blue-900'}`} />
            <h4
              className={`font-serif-academic text-xs sm:text-sm font-bold tracking-wide uppercase ${
                isNavy ? 'text-amber-300' : 'text-blue-950'
              }`}
            >
              Ketentuan & Tata Tertib Siswa
            </h4>
          </div>
          <span className="text-[9px] font-mono font-bold opacity-70">SISI BELAKANG</span>
        </div>

        {/* 5 Official Code of Conduct Rules */}
        <div className="space-y-1.5 text-[9px] sm:text-[10px] leading-relaxed my-1">
          <div className="flex items-start gap-1.5">
            <span className={`font-bold ${isNavy ? 'text-amber-300' : 'text-blue-900'}`}>1.</span>
            <p className={isNavy ? 'text-slate-200' : 'text-slate-700'}>
              Kartu ini merupakan tanda pengenal resmi dan sah bagi siswa terdaftar di{' '}
              <strong className={isNavy ? 'text-white' : 'text-slate-900'}>
                {config.schoolName}
              </strong>.
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <span className={`font-bold ${isNavy ? 'text-amber-300' : 'text-blue-900'}`}>2.</span>
            <p className={isNavy ? 'text-slate-200' : 'text-slate-700'}>
              Wajib dibawa setiap hari sekolah untuk pemindaian presensi digital kedatangan & kepulangan di gerbang.
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <span className={`font-bold ${isNavy ? 'text-amber-300' : 'text-blue-900'}`}>3.</span>
            <p className={isNavy ? 'text-slate-200' : 'text-slate-700'}>
              Dilarang keras memindahtangankan, meminjamkan, atau menduplikasikan kartu ini kepada pihak lain.
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <span className={`font-bold ${isNavy ? 'text-amber-300' : 'text-blue-900'}`}>4.</span>
            <p className={isNavy ? 'text-slate-200' : 'text-slate-700'}>
              Apabila kartu hilang atau rusak, siswa wajib segera melapor ke bagian Tata Usaha (TU) sekolah.
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <span className={`font-bold ${isNavy ? 'text-amber-300' : 'text-blue-900'}`}>5.</span>
            <p className={isNavy ? 'text-slate-200' : 'text-slate-700'}>
              Bagi yang menemukan kartu ini, mohon kesediaannya mengembalikan ke alamat resmi sekretariat sekolah.
            </p>
          </div>
        </div>

        {/* Emergency School Secretariat Contact Box */}
        <div
          className={`p-2.5 rounded-xl border mt-2 ${
            isNavy
              ? 'bg-slate-900/80 border-slate-700/80 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="text-[8px] font-bold uppercase tracking-wider opacity-80 mb-0.5">
            Sekretariat & Layanan Informasi Sekolah
          </div>
          <div className="text-[9px] font-medium leading-snug">
            {config.schoolAddress}
          </div>
          <div className="text-[8px] font-mono mt-1 opacity-80">
            NPSN: {config.schoolNpsn} • Tahun Ajaran: {config.academicYear}
          </div>
        </div>

        {/* Barcode Graphic Representation for Verification */}
        <div
          className={`mt-2.5 pt-2 border-t flex items-center justify-between ${
            isNavy ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {/* Simulated barcode bars */}
            <div className="flex items-end gap-[1.5px] h-6">
              {[3, 5, 2, 6, 4, 2, 5, 3, 6, 2, 4, 5, 2, 6, 3, 5, 4, 2, 6, 3, 5].map((h, i) => (
                <div
                  key={i}
                  className={`w-[2px] rounded-xs ${isNavy ? 'bg-slate-300' : 'bg-slate-800'}`}
                  style={{ height: `${h * 3.5}px` }}
                />
              ))}
            </div>
            <span className="text-[7px] font-mono tracking-wider opacity-70">
              *{student.nis}*
            </span>
          </div>

          <div className="text-right">
            <div className="text-[7px] font-mono opacity-80 uppercase">
              ID Pelajar: {student.id.slice(0, 8)}
            </div>
            <div className="text-[7px] font-semibold text-emerald-400">
              STATUS: AKTIF
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            Kartu Pelajar & QR Code
          </div>
          <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cetak Kartu Tanda Pelajar
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kartu identitas resmi siswa dilengkapi QR Code unik untuk pemindaian presensi harian di sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Card Style Theme Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCardTheme('NAVY_GOLD')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardTheme === 'NAVY_GOLD'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Navy Emas (PVC)
            </button>
            <button
              type="button"
              onClick={() => setCardTheme('WHITE_ACADEMIC')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardTheme === 'WHITE_ACADEMIC'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Putih Dinas (Hemat Tinta)
            </button>
          </div>

          {/* Card Face Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCardFaceMode('FRONT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardFaceMode === 'FRONT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sisi Depan
            </button>
            <button
              type="button"
              onClick={() => setCardFaceMode('BACK')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardFaceMode === 'BACK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sisi Belakang
            </button>
            <button
              type="button"
              onClick={() => setCardFaceMode('BOTH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                cardFaceMode === 'BOTH'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kedua Sisi
            </button>
          </div>

          {/* Upload Student Photo Button (JPG/JPEG) */}
          <button
            type="button"
            onClick={() => {
              setSelectedStudentForPhoto(null);
              setIsPhotoUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Unggah pasfoto siswa berformat JPG atau JPEG (.jpg/.jpeg, Maksimal 1 MB)"
          >
            <Camera className="w-4 h-4" />
            <span>Unggah Foto Siswa (JPG/JPEG, Maks 1 MB)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-98"
          >
            <Printer className="w-4 h-4" />
            Cetak ({filteredStudents.length} Siswa)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        {/* Class selector chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedClass('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedClass === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kelas ({students.length})
          </button>
          {classList.map((cls) => {
            const count = students.filter((s) => s.className === cls).length;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
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

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau NIS..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif-academic text-base font-bold text-slate-800">
            Tidak ada kartu siswa yang cocok
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Coba ubah kata kunci pencarian atau pilih filter kelas yang berbeda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:p-0">
          {filteredStudents.map((student) => {
            const qrUrl = qrMap[student.id];

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all print:shadow-none print:border print:border-slate-400 print:break-inside-avoid print:rounded-xl"
              >
                {/* Visual ID Card Face(s) */}
                <div className="p-3 sm:p-4 bg-slate-50 space-y-4">
                  {(cardFaceMode === 'FRONT' || cardFaceMode === 'BOTH') && (
                    <div>
                      {cardFaceMode === 'BOTH' && (
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 print:hidden">
                          <Eye className="w-3 h-3 text-blue-600" />
                          Sisi Depan (Identitas Resmi & QR)
                        </div>
                      )}
                      {renderCardFront(student, qrUrl)}
                    </div>
                  )}

                  {(cardFaceMode === 'BACK' || cardFaceMode === 'BOTH') && (
                    <div>
                      {cardFaceMode === 'BOTH' && (
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 print:hidden">
                          <Shield className="w-3 h-3 text-amber-600" />
                          Sisi Belakang (Tata Tertib Siswa)
                        </div>
                      )}
                      {renderCardBack(student)}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons (Hidden on Print) */}
                <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForPhoto(student.id);
                        setIsPhotoUploadModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                      title="Unggah pasfoto resmi siswa bertipe file JPG atau JPEG"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-600" />
                      <span>{student.avatarUrl ? 'Ubah Foto (JPG)' : 'Unggah Foto (JPG)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenFullscreenQr(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                      title="Tampilkan QR layar penuh untuk pemindaian langsung dari HP"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Buka QR HP</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadQr(student)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    title="Unduh file QR Code (PNG)"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unduh PNG</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Photo Upload Modal (JPG / JPEG) */}
      <StudentPhotoUploadModal
        isOpen={isPhotoUploadModalOpen}
        onClose={() => {
          setIsPhotoUploadModalOpen(false);
          setSelectedStudentForPhoto(null);
        }}
        students={students}
        initialSelectedStudentId={selectedStudentForPhoto}
        onUpdateStudent={onUpdateStudent}
        onBatchUpdateStudents={onBatchUpdateStudents}
      />

      {/* Fullscreen QR Modal for direct scanning from student's smartphone */}
      {fullscreenStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setFullscreenStudent(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              QR Presensi Siswa
            </div>

            <h3 className="font-serif-academic text-lg font-bold text-slate-900">
              {fullscreenStudent.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelas {fullscreenStudent.className} • NIS: {fullscreenStudent.nis}
            </p>

            <div className="my-6 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-blue-300 inline-block shadow-inner">
              {fullscreenQrUrl ? (
                <img
                  src={fullscreenQrUrl}
                  alt={`QR ${fullscreenStudent.name}`}
                  className="w-56 h-56 mx-auto object-contain rounded-xl"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-6">
              Arahkan layar ini ke kamera petugas presensi sekolah untuk melakukan pencatatan kehadiran.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadQr(fullscreenStudent)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Simpan Gambar QR
              </button>
              <button
                type="button"
                onClick={() => setFullscreenStudent(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

