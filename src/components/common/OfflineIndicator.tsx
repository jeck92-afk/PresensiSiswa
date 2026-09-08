import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2, CloudOff, RefreshCw, X, HardDrive } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onManualSync,
  isSyncing = false,
}) => {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // When transition from offline to online happens
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
        resetWasOffline();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  // Reset banner dismissal state when going offline again
  useEffect(() => {
    if (!isOnline) {
      setIsBannerDismissed(false);
    }
  }, [isOnline]);

  return (
    <>
      {/* 1. Offline Floating Indicator Banner */}
      {!isOnline && !isBannerDismissed && (
        <div
          role="alert"
          id="offline-status-banner"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-slate-900/95 text-white dark:bg-slate-900/95 border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Mode Offline Aktif
                </h4>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                Aplikasi tetap berjalan normal tanpa internet. Scanner QR, presensi, kartu pelajar, dan data jurnal tersimpan aman di memori lokal perangkat.
              </p>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Penyimpanan Lokal: Aktif</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Sembunyikan peringatan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Minimized Offline Chip (if dismissed) */}
      {!isOnline && isBannerDismissed && (
        <button
          type="button"
          onClick={() => setIsBannerDismissed(false)}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-slate-950 text-xs font-bold shadow-lg transition cursor-pointer animate-bounce"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </button>
      )}

      {/* 3. Reconnected Notification Toast */}
      {showReconnectedToast && (
        <div
          role="status"
          id="online-reconnected-toast"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-emerald-950/95 text-white border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Koneksi Internet Terhubung
                </p>
                <p className="text-[11px] text-slate-300">
                  Data lokal siap disinkronkan ke Google Spreadsheet.
                </p>
              </div>
            </div>

            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkron</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowReconnectedToast(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
