import { Student } from '../types';

/**
 * Validates if a file is strictly JPG or JPEG format.
 */
export function validateJpgFile(file: File): { valid: boolean; message?: string } {
  const fileName = file.name.toLowerCase();
  const isJpgExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
  const isJpgMime = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === '';

  if (!isJpgExtension && file.type !== 'image/jpeg') {
    return {
      valid: false,
      message: `File "${file.name}" bukan format JPG/JPEG. Mohon pilih file berekstensi .jpg atau .jpeg.`,
    };
  }

  // Max 1MB per image before processing
  const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB = 1,048,576 bytes
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      message: `Ukuran file "${file.name}" (${sizeInMb} MB) melebihi batas maksimal 1 MB. Mohon gunakan file dengan ukuran maksimal 1 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses and scales an image file to a lightweight JPEG Data URL (3:4 ratio optimized for student ID cards).
 */
export function processJpgImageToDataUrl(
  file: File,
  targetWidth = 480,
  targetHeight = 640
): Promise<string> {
  return new Promise((resolve, reject) => {
    const check = validateJpgFile(file);
    if (!check.valid) {
      reject(new Error(check.message || 'File harus berformat JPG atau JPEG.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar sebagai objek grafis.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas context tidak tersedia.'));
            return;
          }

          // Calculate center crop covering 3:4 aspect ratio
          const targetRatio = targetWidth / targetHeight;
          const imgRatio = img.width / img.height;

          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (imgRatio > targetRatio) {
            // Source is wider than target
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else {
            // Source is taller than target
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }

          // Fill clean background
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Draw image
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

          // Export as JPEG with 0.88 quality
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(jpegDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Attempt to automatically match a photo filename to a student.
 * Examples of matching filenames:
 * - 1001.jpg -> Matches student with NIS '1001'
 * - 0081234567.jpeg -> Matches student with NISN '0081234567'
 * - Ahmad_Dahlan.jpg -> Matches student named 'Ahmad Dahlan'
 */
export function matchStudentByFilename(filename: string, students: Student[]): Student | undefined {
  const cleanName = filename
    .replace(/\.(jpg|jpeg)$/i, '')
    .trim()
    .toLowerCase();

  if (!cleanName) return undefined;

  // 1. Direct NIS match
  const matchNis = students.find((s) => s.nis.trim().toLowerCase() === cleanName);
  if (matchNis) return matchNis;

  // 2. Direct NISN match
  const matchNisn = students.find((s) => s.nisn.trim().toLowerCase() === cleanName);
  if (matchNisn) return matchNisn;

  // 3. Name match with normalized separators (underscores, dashes)
  const normalizedSearch = cleanName.replace(/[_\-+.]/g, ' ').replace(/\s+/g, ' ');
  const matchName = students.find((s) => {
    const sNameNorm = s.name.trim().toLowerCase().replace(/\s+/g, ' ');
    return sNameNorm === normalizedSearch || sNameNorm.includes(normalizedSearch) || normalizedSearch.includes(sNameNorm);
  });

  return matchName;
}
