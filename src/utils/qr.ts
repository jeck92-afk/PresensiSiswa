import QRCode from 'qrcode';
import { Student } from '../types';

/**
 * Generates standardized QR payload for a student.
 * Supports format:
 * - JSON: {"school":"SCH-ATTEND","id":"STD-1001","nisn":"0078129031","nis":"23001"}
 * - Fallback / direct string parsing: NISN or NIS or Student ID
 */
export const createStudentQrPayload = (student: Student): string => {
  return JSON.stringify({
    app: 'SISWA-QR-PRESENSI',
    id: student.id,
    nisn: student.nisn,
    nis: student.nis,
  });
};

export const parseScannedQrData = (
  scannedText: string,
  students: Student[]
): Student | null => {
  const cleanText = scannedText.trim();
  if (!cleanText) return null;

  // Try parsing as JSON payload first
  try {
    const data = JSON.parse(cleanText);
    if (data && typeof data === 'object') {
      if (data.id) {
        const found = students.find((s) => s.id === data.id);
        if (found) return found;
      }
      if (data.nisn) {
        const found = students.find((s) => s.nisn === data.nisn);
        if (found) return found;
      }
      if (data.nis) {
        const found = students.find((s) => s.nis === data.nis);
        if (found) return found;
      }
    }
  } catch {
    // Not JSON, continue to raw string matching
  }

  // Check matching directly by ID, NISN, or NIS
  const byId = students.find((s) => s.id.toLowerCase() === cleanText.toLowerCase());
  if (byId) return byId;

  const byNisn = students.find((s) => s.nisn === cleanText);
  if (byNisn) return byNisn;

  const byNis = students.find((s) => s.nis === cleanText);
  if (byNis) return byNis;

  // Match by partial name or number in text if scanned from custom QR
  const byName = students.find(
    (s) => s.name.toLowerCase() === cleanText.toLowerCase()
  );
  if (byName) return byName;

  return null;
};

export const generateQrDataUrl = async (
  payload: string,
  size = 240
): Promise<string> => {
  try {
    return await QRCode.toDataURL(payload, {
      width: size,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR', err);
    return '';
  }
};
