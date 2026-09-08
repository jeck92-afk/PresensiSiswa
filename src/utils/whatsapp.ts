import { Student, AttendanceRecord, SchoolConfig } from '../types';
import { formatIndonesianDate, getCurrentTimeString } from './time';

/**
 * Utility for formatting and connecting WhatsApp parent notifications
 * Configured for Eastern Indonesia Time (WIT) by default
 */

export const DEFAULT_WA_TEMPLATES = {
  masuk: `📢 *Pemberitahuan Presensi Siswa*
*{SEKOLAH}*

Yth. Bapak/Ibu Orang Tua/Wali dari:
👤 *Nama*: {NAMA}
🏫 *Kelas*: {KELAS}
🔢 *NIS/NISN*: {NIS} / {NISN}

Kami informasikan bahwa ananda telah tiba dan melakukan presensi di sekolah:
📅 *Hari, Tanggal*: {TANGGAL}
⏰ *Waktu*: {WAKTU} {ZONA_WAKTU}
📋 *Status*: ✅ *HADIR (Tepat Waktu)*

Terima kasih atas bimbingan dan kerja sama Bapak/Ibu dalam mendukung kedisiplinan ananda.`,

  terlambat: `📢 *Pemberitahuan Presensi Siswa*
*{SEKOLAH}*

Yth. Bapak/Ibu Orang Tua/Wali dari:
👤 *Nama*: {NAMA}
🏫 *Kelas*: {KELAS}
🔢 *NIS/NISN*: {NIS} / {NISN}

Kami informasikan bahwa ananda telah tiba di sekolah dengan rincian:
📅 *Hari, Tanggal*: {TANGGAL}
⏰ *Waktu Hadir*: {WAKTU} {ZONA_WAKTU}
📋 *Status*: ⚠️ *TERLAMBAT*
ℹ️ *Keterangan*: {CATATAN}

Batas waktu hadir tepat waktu di sekolah adalah pukul *{BATAS_MASUK} {ZONA_WAKTU}*. Mohon perhatian dan kerja sama Bapak/Ibu agar ananda dapat berangkat lebih awal. Terima kasih.`,

  pulang: `📢 *Pemberitahuan Kepulangan Siswa*
*{SEKOLAH}*

Yth. Bapak/Ibu Orang Tua/Wali dari:
👤 *Nama*: {NAMA}
🏫 *Kelas*: {KELAS}
🔢 *NIS/NISN*: {NIS} / {NISN}

Kami informasikan bahwa ananda telah selesai mengikuti kegiatan belajar mengajar dan telah melakukan presensi *PULANG* pada:
📅 *Hari, Tanggal*: {TANGGAL}
⏰ *Waktu Pulang*: {WAKTU} {ZONA_WAKTU}

Semoga ananda tiba di rumah dengan selamat. Terima kasih atas kerja sama Bapak/Ibu.`,

  belumHadir: `📢 *Konfirmasi Kehadiran Siswa*
*{SEKOLAH}*

Yth. Bapak/Ibu Orang Tua/Wali dari:
👤 *Nama*: {NAMA}
🏫 *Kelas*: {KELAS}
🔢 *NIS*: {NIS}

Kami informasikan bahwa hingga saat ini ({TANGGAL} pukul {WAKTU} {ZONA_WAKTU}), ananda tercatat *BELUM MELAKUKAN PRESENSI* di sekolah.

Mohon konfirmasi kepada pihak sekolah atau wali kelas jika ananda berhalangan hadir dikarenakan sakit atau izin. Terima kasih atas perhatiannya.`,
};

/**
 * Normalizes Indonesian phone numbers into international WhatsApp standard (starts with 62)
 */
export function normalizeIndonesianPhone(phone?: string): string {
  if (!phone) return '';
  // Remove all non-digit characters
  let clean = phone.replace(/\D/g, '');

  // If starts with 0, replace with 62
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  // If starts with 8, prepend 62
  else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  // If starts with 62, keep it
  return clean;
}

/**
 * Formats a phone number for friendly human display (e.g. 0812-3456-7890)
 */
export function formatDisplayPhone(phone?: string): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  let local = clean;
  if (clean.startsWith('62')) {
    local = '0' + clean.slice(2);
  }
  if (local.length >= 10) {
    return local.replace(/(\d{4})(\d{4})(\d{2,5})/, '$1-$2-$3');
  }
  return phone;
}

/**
 * Checks if a phone number appears valid for WhatsApp
 */
export function isValidWhatsAppPhone(phone?: string): boolean {
  if (!phone) return false;
  const normalized = normalizeIndonesianPhone(phone);
  return normalized.startsWith('628') && normalized.length >= 10 && normalized.length <= 15;
}

/**
 * Builds the customized WhatsApp message text with token replacement
 */
export function buildWhatsAppMessage(
  student: Student,
  record: AttendanceRecord,
  config: SchoolConfig
): string {
  let template = DEFAULT_WA_TEMPLATES.masuk;

  if (record.type === 'PULANG') {
    template = config.waTemplatePulang?.trim() || DEFAULT_WA_TEMPLATES.pulang;
  } else if (record.status === 'TERLAMBAT') {
    template = config.waTemplateTerlambat?.trim() || DEFAULT_WA_TEMPLATES.terlambat;
  } else {
    template = config.waTemplateMasuk?.trim() || DEFAULT_WA_TEMPLATES.masuk;
  }

  const formattedDate = formatIndonesianDate(record.date);
  const timeZone = config.timeZone || 'WIT';

  return template
    .replace(/WIB/g, timeZone)
    .replace(/{ZONA_WAKTU}/g, timeZone)
    .replace(/{NAMA}/g, student.name)
    .replace(/{KELAS}/g, student.className)
    .replace(/{NIS}/g, student.nis)
    .replace(/{NISN}/g, student.nisn)
    .replace(/{SEKOLAH}/g, config.schoolName)
    .replace(/{TANGGAL}/g, formattedDate)
    .replace(/{WAKTU}/g, record.time.slice(0, 5))
    .replace(/{STATUS}/g, record.status)
    .replace(/{CATATAN}/g, record.note || (record.status === 'TERLAMBAT' ? 'Hadir setelah batas jam masuk' : '-'))
    .replace(/{BATAS_MASUK}/g, config.checkInDeadline || '07:15');
}

/**
 * Builds reminder WhatsApp message for absent / unconfirmed students
 */
export function buildAbsentReminderMessage(
  student: Student,
  config: SchoolConfig,
  currentDate?: string,
  currentTime?: string
): string {
  const template = config.waTemplateBelumHadir?.trim() || DEFAULT_WA_TEMPLATES.belumHadir;
  const now = new Date();
  const timeZone = config.timeZone || 'WIT';
  const dateStr = currentDate ? formatIndonesianDate(currentDate) : formatIndonesianDate(now);
  const timeStr = currentTime || getCurrentTimeString(now, false, timeZone);

  return template
    .replace(/WIB/g, timeZone)
    .replace(/{ZONA_WAKTU}/g, timeZone)
    .replace(/{NAMA}/g, student.name)
    .replace(/{KELAS}/g, student.className)
    .replace(/{NIS}/g, student.nis)
    .replace(/{NISN}/g, student.nisn)
    .replace(/{SEKOLAH}/g, config.schoolName)
    .replace(/{TANGGAL}/g, dateStr)
    .replace(/{WAKTU}/g, timeStr);
}

export const DEFAULT_ADMIN_WA = '085211798843';

/**
 * Generates direct WhatsApp chat URL for Admin Presensi
 */
export function getAdminWhatsAppUrl(
  phone?: string,
  message?: string
): string {
  const adminPhone = phone || DEFAULT_ADMIN_WA;
  const defaultMsg =
    message ||
    'Halo Admin Presensi Sekolah, saya membutuhkan informasi / bantuan terkait sistem presensi.';
  return getWhatsAppUrl(adminPhone, defaultMsg);
}

/**
 * Directly connects to Admin WhatsApp in a new tab/window
 */
export function openAdminWhatsAppChat(
  phone?: string,
  message?: string
): boolean {
  const adminPhone = phone || DEFAULT_ADMIN_WA;
  const defaultMsg =
    message ||
    'Halo Admin Presensi Sekolah, saya membutuhkan informasi / bantuan terkait sistem presensi.';
  return openWhatsAppChat(adminPhone, defaultMsg);
}

/**
 * Generates the full wa.me direct URL
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = normalizeIndonesianPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Safely opens WhatsApp Web or WhatsApp mobile app
 */
export function openWhatsAppChat(phone: string, message: string): boolean {
  const cleanPhone = normalizeIndonesianPhone(phone);
  if (!cleanPhone) return false;
  const url = getWhatsAppUrl(cleanPhone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
