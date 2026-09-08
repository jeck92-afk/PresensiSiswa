import React, { useState } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolConfig } from '../types';
import {
  formatDisplayPhone,
  normalizeIndonesianPhone,
  isValidWhatsAppPhone,
  openWhatsAppChat,
  buildWhatsAppMessage,
} from '../utils/whatsapp';

interface WhatsAppNotifyModalProps {
  student: Student;
  record?: AttendanceRecord | null;
  config: SchoolConfig;
  customMessage?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudentPhone?: (studentId: string, newPhone: string) => void;
}

export const WhatsAppNotifyModal: React.FC<WhatsAppNotifyModalProps> = ({
  student,
  record,
  config,
  customMessage,
  isOpen,
  onClose,
  onUpdateStudentPhone,
}) => {
  if (!isOpen) return null;

  const [phoneInput, setPhoneInput] = useState<string>(student.parentPhone || '');
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(!student.parentPhone);
  const [messageText, setMessageText] = useState<string>(() => {
    if (customMessage) return customMessage;
    if (record) return buildWhatsAppMessage(student, record, config);
    return `Yth. Orang Tua/Wali dari ${student.name} (${student.className}),\n\nSalam dari ${config.schoolName}.`;
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [hasSent, setHasSent] = useState<boolean>(false);

  const isValidPhone = isValidWhatsAppPhone(phoneInput);
  const cleanPhone = normalizeIndonesianPhone(phoneInput);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    if (!isValidPhone) {
      setIsEditingPhone(true);
      return;
    }

    if (onUpdateStudentPhone && phoneInput !== student.parentPhone) {
      onUpdateStudentPhone(student.id, phoneInput);
    }

    const opened = openWhatsAppChat(phoneInput, messageText);
    if (opened) {
      setHasSent(true);
    }
  };

  const handleSavePhone = () => {
    if (onUpdateStudentPhone && isValidPhone) {
      onUpdateStudentPhone(student.id, phoneInput);
      setIsEditingPhone(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden relative my-6">
        {/* Header with WhatsApp Emerald Color */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  Kirim Notifikasi WhatsApp
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700/80 text-emerald-100 border border-emerald-500">
                  Orang Tua / Wali
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {student.name} • {student.className}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Phone Number Input / Confirmation */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Nomor WhatsApp Orang Tua / Wali
              </label>
              {!isEditingPhone && student.parentPhone && (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  Ubah Nomor
                </button>
              )}
            </div>

            {isEditingPhone ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      +62
                    </span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="081234567890 atau 812..."
                      className="w-full pl-12 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  {onUpdateStudentPhone && (
                    <button
                      type="button"
                      disabled={!isValidPhone}
                      onClick={handleSavePhone}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Simpan
                    </button>
                  )}
                </div>
                {!isValidPhone && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Masukkan nomor HP Indonesia yang aktif (contoh: 081234567890).
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm font-extrabold text-slate-900">
                  {formatDisplayPhone(phoneInput)}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Format Siap WA (ID: {cleanPhone})
                </span>
              </div>
            )}
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Pratinjau Pesan yang Akan Dikirim
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-200">
              <div className="bg-white rounded-xl rounded-tr-none p-3.5 shadow-xs border border-slate-200/80 max-w-sm ml-auto relative">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={9}
                  className="w-full text-xs text-slate-800 leading-relaxed font-sans bg-transparent border-0 focus:outline-none resize-y"
                  placeholder="Ketik isi pesan WhatsApp di sini..."
                />
                <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                  {record?.time?.slice(0, 5) || 'Baru saja'} • WhatsApp
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 italic">
              *Teks di atas dapat Anda edit secara bebas sebelum mengklik tombol kirim.
            </p>
          </div>

          {/* Status Alert if already sent */}
          {hasSent && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp telah dibuka di tab baru!</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Tekan tombol Kirim di WhatsApp
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              disabled={!isValidPhone}
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{hasSent ? 'Buka WhatsApp Lagi' : 'Kirim via WhatsApp'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
