import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Info, X, Share2, PlusSquare, Monitor, ShieldCheck, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'compact' | 'pill';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running standalone in full PWA mode
  if (isStandalone) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">SIADIK PWA Offline Aktif</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (!success) {
          setShowGuideModal(true);
        }
      } catch {
        setShowGuideModal(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // Render by variant
  let buttonContent = null;

  if (variant === 'header') {
    buttonContent = (
      <button
        type="button"
        id="btn-pwa-install-header"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Pasang Aplikasi SIADIK untuk Penggunaan Offline & Cepat"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-sm hover:shadow transition-all duration-200 cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Pasang Aplikasi (Offline)</span>
        <span className="sm:hidden">Install App</span>
      </button>
    );
  } else if (variant === 'sidebar') {
    buttonContent = (
      <div className={`p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/30 text-white shadow-lg ${className}`}>
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300">Aplikasi Offline (PWA)</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
              Bisa digunakan tanpa kuota / sinyal internet di sekolah.
            </p>
            <button
              type="button"
              id="btn-pwa-install-sidebar"
              onClick={handleInstallClick}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install SIADIK</span>
            </button>
          </div>
        </div>
      </div>
    );
  } else if (variant === 'banner') {
    buttonContent = (
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Pasang SIADIK di Perangkat Anda (Dukungan Offline Penuh)
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Absen barcode, jurnal guru, dan data siswa tetap dapat diakses meski tanpa internet.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstallClick}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Pasang Sekarang
        </button>
      </div>
    );
  } else {
    // Compact / Pill
    buttonContent = (
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer ${className}`}
      >
        <Download className="w-3 h-3" />
        <span>Install PWA Offline</span>
      </button>
    );
  }

  return (
    <>
      {buttonContent}

      {/* Manual Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 border border-amber-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Panduan Pasang Aplikasi SIADIK
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bisa digunakan 100% Offline tanpa koneksi internet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  <strong>PWA (Progressive Web App):</strong> Aplikasi akan terpasang di layar utama HP / Komputer layaknya aplikasi asli Play Store / App Store, siap digunakan kapanpun baik online maupun offline.
                </p>
              </div>

              {/* iOS Safari Instructions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Untuk Pengguna iPhone / iPad (iOS Safari):</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <li>Buka website ini di browser <strong>Safari</strong>.</li>
                  <li className="flex items-center gap-1.5">
                    <span>Klik tombol</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-[10px]">
                      <Share2 className="w-3 h-3" /> Bagikan (Share)
                    </span>
                    <span>di bilah bawah Safari.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>Pilih menu</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-[10px]">
                      <PlusSquare className="w-3 h-3" /> Tambahkan ke Layar Utama
                    </span>
                  </li>
                  <li>Klik <strong>Tambah (Add)</strong> di pojok kanan atas.</li>
                </ol>
              </div>

              {/* Android / Chrome Instructions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Untuk Pengguna HP Android (Google Chrome / Edge):</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <li>Klik menu titik tiga (⋮) di pojok kanan atas peramban.</li>
                  <li>Pilih menu <strong>"Install Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li>Konfirmasi pemasangan, ikon SIADIK akan muncul di layar HP Anda.</li>
                </ol>
              </div>

              {/* Laptop / PC Desktop Instructions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Monitor className="w-3.5 h-3.5 text-blue-500" />
                  <span>Untuk Pengguna Laptop / Komputer (Chrome / Edge):</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  Klik ikon <Download className="w-3 h-3 inline mx-1 text-blue-500" /> <strong>Install</strong> di sebelah kanan bilah URL browser Chrome/Edge, lalu pilih <strong>Install</strong>.
                </p>
              </div>

              {/* Offline Capability Guarantee */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Kelebihan Mode Offline SIADIK:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                  Seluruh data siswa, guru, rombel, jadwal, jurnal guru, scanner barcode, dan data absensi tetap tersimpan aman di peramban lokal perangkat. Saat tersambung kembali ke internet, data dapat disinkronkan ke Google Spreadsheet.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                PWA SIADIK v2.5 Ready
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
