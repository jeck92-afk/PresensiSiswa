/**
 * Centralized Time and Timezone Management for Indonesian School Attendance
 * Default: Waktu Indonesia Timur (WIT) - UTC+9 (Asia/Jayapura)
 */

export type IndonesianTimeZone = 'WIT' | 'WITA' | 'WIB';

export const TIMEZONE_IANA_MAP: Record<IndonesianTimeZone, string> = {
  WIT: 'Asia/Jayapura',   // UTC+9 (Maluku, Papua)
  WITA: 'Asia/Makassar',  // UTC+8 (Sulawesi, Bali, Nusa Tenggara, Kalimantan)
  WIB: 'Asia/Jakarta',    // UTC+7 (Jawa, Sumatera)
};

export const DEFAULT_TIMEZONE_CODE: IndonesianTimeZone = 'WIT';
export const DEFAULT_TIMEZONE_IANA: string = TIMEZONE_IANA_MAP[DEFAULT_TIMEZONE_CODE];

/**
 * Returns IANA timezone name (e.g. 'Asia/Jayapura')
 */
export function getTimeZoneIana(timeZoneCode?: string): string {
  if (timeZoneCode && timeZoneCode in TIMEZONE_IANA_MAP) {
    return TIMEZONE_IANA_MAP[timeZoneCode as IndonesianTimeZone];
  }
  return DEFAULT_TIMEZONE_IANA;
}

/**
 * Returns standardized time zone code label (e.g. 'WIT')
 */
export function getTimeZoneLabel(timeZoneCode?: string): IndonesianTimeZone {
  if (timeZoneCode && (timeZoneCode === 'WITA' || timeZoneCode === 'WIB')) {
    return timeZoneCode;
  }
  return DEFAULT_TIMEZONE_CODE;
}

/**
 * Returns current date string formatted as YYYY-MM-DD in the specified timezone (default WIT)
 */
export function getTodayDateString(timeZoneCode: string = DEFAULT_TIMEZONE_CODE): string {
  const iana = getTimeZoneIana(timeZoneCode);
  try {
    // en-CA locale formats natively as YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: iana,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Returns time string in HH:mm:ss or HH:mm formatted in the specified timezone (default WIT)
 */
export function getCurrentTimeString(
  dateInput?: Date | number,
  includeSeconds: boolean = true,
  timeZoneCode: string = DEFAULT_TIMEZONE_CODE
): string {
  const date = dateInput ? (typeof dateInput === 'number' ? new Date(dateInput) : dateInput) : new Date();
  const iana = getTimeZoneIana(timeZoneCode);

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: iana,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    if (includeSeconds) {
      options.second = '2-digit';
    }
    const formatter = new Intl.DateTimeFormat('id-ID', options);
    // Replace dots with colons in Indonesian format if any (e.g., "07.15.00" -> "07:15:00")
    return formatter.format(date).replace(/\./g, ':');
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return includeSeconds
      ? `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
      : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

/**
 * Formats time with timezone label, e.g. "07:15:20 WIT"
 */
export function formatTimeWithZone(
  dateInput?: Date | number,
  includeSeconds: boolean = true,
  timeZoneCode: string = DEFAULT_TIMEZONE_CODE
): string {
  const label = getTimeZoneLabel(timeZoneCode);
  const timeStr = getCurrentTimeString(dateInput, includeSeconds, timeZoneCode);
  return `${timeStr} ${label}`;
}

/**
 * Formats YYYY-MM-DD or date object into Indonesian date format (e.g. "5 September 2026")
 */
export function formatIndonesianDate(dateStrOrObj: string | Date | number): string {
  if (!dateStrOrObj) return '';

  if (typeof dateStrOrObj !== 'string') {
    const d = typeof dateStrOrObj === 'number' ? new Date(dateStrOrObj) : dateStrOrObj;
    return d.toLocaleDateString('id-ID', {
      timeZone: DEFAULT_TIMEZONE_IANA,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  try {
    const [year, month, day] = dateStrOrObj.split('-');
    if (!year || !month || !day) return dateStrOrObj;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const monthIndex = parseInt(month, 10) - 1;
    const dayNum = parseInt(day, 10);
    if (monthIndex >= 0 && monthIndex < 12 && !isNaN(dayNum)) {
      return `${dayNum} ${months[monthIndex]} ${year}`;
    }
    return dateStrOrObj;
  } catch {
    return String(dateStrOrObj);
  }
}

/**
 * Formats full Indonesian date and day with time in WIT
 * e.g. "Sabtu, 5 September 2026 - 07:15 WIT"
 */
export function formatFullIndonesianDateTime(
  dateInput?: Date | number,
  timeZoneCode: string = DEFAULT_TIMEZONE_CODE
): string {
  const date = dateInput ? (typeof dateInput === 'number' ? new Date(dateInput) : dateInput) : new Date();
  const iana = getTimeZoneIana(timeZoneCode);
  const label = getTimeZoneLabel(timeZoneCode);

  try {
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: iana,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);

    const timeFormatted = getCurrentTimeString(date, true, timeZoneCode);
    return `${dateFormatted} - ${timeFormatted} ${label}`;
  } catch {
    return date.toString();
  }
}
