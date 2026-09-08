import React, { useState, useRef } from 'react';
import {
  Settings,
  School,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle2,
  Save,
  Shield,
  FileCheck,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Zap,
  Timer,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Mail,
  Award,
  UploadCloud,
  UserCheck,
} from 'lucide-react';
import { SchoolConfig, AdminAccount } from '../types';
import {
  DEFAULT_WA_TEMPLATES,
  getAdminWhatsAppUrl,
  formatDisplayPhone,
  DEFAULT_ADMIN_WA,
} from '../utils/whatsapp';
import { SchoolLogo } from './SchoolLogo';
import { soundEffects } from '../utils/audio';
import { AdminAccountsManager } from './AdminAccountsManager';

interface SettingsViewProps {
  config: SchoolConfig;
  onSaveConfig: (updated: SchoolConfig) => void;
  onSessionUserUpdated?: (account: AdminAccount) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onSessionUserUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<SchoolConfig>({
    ...config,
    adminWhatsApp: config.adminWhatsApp || DEFAULT_ADMIN_WA,
    enableWhatsAppNotification: config.enableWhatsAppNotification ?? true,
    autoOpenWhatsApp: config.autoOpenWhatsApp ?? false,
    waTemplateMasuk: config.waTemplateMasuk || DEFAULT_WA_TEMPLATES.masuk,
    waTemplatePulang: config.waTemplatePulang || DEFAULT_WA_TEMPLATES.pulang,
    waTemplateTerlambat: config.waTemplateTerlambat || DEFAULT_WA_TEMPLATES.terlambat,
    waTemplateBelumHadir: config.waTemplateBelumHadir || DEFAULT_WA_TEMPLATES.belumHadir,
    autoClearScanResult: config.autoClearScanResult ?? true,
    autoClearDelaySeconds: config.autoClearDelaySeconds ?? 3,
    developerName: config.developerName || 'Jecky Marantika, S.Pd., Gr',
    developerTitle: config.developerTitle || 'Pengembang Aplikasi & Fasilitator Digitalisasi Pembelajaran',
    developerPhotoUrl: config.developerPhotoUrl || '/developer_jecky.svg',
    developerEmail: config.developerEmail || 'jeckymarantika2@gmail.com',
    developerWhatsApp: config.developerWhatsApp || '085211798843',
    developerBio:
      config.developerBio ||
      'Guru profesional dan pengembang solusi digital pendidikan, berdedikasi memodernisasi tata kelola presensi dan identitas digital siswa di Provinsi Maluku dan Indonesia.',
  });
  const [activeWaTab, setActiveWaTab] = useState<'masuk' | 'terlambat' | 'pulang' | 'belumHadir'>('masuk');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    soundEffects.playSuccess();
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-1">
            <Settings className="w-3.5 h-3.5" />
            Konfigurasi Sistem
          </div>
          <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pengaturan Sekolah & Jam Presensi
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Sesuaikan identitas sekolah, aturan batas keterlambatan siswa, dan preferensi audio pemindai.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Pengaturan Berhasil Disimpan!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* School Identity Section */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <School className="w-5 h-5 text-blue-600" />
            Identitas Sekolah (Tercantum pada Kartu Pelajar)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) =>
                  setFormData({ ...formData, schoolName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional)
              </label>
              <input
                type="text"
                required
                value={formData.schoolNpsn}
                onChange={(e) =>
                  setFormData({ ...formData, schoolNpsn: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                required
                value={formData.principalName}
                onChange={(e) =>
                  setFormData({ ...formData, principalName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Ajaran & Semester
              </label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Sekolah Lengkap
              </label>
              <input
                type="text"
                value={formData.schoolAddress}
                onChange={(e) =>
                  setFormData({ ...formData, schoolAddress: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>

            {/* Nomor WhatsApp Admin Presensi (Langsung Terhubung) */}
            <div className="md:col-span-2 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/90 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Nomor WhatsApp Admin / Bantuan Sistem (Terhubung Langsung)</span>
                </label>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  {formatDisplayPhone(formData.adminWhatsApp || DEFAULT_ADMIN_WA)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={formData.adminWhatsApp || DEFAULT_ADMIN_WA}
                    onChange={(e) =>
                      setFormData({ ...formData, adminWhatsApp: e.target.value })
                    }
                    placeholder="085211798843"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold text-slate-900 shadow-2xs"
                  />
                </div>

                <a
                  href={getAdminWhatsAppUrl(
                    formData.adminWhatsApp || DEFAULT_ADMIN_WA,
                    `Halo Admin Presensi ${formData.schoolName}, ini adalah pesan tes verifikasi koneksi langsung WhatsApp Admin.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                  title="Klik untuk menguji koneksi langsung ke nomor WhatsApp Admin"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Tes Chat WA Admin Langsung</span>
                </a>
              </div>

              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Nomor ini dipasang langsung pada bilah navigasi header institusi, kartu beranda, pemindai gerbang, dan footer aplikasi agar seluruh pengguna dan staf dapat langsung terhubung ke admin via WhatsApp dengan 1 kali klik.
              </p>
            </div>

            {/* School Crest / Logo Selector & Uploader */}
            <div className="md:col-span-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Logo &amp; Lambang Sekolah (Header, Banner &amp; Kartu Pelajar)
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                {/* Active Logo Previews */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 p-1.5 shadow-md flex items-center justify-center">
                      <SchoolLogo
                        src={formData.schoolLogoUrl}
                        alt="Logo Header"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold mt-1">Dark Mode</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-sm flex items-center justify-center">
                      <SchoolLogo
                        src={formData.schoolLogoUrl}
                        alt="Logo Light"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold mt-1">Light Mode</span>
                  </div>
                </div>

                {/* Preset Options & Upload Action */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="text-[11px] font-bold text-slate-600">Pilih Preset Ikon Pendidikan / Daerah:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, schoolLogoUrl: '/logo_provinsi_maluku.svg' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        formData.schoolLogoUrl === '/logo_provinsi_maluku.svg' || formData.schoolLogoUrl === '/logo_provinsi_maluku.png'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🏛️ Lambang Provinsi Maluku (Siwalima)</span>
                      {(formData.schoolLogoUrl === '/logo_provinsi_maluku.svg' || formData.schoolLogoUrl === '/logo_provinsi_maluku.png') && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, schoolLogoUrl: '/school_logo.svg' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        formData.schoolLogoUrl === '/school_logo.svg' || !formData.schoolLogoUrl
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🛡️ Crest Emas &amp; Biru (Obor &amp; Buku)</span>
                      {(formData.schoolLogoUrl === '/school_logo.svg' || !formData.schoolLogoUrl) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, schoolLogoUrl: '/school_logo_tutwuri.svg' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        formData.schoolLogoUrl === '/school_logo_tutwuri.svg'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🦅 Tut Wuri Handayani (Sayap &amp; Obor)</span>
                      {formData.schoolLogoUrl === '/school_logo_tutwuri.svg' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Unggah Logo Kustom (PNG/SVG/JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) {
                                setFormData({ ...formData, schoolLogoUrl: reader.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {formData.schoolLogoUrl && formData.schoolLogoUrl !== '/school_logo.svg' && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, schoolLogoUrl: '/school_logo.svg' })}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                      >
                        Reset ke Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Pemerintah Daerah / Provinsi (Pojok Kiri Atas) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Logo Pemerintah Daerah / Provinsi (Pojok Kiri Atas Header)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1 shadow-xs flex items-center justify-center shrink-0">
                  <img
                    src={formData.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
                    alt="Logo Daerah"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800">
                    Lambang Resmi Provinsi Maluku (Siwalima)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Ditampilkan di pojok kiri atas bilah navigasi utama, banner beranda admin, terminal gerbang pemindai, dan kop resmi kartu tanda pelajar.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Ganti Logo Daerah (Upload)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) {
                                setFormData({ ...formData, provincialLogoUrl: reader.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {formData.provincialLogoUrl && formData.provincialLogoUrl !== '/logo_provinsi_maluku.svg' && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, provincialLogoUrl: '/logo_provinsi_maluku.svg' })}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                      >
                        Reset ke Logo Maluku
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Schedule & Thresholds */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Clock className="w-5 h-5 text-amber-500" />
            Jadwal & Aturan Batas Presensi
          </div>

          {/* Zona Waktu Operasional (WIT Default) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Zona Waktu Wilayah Sekolah
              </label>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                {formData.timeZone || 'WIT'} (UTC+09:00)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pilih zona waktu resmi sekolah. Sistem presensi, jam pemindai gerbang, rekap harian, dan notifikasi WhatsApp otomatis diselaraskan dengan waktu zona ini.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.timeZone === 'WIT' || !formData.timeZone
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="timeZone"
                  value="WIT"
                  checked={formData.timeZone === 'WIT' || !formData.timeZone}
                  onChange={() => setFormData({ ...formData, timeZone: 'WIT' })}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">WIT (UTC+09:00)</div>
                  <div className="text-[10px] text-slate-500">Waktu Indonesia Timur (Maluku, Maluku Utara, Papua) - Default</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.timeZone === 'WITA'
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="timeZone"
                  value="WITA"
                  checked={formData.timeZone === 'WITA'}
                  onChange={() => setFormData({ ...formData, timeZone: 'WITA' })}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">WITA (UTC+08:00)</div>
                  <div className="text-[10px] text-slate-500">Waktu Indonesia Tengah (Bali, NTB, NTT, Sulawesi, Kalsel, Kaltim, Kaltara)</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.timeZone === 'WIB'
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="timeZone"
                  value="WIB"
                  checked={formData.timeZone === 'WIB'}
                  onChange={() => setFormData({ ...formData, timeZone: 'WIB' })}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">WIB (UTC+07:00)</div>
                  <div className="text-[10px] text-slate-500">Waktu Indonesia Barat (Jawa, Sumatera, Kalbar, Kalteng)</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Batas Jam Masuk Tepat Waktu ({formData.timeZone || 'WIT'})
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Siswa yang memindai QR lewat dari jam ini otomatis ditandai sebagai <strong>Terlambat</strong>.
              </p>
              <input
                type="time"
                required
                value={formData.checkInDeadline}
                onChange={(e) =>
                  setFormData({ ...formData, checkInDeadline: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Waktu Mulai Presensi Pulang ({formData.timeZone || 'WIT'})
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Jam ketika siswa diperbolehkan melakukan pemindaian barcode keluar / pulang sekolah.
              </p>
              <input
                type="time"
                required
                value={formData.checkOutStart}
                onChange={(e) =>
                  setFormData({ ...formData, checkOutStart: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Audio & Scanner Behavior */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Volume2 className="w-5 h-5 text-emerald-600" />
            Preferensi Suara & Perilaku Pemindai
          </div>

          {/* Audio Bip & Voice Setting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                {formData.enableAudio ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                Suara & Ucapan Konfirmasi Presensi QR
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Saat <strong>berhasil</strong> scan: <span className="font-semibold text-emerald-700">Single Bright Beep</span> diikuti ucapan manusia yang jelas & tegas <span className="font-semibold text-emerald-700">"Terima kasih!"</span>.<br />
                Saat <strong>gagal</strong> / tidak valid: <span className="font-semibold text-rose-700">Single Bright Beep</span> diikuti arahan tegas <span className="font-semibold text-rose-700">"Silakan coba lagi!"</span>.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => soundEffects.playScanSuccess()}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Uji suara scan berhasil: Single Bright Beep + TERIMA KASIH"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Uji Berhasil</span>
              </button>

              <button
                type="button"
                onClick={() => soundEffects.playScanFailure()}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 rounded-lg border border-rose-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Uji suara scan gagal: Single Bright Beep + SILAKAN COBA LAGI"
              >
                <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Uji Gagal</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, enableAudio: !formData.enableAudio })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-1 ${
                  formData.enableAudio ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                title={formData.enableAudio ? 'Nonaktifkan Audio' : 'Aktifkan Audio'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    formData.enableAudio ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto-Clear Scanner State Setting */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>Otomatis Bersihkan Layar Pemindai (Auto-Clear Scanner)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                    Fitur Cepat Gerbang
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                  Setelah scan berhasil, kartu verifikasi otomatis direset agar pemindaian siswa berikutnya lebih cepat dan lancar tanpa perlu interaksi manual petugas.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    autoClearScanResult: !formData.autoClearScanResult,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.autoClearScanResult ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    formData.autoClearScanResult ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Delay Selector (Only visible if auto-clear is enabled) */}
            {formData.autoClearScanResult && (
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Jeda Waktu Reset Otomatis:</span>
                    <strong className="text-blue-600 font-mono">
                      {formData.autoClearDelaySeconds ?? 3} Detik
                    </strong>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Durasi tampilan kartu verifikasi sebelum siap scan ulang
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { sec: 1, label: '1 Detik', desc: 'Presensi Kilat' },
                    { sec: 2, label: '2 Detik', desc: 'Sangat Cepat' },
                    { sec: 3, label: '3 Detik', desc: 'Standar Ideal' },
                    { sec: 5, label: '5 Detik', desc: 'Verifikasi Santai' },
                  ].map((option) => {
                    const isSelected = (formData.autoClearDelaySeconds ?? 3) === option.sec;
                    return (
                      <button
                        key={option.sec}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            autoClearDelaySeconds: option.sec,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-extrabold flex items-center justify-between">
                          <span>{option.label}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {option.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Parent Notification Integration */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 fill-emerald-600" />
              </div>
              <div>
                <div>Integrasi Notifikasi WhatsApp Orang Tua</div>
                <div className="text-xs text-slate-500 font-normal">
                  Kirim pesan kehadiran otomatis langsung ke nomor WhatsApp wali murid (menggunakan protokol resmi wa.me)
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 self-start sm:self-auto">
              Protokol wa.me Aktif
            </span>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Toggle 1: Enable Notification buttons */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-900">
                  Tombol Notifikasi WhatsApp
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tampilkan tombol kirim WhatsApp di pemindai QR, rekap presensi, dan data siswa.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    enableWhatsAppNotification: !formData.enableWhatsAppNotification,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.enableWhatsAppNotification ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    formData.enableWhatsAppNotification ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Auto Open WhatsApp on Scan */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-900">
                  Buka WhatsApp Otomatis
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Otomatis membuka jendela WhatsApp Web/App sesaat setelah kartu QR berhasil discan.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    autoOpenWhatsApp: !formData.autoOpenWhatsApp,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.autoOpenWhatsApp ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    formData.autoOpenWhatsApp ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Template Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Kustomisasi Format Pesan WhatsApp
              </label>
              <span className="text-[11px] text-slate-400">
                Pilih kategori pesan di bawah untuk mengedit
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setActiveWaTab('masuk')}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeWaTab === 'masuk'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hadir Tepat Waktu
              </button>
              <button
                type="button"
                onClick={() => setActiveWaTab('terlambat')}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeWaTab === 'terlambat'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hadir Terlambat
              </button>
              <button
                type="button"
                onClick={() => setActiveWaTab('pulang')}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeWaTab === 'pulang'
                    ? 'bg-white text-blue-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Absen Pulang
              </button>
              <button
                type="button"
                onClick={() => setActiveWaTab('belumHadir')}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeWaTab === 'belumHadir'
                    ? 'bg-white text-rose-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum Hadir
              </button>
            </div>

            {/* Active Template Editor */}
            <div className="relative">
              <textarea
                rows={7}
                value={
                  activeWaTab === 'masuk'
                    ? formData.waTemplateMasuk
                    : activeWaTab === 'terlambat'
                    ? formData.waTemplateTerlambat
                    : activeWaTab === 'pulang'
                    ? formData.waTemplatePulang
                    : formData.waTemplateBelumHadir
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeWaTab === 'masuk') {
                    setFormData({ ...formData, waTemplateMasuk: val });
                  } else if (activeWaTab === 'terlambat') {
                    setFormData({ ...formData, waTemplateTerlambat: val });
                  } else if (activeWaTab === 'pulang') {
                    setFormData({ ...formData, waTemplatePulang: val });
                  } else {
                    setFormData({ ...formData, waTemplateBelumHadir: val });
                  }
                }}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed"
                placeholder="Tulis template pesan..."
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Variabel Dinamis:</span>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{NAMA}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{KELAS}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{NIS}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{SEKOLAH}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{TANGGAL}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{WAKTU}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{STATUS}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{CATATAN}'}</code>
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{'{BATAS_MASUK}'}</code>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeWaTab === 'masuk') {
                      setFormData({ ...formData, waTemplateMasuk: DEFAULT_WA_TEMPLATES.masuk });
                    } else if (activeWaTab === 'terlambat') {
                      setFormData({ ...formData, waTemplateTerlambat: DEFAULT_WA_TEMPLATES.terlambat });
                    } else if (activeWaTab === 'pulang') {
                      setFormData({ ...formData, waTemplatePulang: DEFAULT_WA_TEMPLATES.pulang });
                    } else {
                      setFormData({ ...formData, waTemplateBelumHadir: DEFAULT_WA_TEMPLATES.belumHadir });
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Kembalikan template ke format awal"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Profil & Foto Pengembang Aplikasi (Jecky Marantika, S.Pd., Gr) */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 mb-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pengembang Sistem Presensi</span>
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Profil &amp; Foto Pengembang Aplikasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur identitas resmi pengembang dan foto profil yang ditampilkan pada seluruh sistem presensi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getAdminWhatsAppUrl(
                  formData.developerWhatsApp || '085211798843',
                  `Halo Bapak Jecky Marantika, S.Pd., Gr, saya menghubungi Anda terkait Aplikasi Presensi.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                title="Chat WhatsApp Pengembang"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Pengembang</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Photo Upload & Preview Card */}
            <div className="md:col-span-4 flex flex-col items-center p-5 bg-slate-50 rounded-2xl border border-slate-200/90 text-center">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white p-1.5 shadow-md border-2 border-emerald-500/70 overflow-hidden ring-4 ring-emerald-500/10">
                  <img
                    src={formData.developerPhotoUrl || '/developer_jecky.svg'}
                    alt={formData.developerName || 'Jecky Marantika, S.Pd., Gr'}
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white text-xs font-bold"
                  title="Guru Profesional Terverifikasi (Gr)"
                >
                  ✓
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xs font-bold text-slate-900">
                  {formData.developerName || 'Jecky Marantika, S.Pd., Gr'}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Fasilitator Pembelajaran Digital
                </div>
              </div>

              {/* Photo Upload Controls */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 8 * 1024 * 1024) {
                    alert('Ukuran file maksimal 8MB.');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    if (base64) {
                      setFormData({ ...formData, developerPhotoUrl: base64 });
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />

              <div className="flex flex-col w-full gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Ganti / Unggah Foto</span>
                </button>

                {formData.developerPhotoUrl && formData.developerPhotoUrl !== '/developer_jecky.svg' && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, developerPhotoUrl: '/developer_jecky.svg' })}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Gunakan Avatar Bawaan
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Mendukung file JPG, PNG, atau JPEG (maksimal 8MB).
              </p>
            </div>

            {/* Right: Data Form Fields */}
            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap &amp; Gelar Pengembang
                  </label>
                  <input
                    type="text"
                    value={formData.developerName || ''}
                    onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                    placeholder="Contoh: Jecky Marantika, S.Pd., Gr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Peran Pengembang
                  </label>
                  <input
                    type="text"
                    value={formData.developerTitle || ''}
                    onChange={(e) => setFormData({ ...formData, developerTitle: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    placeholder="Contoh: Pengembang Aplikasi & Fasilitator Digitalisasi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Pengembang
                  </label>
                  <input
                    type="text"
                    value={formData.developerWhatsApp || ''}
                    onChange={(e) => setFormData({ ...formData, developerWhatsApp: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    placeholder="085211798843"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email Resmi Pengembang
                  </label>
                  <input
                    type="email"
                    value={formData.developerEmail || ''}
                    onChange={(e) => setFormData({ ...formData, developerEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    placeholder="jeckymarantika2@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biodata / Catatan Dedikasi Pengembang
                </label>
                <textarea
                  rows={2}
                  value={formData.developerBio || ''}
                  onChange={(e) => setFormData({ ...formData, developerBio: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed"
                  placeholder="Tuliskan dedikasi atau catatan pengembang..."
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  Data pengembang ini akan disinkronkan secara otomatis pada footer sistem, modul beranda, dan kartu informasi kontak teknis.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Akun & Keamanan Administrator SIADIK */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/70 mb-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Keamanan &amp; Akses Portal</span>
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Akun &amp; Kredensial Administrator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola NIP, Nama Lengkap, Peran, dan Kredensial masuk untuk Administrator Utama, Operator Presensi, dan Kepala Sekolah.
              </p>
            </div>
          </div>

          {/* Interactive Accounts Manager with Edit NIP & Name */}
          <AdminAccountsManager
            config={formData}
            onUpdateConfig={(updated) => {
              setFormData(updated);
              onSaveConfig(updated);
            }}
            onSessionUserUpdated={onSessionUserUpdated}
          />
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Konfigurasi Sekolah
          </button>
        </div>
      </form>
    </div>
  );
};
