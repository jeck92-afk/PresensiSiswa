import React, { useRef } from 'react';
import {
  X,
  MessageSquare,
  Mail,
  Award,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Code2,
  Sparkles,
  MapPin,
  School,
  Heart,
} from 'lucide-react';
import { SchoolConfig } from '../types';
import { getAdminWhatsAppUrl, formatDisplayPhone } from '../utils/whatsapp';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  onUpdateConfig?: (newConfig: SchoolConfig) => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const developerName = config.developerName || 'Jecky Marantika, S.Pd., Gr';
  const developerTitle =
    config.developerTitle || 'Pengembang Aplikasi & Fasilitator Digitalisasi Pembelajaran';
  const developerPhoto = config.developerPhotoUrl || '/developer_jecky.svg';
  const developerEmail = config.developerEmail || 'jeckymarantika2@gmail.com';
  const developerWA = config.developerWhatsApp || config.adminWhatsApp || '085211798843';
  const developerBio =
    config.developerBio ||
    'Guru profesional dan pengembang solusi digital pendidikan, berdedikasi memodernisasi tata kelola presensi dan identitas digital siswa di Provinsi Maluku dan Indonesia.';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateConfig) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        onUpdateConfig({
          ...config,
          developerPhotoUrl: base64,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon with Maluku Theme */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white p-6 pb-16">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer focus:outline-none"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Profil Pengembang Aplikasi</span>
          </div>
          <h2 className="text-xl font-serif-academic font-bold tracking-tight text-white">
            {developerName}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">{developerTitle}</p>
        </div>

        {/* Floating Avatar Section */}
        <div className="px-6 -mt-12 flex items-end justify-between relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-xl border-2 border-emerald-500/80 ring-4 ring-white overflow-hidden">
              <img
                src={developerPhoto}
                alt={developerName}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Verified badge */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white"
              title="Pengembang Terverifikasi (Guru Profesional)"
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Quick Upload action if editable */}
          {onUpdateConfig && (
            <div className="mb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200/90 transition-all cursor-pointer shadow-xs"
                title="Ganti atau unggah foto asli pengembang (JPG/PNG)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Ganti Foto</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Dedication & Credentials */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Pendidik &amp; Pengembang Solusi Digital</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{developerBio}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                S.Pd., Gr (Guru Profesional)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                <MapPin className="w-3 h-3 text-blue-600" />
                Provinsi Maluku
              </span>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Kontak Resmi Pengembang:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp Button */}
              <a
                href={getAdminWhatsAppUrl(
                  developerWA,
                  `Halo Bapak Jecky Marantika, S.Pd., Gr (Pengembang), saya menghubungi Anda melalui Aplikasi Presensi Siswa.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 font-bold text-xs transition-colors shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-emerald-700">WhatsApp Resmi</div>
                  <div className="font-mono text-xs truncate">{formatDisplayPhone(developerWA)}</div>
                </div>
              </a>

              {/* Email Button */}
              <a
                href={`mailto:${developerEmail}?subject=Konsultasi%20Aplikasi%20Presensi%20Siswa`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/90 font-bold text-xs transition-colors shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-blue-700">Email Pengembang</div>
                  <div className="text-xs truncate">{developerEmail}</div>
                </div>
              </a>
            </div>
          </div>

          {/* Technical Specs & System Dedication */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-300 text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Sistem Presensi QR Siswa &amp; Kartu ID Digital
              </span>
              <span className="text-slate-400 font-mono">v2.5</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              Dirancang untuk memfasilitasi sekolah dalam pencatatan kehadiran akurat, validasi cepat, cetak kartu pelajar standar ISO 7810 ID-1, dan transparansi laporan langsung ke orang tua.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <span>Dibuat dengan dedikasi</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
            <span>untuk Pendidikan Maluku</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
