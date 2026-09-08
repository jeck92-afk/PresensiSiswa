import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Send,
  LogIn,
  LogOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Timer,
  Pause,
  Play,
  Check,
  Info,
  Calendar,
  X,
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolConfig, AttendanceType, AttendanceStatus } from '../types';
import { SpreadsheetInfo } from '../services/googleSheetsService';
import { parseScannedQrData } from '../utils/qr';
import { soundEffects } from '../utils/audio';
import { WhatsAppNotifyModal } from './WhatsAppNotifyModal';
import { QrScanner2DIllustration } from './illustrations/QrScanner2DIllustration';
import { SchoolLogo } from './SchoolLogo';
import {
  formatDisplayPhone,
  isValidWhatsAppPhone,
  openWhatsAppChat,
  buildWhatsAppMessage,
  getAdminWhatsAppUrl,
  DEFAULT_ADMIN_WA,
} from '../utils/whatsapp';
import {
  getCurrentTimeString,
  getTodayDateString,
  getTimeZoneIana,
  getTimeZoneLabel,
} from '../utils/time';

interface ScannerViewProps {
  students: Student[];
  records: AttendanceRecord[];
  config: SchoolConfig;
  spreadsheetInfo?: SpreadsheetInfo | null;
  onRecordAttendance: (newRecord: AttendanceRecord) => { success: boolean; message: string; record?: AttendanceRecord };
  onNavigateToCards: (studentId?: string) => void;
  onUpdateStudent?: (id: string, updated: Partial<Student>) => void;
  onUpdateConfig?: (updated: SchoolConfig) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  students,
  records,
  config,
  spreadsheetInfo,
  onRecordAttendance,
  onNavigateToCards,
  onUpdateStudent,
  onUpdateConfig,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedResult, setLastScannedResult] = useState<{
    record: AttendanceRecord;
    student: Student;
    message: string;
    isDuplicate?: boolean;
  } | null>(null);
  const [manualQuery, setManualQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [scanMode, setScanMode] = useState<'AUTO' | 'MASUK' | 'PULANG'>(config.scanMode || 'AUTO');
  const [scanFeedbackAnimation, setScanFeedbackAnimation] = useState<boolean>(false);
  const [waModalData, setWaModalData] = useState<{ student: Student; record: AttendanceRecord } | null>(null);
  const [sentWaRecordIds, setSentWaRecordIds] = useState<Set<string>>(new Set());

  // Auto-Clear scanner state variables
  const [clearCountdown, setClearCountdown] = useState<number | null>(null);
  const [isAutoClearPaused, setIsAutoClearPaused] = useState<boolean>(false);
  const [showAutoClearMenu, setShowAutoClearMenu] = useState<boolean>(false);
  const autoClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoClearIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cancel running auto-clear timer
  const cancelAutoClear = useCallback(() => {
    if (autoClearTimeoutRef.current) {
      clearTimeout(autoClearTimeoutRef.current);
      autoClearTimeoutRef.current = null;
    }
    if (autoClearIntervalRef.current) {
      clearInterval(autoClearIntervalRef.current);
      autoClearIntervalRef.current = null;
    }
    setClearCountdown(null);
  }, []);

  // Manual reset scanner state to allow scanning next student immediately
  const handleManualClearResult = useCallback(() => {
    cancelAutoClear();
    setLastScannedResult(null);
    lastScannedCodeRef.current = '';
    lastScanTimeRef.current = 0;
    setIsAutoClearPaused(false);
  }, [cancelAutoClear]);

  // Pause / Resume auto-clear countdown
  const handleTogglePauseAutoClear = useCallback(() => {
    if (isAutoClearPaused) {
      // Resume
      setIsAutoClearPaused(false);
      const delay = clearCountdown && clearCountdown > 0 ? clearCountdown : (config.autoClearDelaySeconds ?? 3);
      setClearCountdown(delay);
      let remaining = delay;
      autoClearIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setClearCountdown(remaining);
        } else {
          if (autoClearIntervalRef.current) {
            clearInterval(autoClearIntervalRef.current);
            autoClearIntervalRef.current = null;
          }
        }
      }, 1000);
      autoClearTimeoutRef.current = setTimeout(() => {
        setLastScannedResult(null);
        lastScannedCodeRef.current = '';
        lastScanTimeRef.current = 0;
        setClearCountdown(null);
        setIsAutoClearPaused(false);
      }, delay * 1000);
    } else {
      // Pause
      setIsAutoClearPaused(true);
      if (autoClearTimeoutRef.current) {
        clearTimeout(autoClearTimeoutRef.current);
        autoClearTimeoutRef.current = null;
      }
      if (autoClearIntervalRef.current) {
        clearInterval(autoClearIntervalRef.current);
        autoClearIntervalRef.current = null;
      }
    }
  }, [isAutoClearPaused, clearCountdown, config.autoClearDelaySeconds]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      cancelAutoClear();
    };
  }, [cancelAutoClear]);

  // Keyboard shortcut: Space or Escape to instantly reset scanner state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.code === 'Space' || e.code === 'Escape') && lastScannedResult) {
        e.preventDefault();
        handleManualClearResult();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastScannedResult, handleManualClearResult]);

  // Determine current active attendance type
  const getCurrentAttendanceType = useCallback((): AttendanceType => {
    if (scanMode === 'MASUK') return 'MASUK';
    if (scanMode === 'PULANG') return 'PULANG';

    // Auto mode: before 12:00 is MASUK, 12:00 onwards is PULANG
    const timeStr = getCurrentTimeString(currentTime, false, config.timeZone || 'WIT');
    const hours = parseInt(timeStr.split(':')[0], 10);
    return hours < 12 ? 'MASUK' : 'PULANG';
  }, [scanMode, currentTime, config.timeZone]);

  const determineStatus = useCallback(
    (type: AttendanceType, timeStr: string): AttendanceStatus => {
      if (type === 'PULANG') return 'HADIR';

      const [hours, minutes] = timeStr.split(':').map(Number);
      const [deadlineHours, deadlineMinutes] = config.checkInDeadline.split(':').map(Number);

      const currentMinutes = hours * 60 + minutes;
      const deadlineTotalMinutes = deadlineHours * 60 + deadlineMinutes;

      return currentMinutes > deadlineTotalMinutes ? 'TERLAMBAT' : 'HADIR';
    },
    [config.checkInDeadline]
  );

  // Process raw QR code text or student ID
  const handleProcessScan = useCallback(
    (codeText: string) => {
      const now = Date.now();
      // Debounce identical scans within 4 seconds
      if (codeText === lastScannedCodeRef.current && now - lastScanTimeRef.current < 4000) {
        return;
      }

      const tzCode = config.timeZone || 'WIT';
      const timeString = getCurrentTimeString(now, true, tzCode);
      const todayString = getTodayDateString(tzCode);
      const attType = getCurrentAttendanceType();

      const student = parseScannedQrData(codeText, students);
      if (!student) {
        if (config.enableAudio) {
          soundEffects.playScanFailure();
        }

        // Tampilkan feedback scan tidak dikenal
        setLastScannedResult({
          record: {
            id: 'ERR-' + Date.now(),
            studentId: 'UNREGISTERED',
            studentNis: codeText.slice(0, 15),
            studentNisn: '-',
            studentName: 'QR Tidak Terdaftar',
            studentClass: '-',
            gender: 'L',
            date: todayString,
            time: timeString,
            type: attType,
            status: 'ALPA',
            note: 'Kode QR tidak dikenali pada pangkalan data siswa',
            timestamp: now,
          },
          student: {
            id: 'UNREGISTERED',
            nis: codeText.slice(0, 15),
            nisn: '-',
            name: 'QR Tidak Dikenal',
            className: 'Tidak Terdaftar',
            gender: 'L',
            photoUrl: '',
            status: 'ACTIVE',
            parentName: '-',
            parentPhone: '',
          },
          message: 'Kode QR tidak terdaftar atau format tidak valid. Silakan coba lagi.',
          isDuplicate: true,
        });

        // Auto-clear error notice setelah 3 detik
        cancelAutoClear();
        setIsAutoClearPaused(false);
        const isAutoClearActive = config.autoClearScanResult !== false;
        const delaySec = Math.max(1, config.autoClearDelaySeconds ?? 3);
        if (isAutoClearActive) {
          setClearCountdown(delaySec);
          let remaining = delaySec;
          autoClearIntervalRef.current = setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
              setClearCountdown(remaining);
            } else {
              if (autoClearIntervalRef.current) {
                clearInterval(autoClearIntervalRef.current);
                autoClearIntervalRef.current = null;
              }
            }
          }, 1000);

          autoClearTimeoutRef.current = setTimeout(() => {
            setLastScannedResult(null);
            lastScannedCodeRef.current = '';
            lastScanTimeRef.current = 0;
            setClearCountdown(null);
            setIsAutoClearPaused(false);
          }, delaySec * 1000);
        }

        setScanFeedbackAnimation(true);
        setTimeout(() => setScanFeedbackAnimation(false), 800);
        return;
      }

      lastScanTimeRef.current = now;
      lastScannedCodeRef.current = codeText;
      const status = determineStatus(attType, timeString);

      // Note calculation
      let note = '';
      if (status === 'TERLAMBAT') {
        const [h, m] = timeString.split(':').map(Number);
        const [dh, dm] = config.checkInDeadline.split(':').map(Number);
        const lateMinutes = h * 60 + m - (dh * 60 + dm);
        note = `Terlambat ${lateMinutes > 0 ? lateMinutes : 1} menit (Batas masuk: ${config.checkInDeadline} ${tzCode})`;
      } else if (status === 'HADIR') {
        note = `Tepat waktu (Hadir sebelum ${config.checkInDeadline} ${tzCode})`;
      } else if (attType === 'PULANG') {
        note = `Presensi pulang berhasil tercatat`;
      }

      const newRecord: AttendanceRecord = {
        id: 'ATT-' + Date.now(),
        studentId: student.id,
        studentNis: student.nis,
        studentNisn: student.nisn,
        studentName: student.name,
        studentClass: student.className,
        gender: student.gender,
        date: todayString,
        time: timeString,
        type: attType,
        status,
        note,
        timestamp: now,
      };

      const result = onRecordAttendance(newRecord);

      if (result.success) {
        // Berhasil: Single Bright Beep diikuti ucapan "TERIMA KASIH"
        if (config.enableAudio) {
          soundEffects.playScanSuccess();
        }
        if (status === 'HADIR') {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#10b981', '#06b6d4', '#3b82f6'],
          });
        }
      } else {
        // Gagal / Duplikat: Single Bright Beep diikuti ucapan "SILAKAN COBA LAGI"
        if (config.enableAudio) {
          soundEffects.playScanFailure();
        }
      }

      const finalRecord = result.record || newRecord;
      setLastScannedResult({
        record: finalRecord,
        student,
        message: result.message,
        isDuplicate: !result.success,
      });

      // Auto open WhatsApp if configured
      if (
        config.enableWhatsAppNotification &&
        config.autoOpenWhatsApp &&
        result.success &&
        student.parentPhone &&
        isValidWhatsAppPhone(student.parentPhone)
      ) {
        const opened = openWhatsAppChat(
          student.parentPhone,
          buildWhatsAppMessage(student, finalRecord, config)
        );
        if (opened) {
          setSentWaRecordIds((prev) => new Set([...prev, finalRecord.id]));
        }
      }

      // Auto-clear scanner state after successful scan or duplicate notice
      // Allows the next student to scan faster without any manual interaction
      cancelAutoClear();
      setIsAutoClearPaused(false);

      const isAutoClearActive = config.autoClearScanResult !== false;
      const delaySec = Math.max(1, config.autoClearDelaySeconds ?? 3);

      if (isAutoClearActive) {
        setClearCountdown(delaySec);
        let remaining = delaySec;

        autoClearIntervalRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining > 0) {
            setClearCountdown(remaining);
          } else {
            if (autoClearIntervalRef.current) {
              clearInterval(autoClearIntervalRef.current);
              autoClearIntervalRef.current = null;
            }
          }
        }, 1000);

        autoClearTimeoutRef.current = setTimeout(() => {
          setLastScannedResult(null);
          lastScannedCodeRef.current = '';
          lastScanTimeRef.current = 0;
          setClearCountdown(null);
          setIsAutoClearPaused(false);
        }, delaySec * 1000);
      }

      setScanFeedbackAnimation(true);
      setTimeout(() => setScanFeedbackAnimation(false), 800);
    },
    [students, config, getCurrentAttendanceType, determineStatus, onRecordAttendance, cancelAutoClear]
  );

  // Camera video stream scan loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleProcessScan(code.data);
      }
    }

    requestAnimationRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleProcessScan]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        requestAnimationRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      const errorObj = err as Error;
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak. Berikan izin kamera di browser untuk memindai QR Code.');
      } else if (errorObj.name === 'NotFoundError') {
        setCameraError('Kamera tidak terdeteksi pada perangkat ini.');
      } else {
        setCameraError('Gagal menghubungkan ke kamera: ' + (errorObj.message || 'Periksa izin kamera'));
      }
    }
  };

  const stopCamera = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Switch front/back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 200);
    }
  };

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Quick manual simulation student list
  const filteredManualStudents = manualQuery.trim()
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(manualQuery.toLowerCase()) ||
          s.nis.includes(manualQuery) ||
          s.nisn.includes(manualQuery) ||
          s.className.toLowerCase().includes(manualQuery.toLowerCase())
      ).slice(0, 5)
    : students.slice(0, 4);

  // Today's stats for current date in school timezone (default WIT)
  const tzIana = getTimeZoneIana(config.timeZone);
  const tzLabel = getTimeZoneLabel(config.timeZone);
  const todayDateStr = getTodayDateString(tzLabel);
  const todayRecords = records.filter((r) => r.date === todayDateStr);
  const attendedStudentIds = new Set(todayRecords.map((r) => r.studentId));
  const totalAttendedToday = attendedStudentIds.size;
  const lateCountToday = todayRecords.filter((r) => r.status === 'TERLAMBAT' && r.type === 'MASUK').length;
  const onTimeCountToday = todayRecords.filter((r) => r.status === 'HADIR' && r.type === 'MASUK').length;
  const attendanceRate = students.length > 0 ? Math.round((totalAttendedToday / students.length) * 100) : 0;

  const activeType = getCurrentAttendanceType();

  const formattedDateIndo = currentTime.toLocaleDateString('id-ID', {
    timeZone: tzIana,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTimeIndo = getCurrentTimeString(currentTime, true, tzLabel);

  return (
    <div className="space-y-6">
      {/* Institutional Command Header & Live Clock */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Terminal Gerbang Presensi
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              <div className="w-4 h-4 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={config.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
                  alt="Maluku"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                <SchoolLogo
                  src={config.schoolLogoUrl}
                  alt={config.schoolName}
                  className="w-full h-full object-contain"
                />
              </div>
              <span>{config.schoolName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Zona {tzLabel} (UTC+9)
            </span>
            {spreadsheetInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-Sync Sheets Aktif
              </span>
            )}
            {/* Direct Admin WhatsApp Help Link for Gate Operators */}
            <a
              href={getAdminWhatsAppUrl(
                config.adminWhatsApp || DEFAULT_ADMIN_WA,
                `Halo Admin Presensi, saya petugas operator pemindai gerbang ${config.schoolName}, membutuhkan bantuan operasional.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Hubungi Admin WhatsApp Langsung jika ada kendala di gerbang"
            >
              <MessageCircle className="w-3 h-3 text-white fill-white" />
              <span>Bantuan Admin WA: {formatDisplayPhone(config.adminWhatsApp || DEFAULT_ADMIN_WA)}</span>
            </a>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Pemindai Presensi QR Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Arahkan QR Code kartu pelajar siswa ke arah kamera untuk validasi instan, pencatatan waktu otomatis, dan deteksi keterlambatan.
          </p>
        </div>

        {/* Live Clock & Shift Status Widget */}
        <div className="flex flex-wrap items-stretch gap-3 shrink-0">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center gap-3.5 shadow-xs border border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {formattedDateIndo}
              </div>
              <div className="text-xl font-black font-mono tracking-wider text-white">
                {formattedTimeIndo}{' '}
                <span className="text-xs font-semibold text-emerald-400">{tzLabel}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 flex flex-col justify-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Toleransi Keterlambatan
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-base font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {config.checkInDeadline} {tzLabel}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                (Pulang: {config.checkOutStart} {tzLabel})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Viewport & Quick Manual Input */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90">
            {/* Professional Mode Selection Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 bg-slate-100/95 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScanMode('AUTO')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
                    scanMode === 'AUTO'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 ring-2 ring-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${scanMode === 'AUTO' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>Mode Otomatis</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold">
                    {activeType}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('MASUK')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
                    scanMode === 'MASUK'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <LogIn className={`w-3.5 h-3.5 ${scanMode === 'MASUK' ? 'text-white' : 'text-blue-500'}`} />
                  <span>Absen Masuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('PULANG')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
                    scanMode === 'PULANG'
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <LogOut className={`w-3.5 h-3.5 ${scanMode === 'PULANG' ? 'text-white' : 'text-indigo-400'}`} />
                  <span>Absen Pulang</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isCameraActive && (
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-2.5 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-2xs active:scale-95"
                    title="Ganti Kamera (Depan / Belakang)"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                )}

                {/* Quick Auto-Clear Control Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAutoClearMenu((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-all border shadow-2xs cursor-pointer active:scale-95 ${
                      config.autoClearScanResult !== false
                        ? 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-800 border-blue-200'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title="Pengaturan Otomatis Reset Layar Pemindai (Auto-Clear Scanner State)"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${config.autoClearScanResult !== false ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="hidden md:inline">
                      {config.autoClearScanResult !== false
                        ? `Auto-Clear: ${config.autoClearDelaySeconds ?? 3}s`
                        : 'Auto-Clear: Off'}
                    </span>
                    <span className="md:hidden">
                      {config.autoClearScanResult !== false ? `${config.autoClearDelaySeconds ?? 3}s` : 'Off'}
                    </span>
                  </button>

                  {/* Popover Menu */}
                  {showAutoClearMenu && (
                    <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-40 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between px-2 py-1 mb-1.5 border-b border-slate-100">
                        <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5 text-blue-600" />
                          Auto-Clear Layar Pemindai
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                          Antrean Cepat
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 px-2 py-1 mb-1 leading-tight">
                        Otomatis mereset layar verifikasi agar siswa berikutnya bisa scan tanpa petugas menekan tombol.
                      </div>

                      <div className="space-y-1">
                        {[
                          { sec: 1, label: '1 Detik', desc: 'Presensi Kilat' },
                          { sec: 2, label: '2 Detik', desc: 'Sangat Cepat' },
                          { sec: 3, label: '3 Detik', desc: 'Standar Ideal' },
                          { sec: 5, label: '5 Detik', desc: 'Santai' },
                        ].map((opt) => {
                          const isActive = config.autoClearScanResult !== false && (config.autoClearDelaySeconds ?? 3) === opt.sec;
                          return (
                            <button
                              key={opt.sec}
                              type="button"
                              onClick={() => {
                                onUpdateConfig?.({
                                  ...config,
                                  autoClearScanResult: true,
                                  autoClearDelaySeconds: opt.sec,
                                });
                                setShowAutoClearMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-blue-50 text-blue-900 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div>
                                <span className="font-bold">{opt.label}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">({opt.desc})</span>
                              </div>
                              {isActive && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </button>
                          );
                        })}

                        <div className="pt-1 mt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateConfig?.({
                                ...config,
                                autoClearScanResult: config.autoClearScanResult === false,
                              });
                              setShowAutoClearMenu(false);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <span>
                              {config.autoClearScanResult === false
                                ? 'Aktifkan Auto-Clear'
                                : 'Nonaktifkan Auto-Clear (Manual)'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateConfig) {
                      const nextState = !config.enableAudio;
                      onUpdateConfig({ ...config, enableAudio: nextState });
                      if (nextState) {
                        soundEffects.playScanSuccess();
                      }
                    } else if (config.enableAudio) {
                      soundEffects.playScanSuccess();
                    }
                  }}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs font-semibold cursor-pointer transition-colors"
                  title={
                    config.enableAudio
                      ? 'Audio & Suara Aktif: Single Bright Beep + Ucapan (Klik untuk uji / toggle)'
                      : 'Audio Hening (Klik untuk mengaktifkan Single Bright Beep & Ucapan)'
                  }
                >
                  {config.enableAudio ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden sm:inline">Audio & Suara Aktif</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline text-slate-500">Audio Hening</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Video / Camera Viewport Box */}
            <div
              className={`relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all shadow-inner ${
                scanFeedbackAnimation
                  ? 'border-emerald-500 ring-4 ring-emerald-500/30'
                  : 'border-slate-800'
              }`}
            >
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Overlay when Camera is On */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {/* Subtle edge vignette */}
                  <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/75" />

                  {/* Top HUD status info */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between text-[11px] font-mono text-slate-300 pointer-events-none">
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>HD 720P • SCANNER AKTIF</span>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-cyan-300 font-bold">
                      SESI: {activeType}
                    </div>
                  </div>

                  {/* Targeted scanning frame with corner brackets */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                    {/* Corner Reticles */}
                    <span className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-cyan-400 rounded-tl-lg" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-cyan-400 rounded-tr-lg" />
                    <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-cyan-400 rounded-bl-lg" />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-cyan-400 rounded-br-lg" />

                    {/* Center Optical Crosshair */}
                    <div className="w-8 h-8 relative opacity-40">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-400 -translate-y-1/2" />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-400 -translate-x-1/2" />
                    </div>

                    {/* Smooth laser scan bar */}
                    <div className="absolute inset-x-2 h-0.5 bg-cyan-400 shadow-[0_0_14px_#22d3ee] animate-scan-laser" />

                    <div className="absolute bottom-3 text-center px-3 py-1 bg-slate-900/90 backdrop-blur-xs rounded-md text-[10px] font-mono text-slate-200 border border-white/10">
                      Posisikan QR Code di dalam kotak
                    </div>
                  </div>
                </div>
              )}

              {/* Inactive Camera State with 2D Illustration */}
              {!isCameraActive && (
                <div className="text-center p-6 sm:p-8 max-w-md mx-auto">
                  <div className="relative mb-4 group">
                    <QrScanner2DIllustration className="w-72 max-w-full h-auto mx-auto drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mb-1.5 tracking-tight">
                    Pemindai Presensi QR Gerbang Siap
                  </h3>
                  <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-sm mx-auto">
                    Arahkan kartu tanda pelajar siswa ke kamera untuk merekam kehadiran, validasi jam masuk, dan auto-sinkron ke Google Sheets.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer border border-blue-400/30"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-cyan-200">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <span>Aktifkan Kamera Pemindai Sekarang</span>
                  </button>
                </div>
              )}

              {/* Real-time HUD Result Overlay directly on Camera Viewport */}
              {lastScannedResult && (
                <div className="absolute inset-x-2 sm:inset-x-4 bottom-2 sm:bottom-3 z-30 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
                  <div
                    className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md border-2 transition-all ${
                      lastScannedResult.record.studentId === 'UNREGISTERED'
                        ? 'bg-slate-950/95 border-rose-500 text-white shadow-rose-950/60'
                        : lastScannedResult.isDuplicate
                        ? 'bg-slate-950/95 border-amber-500 text-white shadow-amber-950/60'
                        : lastScannedResult.record.status === 'TERLAMBAT'
                        ? 'bg-slate-950/95 border-amber-500 text-white shadow-amber-950/60'
                        : 'bg-slate-950/95 border-emerald-500 text-white shadow-emerald-950/60'
                    }`}
                  >
                    {/* Header bar: Status Badge + Time Badge + Close button */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-white/10">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide ${
                            lastScannedResult.record.studentId === 'UNREGISTERED'
                              ? 'bg-rose-500 text-white'
                              : lastScannedResult.isDuplicate
                              ? 'bg-amber-400 text-slate-950'
                              : lastScannedResult.record.type === 'PULANG'
                              ? 'bg-indigo-500 text-white'
                              : lastScannedResult.record.status === 'TERLAMBAT'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-emerald-400 text-slate-950'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {lastScannedResult.record.studentId === 'UNREGISTERED'
                            ? 'QR TIDAK TERDAFTAR'
                            : lastScannedResult.isDuplicate
                            ? 'SUDAH TERCATAT HARI INI'
                            : lastScannedResult.record.type === 'PULANG'
                            ? 'ABSEN PULANG TERKONFIRMASI'
                            : lastScannedResult.record.status === 'TERLAMBAT'
                            ? 'TERCATAT (TERLAMBAT)'
                            : 'TERCATAT (TEPAT WAKTU)'}
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 bg-slate-900/90 px-2 py-0.5 rounded border border-white/10">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {lastScannedResult.record.time} {tzLabel}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleManualClearResult}
                        className="p-1 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                        title="Tutup (Esc/Spasi)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Grid: 3 Main Blocks: Nama Siswa, Waktu Scan, Keterangan */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5 items-stretch">
                      {/* 1. NAMA SISWA */}
                      <div className="sm:col-span-5 bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-base sm:text-lg text-white shrink-0 shadow-md ring-2 ring-white/20 ${
                            lastScannedResult.record.studentId === 'UNREGISTERED'
                              ? 'bg-rose-600'
                              : lastScannedResult.isDuplicate
                              ? 'bg-amber-600'
                              : lastScannedResult.record.status === 'TERLAMBAT'
                              ? 'bg-amber-600'
                              : 'bg-emerald-600'
                          }`}
                        >
                          {lastScannedResult.student.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Nama Siswa
                          </div>
                          <div className="text-sm sm:text-base font-black text-white truncate leading-tight mt-0.5">
                            {lastScannedResult.student.name}
                          </div>
                          <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5 truncate mt-1">
                            <span className="bg-white/15 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              Kelas {lastScannedResult.student.className}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              NIS {lastScannedResult.student.nis}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. WAKTU SCAN */}
                      <div className="sm:col-span-3 bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col justify-center">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>Waktu</span>
                        </div>
                        <div className="text-sm sm:text-base font-mono font-black text-cyan-200 mt-0.5">
                          {lastScannedResult.record.time}{' '}
                          <span className="text-[10px] text-cyan-400 font-bold">{tzLabel}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{lastScannedResult.record.date}</span>
                        </div>
                      </div>

                      {/* 3. KETERANGAN */}
                      <div className="sm:col-span-4 bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col justify-center">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1">
                          <Info className="w-3 h-3 text-slate-400" />
                          <span>Keterangan</span>
                        </div>
                        <div
                          className={`text-xs font-black mt-0.5 truncate leading-tight ${
                            lastScannedResult.record.studentId === 'UNREGISTERED'
                              ? 'text-rose-300'
                              : lastScannedResult.isDuplicate
                              ? 'text-amber-300'
                              : lastScannedResult.record.status === 'TERLAMBAT'
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                          }`}
                        >
                          {lastScannedResult.isDuplicate
                            ? 'Sudah Absen Hari Ini'
                            : lastScannedResult.record.type === 'PULANG'
                            ? 'Presensi Pulang'
                            : lastScannedResult.record.status === 'TERLAMBAT'
                            ? 'Terlambat Masuk'
                            : 'Tepat Waktu'}
                        </div>
                        <div
                          className="text-[10px] text-slate-300 line-clamp-1 mt-0.5 leading-snug"
                          title={lastScannedResult.record.note || lastScannedResult.message}
                        >
                          {lastScannedResult.record.note || lastScannedResult.message}
                        </div>
                      </div>
                    </div>

                    {/* Auto-clear countdown status */}
                    {config.autoClearScanResult !== false && clearCountdown !== null && !isAutoClearPaused && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          <span>
                            Auto-reset siap scan siswa berikutnya dalam{' '}
                            <strong className="text-cyan-300 font-mono font-bold">{clearCountdown}s</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleTogglePauseAutoClear}
                          className="text-[10px] font-bold text-slate-300 hover:text-white underline cursor-pointer"
                        >
                          Tahan Layar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Camera Control Footer */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
              {isCameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200/80 cursor-pointer shadow-2xs active:scale-[0.98]"
                >
                  <CameraOff className="w-4 h-4 text-rose-600" />
                  <span>Nonaktifkan Kamera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all border border-blue-500 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4 text-cyan-200" />
                  <span>Buka Kamera Gerbang</span>
                </button>
              )}

              <div className="text-xs text-slate-500 font-medium">
                Belum memiliki kartu ber-QR? Cetak di menu{' '}
                <button
                  type="button"
                  onClick={() => onNavigateToCards()}
                  className="text-blue-600 font-extrabold hover:underline cursor-pointer"
                >
                  Kartu Pelajar →
                </button>
              </div>
            </div>

            {/* Camera Error Alert */}
            {cameraError && (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold mb-0.5">Pemberitahuan Kamera</div>
                  <div>{cameraError}</div>
                  <div className="mt-1 text-slate-600">
                    Anda dapat menggunakan <strong>Pencarian Cepat Siswa</strong> di bawah untuk mencatat presensi tanpa kamera.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Manual POS Simulation Box */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Input Cepat / Simulasi Presensi
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {filteredManualStudents.length} Siswa
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Cari cepat nama siswa, NIS (cth: 23001), atau kelas..."
                className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredManualStudents.map((st) => {
                const isAlreadyPresentToday = attendedStudentIds.has(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleProcessScan(st.nis)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-extrabold text-slate-800 truncate group-hover:text-blue-700">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] font-semibold text-slate-700">
                          NIS {st.nis}
                        </span>
                        <span>•</span>
                        <span className="font-medium">{st.className}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[11px]">
                      {isAlreadyPresentToday ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px] border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold text-[10px] group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-200/60">
                          <Sparkles className="w-3 h-3" />
                          Presensi
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result Card & Real-time Live Counters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Latest Scanned Verification Dossier Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Verifikasi Hasil Pemindaian
                </h3>
              </div>
              {lastScannedResult && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {lastScannedResult.record.time} {tzLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleManualClearResult}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Tutup kartu verifikasi & reset pemindai (Shortcut: Esc atau Spasi)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Micro progress bar for auto-clear countdown */}
            {lastScannedResult && config.autoClearScanResult !== false && clearCountdown !== null && !isAutoClearPaused && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(clearCountdown / Math.max(1, config.autoClearDelaySeconds ?? 3)) * 100}%`,
                  }}
                />
              </div>
            )}

            {lastScannedResult ? (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  lastScannedResult.isDuplicate
                    ? 'bg-amber-50/80 border-amber-200'
                    : lastScannedResult.record.status === 'TERLAMBAT'
                    ? 'bg-amber-50/80 border-amber-200'
                    : 'bg-emerald-50/80 border-emerald-200'
                }`}
              >
                {/* Status Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      lastScannedResult.isDuplicate
                        ? 'bg-amber-200 text-amber-950'
                        : lastScannedResult.record.status === 'TERLAMBAT'
                        ? 'bg-amber-200 text-amber-950'
                        : 'bg-emerald-200 text-emerald-950'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lastScannedResult.isDuplicate
                      ? 'SUDAH TERCATAT HARI INI'
                      : lastScannedResult.record.type === 'PULANG'
                      ? 'ABSEN PULANG TERKONFIRMASI'
                      : lastScannedResult.record.status === 'TERLAMBAT'
                      ? 'TERCATAT (TERLAMBAT)'
                      : 'TERCATAT (TEPAT WAKTU)'}
                  </span>

                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    {lastScannedResult.record.date}
                  </span>
                </div>

                {/* Student Identity Section (NAMA SISWA) */}
                <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                    <span>Identitas Siswa</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {lastScannedResult.student.id}</span>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-13 h-13 rounded-xl bg-slate-900 border border-slate-800 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white">
                      {lastScannedResult.student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Nama Siswa
                      </div>
                      <h4 className="text-base font-black text-slate-900 truncate leading-tight">
                        {lastScannedResult.student.name}
                      </h4>
                      <div className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold text-[11px]">
                          Kelas {lastScannedResult.student.className}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-mono text-[11px]">
                          NIS: {lastScannedResult.student.nis}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          NISN: {lastScannedResult.student.nisn}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2 Key Metric Blocks: WAKTU and KETERANGAN */}
                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Waktu Presensi */}
                  <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Waktu Presensi</span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-lg font-black font-mono text-slate-900">
                          {lastScannedResult.record.time}
                        </span>
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                          {tzLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{lastScannedResult.record.date}</span>
                    </div>
                  </div>

                  {/* Keterangan Presensi */}
                  <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Keterangan</span>
                      </div>
                      <div
                        className={`text-xs font-black mt-1 ${
                          lastScannedResult.isDuplicate
                            ? 'text-amber-800'
                            : lastScannedResult.record.status === 'TERLAMBAT'
                            ? 'text-amber-800'
                            : 'text-emerald-800'
                        }`}
                      >
                        {lastScannedResult.isDuplicate
                          ? 'Presensi Duplikat'
                          : lastScannedResult.record.type === 'PULANG'
                          ? 'Absen Pulang'
                          : lastScannedResult.record.status === 'TERLAMBAT'
                          ? 'Terlambat Masuk'
                          : 'Tepat Waktu'}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium leading-snug mt-1.5 pt-1.5 border-t border-slate-100 line-clamp-2">
                      {lastScannedResult.record.note || lastScannedResult.message}
                    </div>
                  </div>
                </div>

                {/* Quick Action bar */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs font-semibold flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 truncate max-w-[260px]">
                    {lastScannedResult.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateToCards(lastScannedResult.student.id)}
                    className="text-blue-700 hover:text-blue-900 font-bold text-[11px] flex items-center gap-1 ml-2 shrink-0 cursor-pointer"
                  >
                    Kartu Siswa <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* WhatsApp Parent Notification Card */}
                {config.enableWhatsAppNotification !== false && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/60 p-2.5 rounded-xl border border-emerald-200/70">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>Notifikasi WA Orang Tua</span>
                          {lastScannedResult.student.parentPhone ? (
                            <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100/80 px-1.5 py-0.2 rounded">
                              {formatDisplayPhone(lastScannedResult.student.parentPhone)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                              No. WA belum diisi
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Kirim bukti presensi resmi langsung ke nomor wali
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setWaModalData({
                          student: lastScannedResult.student,
                          record: lastScannedResult.record,
                        })
                      }
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
                        sentWaRecordIds.has(lastScannedResult.record.id)
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200/80'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white'
                      }`}
                    >
                      {sentWaRecordIds.has(lastScannedResult.record.id) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Terkirim (Kirim Ulang)</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim ke WA Wali</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Auto-Clear Countdown Banner & Reset Controls */}
                <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {config.autoClearScanResult !== false && clearCountdown !== null && !isAutoClearPaused ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                        <RotateCcw className="w-3 h-3 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>Auto-reset dalam <strong className="font-mono text-blue-700">{clearCountdown} detik</strong></span>
                        <button
                          type="button"
                          onClick={handleTogglePauseAutoClear}
                          className="ml-1 px-1.5 py-0.5 rounded bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-extrabold cursor-pointer border border-blue-200 active:scale-95 transition-all"
                          title="Tahan tampilan kartu agar tidak otomatis direset"
                        >
                          <Pause className="w-2.5 h-2.5 inline mr-0.5" /> Jeda
                        </button>
                      </div>
                    ) : isAutoClearPaused ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                        <Pause className="w-3 h-3 text-amber-600" />
                        <span>Auto-reset dijeda</span>
                        <button
                          type="button"
                          onClick={handleTogglePauseAutoClear}
                          className="ml-1 px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-800 text-[10px] font-extrabold cursor-pointer border border-amber-200 active:scale-95 transition-all"
                        >
                          <Play className="w-2.5 h-2.5 inline mr-0.5" /> Lanjut
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Auto-reset nonaktif
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleManualClearResult}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer ml-auto"
                    title="Bersihkan status pemindai sekarang agar siap memindai siswa berikutnya (Shortcut: Spasi atau Esc)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Scan Siswa Berikutnya</span>
                    <span className="hidden sm:inline text-[10px] opacity-60 font-mono">[Spasi]</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-7 px-5 bg-gradient-to-b from-slate-50 to-blue-50/30 rounded-2xl border border-dashed border-blue-200/80">
                <div className="w-12 h-12 rounded-2xl bg-white border border-blue-200/80 flex items-center justify-center mx-auto mb-3 text-blue-600 shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="text-xs font-black text-slate-900 tracking-tight">Menunggu Pemindaian Kartu Siswa</div>
                <div className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Arahkan QR Code kartu pelajar siswa ke kamera atau klik nama siswa pada panel input cepat di bawah.
                </div>
                {/* 3 Step Micro Indicator */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/70 text-left">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-black text-blue-600 block">1. SCAN</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight block">Dekatkan QR kartu ke kotak bidik</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-black text-emerald-600 block">2. BEEP</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight block">Suara verifikasi & data tersimpan</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-black text-indigo-600 block">3. AUTO-RESET</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight block">
                      {config.autoClearScanResult !== false ? `Siap scan lagi (${config.autoClearDelaySeconds ?? 3}d)` : 'Reset layar cepat'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Executive KPI Counters */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Statistik Presensi Hari Ini
              </h3>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {attendanceRate}% Kehadiran
              </span>
            </div>

            {/* Attendance percentage bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, attendanceRate)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="text-2xl font-black text-slate-900 font-mono">{totalAttendedToday}</div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">Total Hadir</div>
                <div className="text-[10px] text-slate-400 font-medium">dari {students.length} siswa</div>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3">
                <div className="text-2xl font-black text-emerald-700 font-mono">{onTimeCountToday}</div>
                <div className="text-[11px] font-bold text-emerald-900 mt-0.5">Tepat Waktu</div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  {totalAttendedToday > 0 ? Math.round((onTimeCountToday / totalAttendedToday) * 100) : 0}%
                </div>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3">
                <div className="text-2xl font-black text-amber-700 font-mono">{lateCountToday}</div>
                <div className="text-[11px] font-bold text-amber-900 mt-0.5">Terlambat</div>
                <div className="text-[10px] text-amber-600 font-medium">
                  {totalAttendedToday > 0 ? Math.round((lateCountToday / totalAttendedToday) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Today's Live Attendance Feed */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Aktivitas Presensi Terkini
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {todayRecords.length} Log Hari Ini
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {todayRecords.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  Belum ada presensi yang tercatat hari ini.
                </div>
              ) : (
                todayRecords.slice(0, 6).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs hover:bg-slate-100 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-extrabold text-slate-800 truncate">
                        {record.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700">{record.studentClass}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">NIS {record.studentNis}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-700 text-[11px]">
                        {record.time} {tzLabel}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                          record.type === 'PULANG'
                            ? 'bg-indigo-100 text-indigo-700'
                            : record.status === 'TERLAMBAT'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {record.type === 'PULANG' ? 'PULANG' : record.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Notification Modal */}
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
    </div>
  );
};
