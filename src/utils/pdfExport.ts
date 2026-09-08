import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, SchoolConfig, Student } from '../types';
import { formatIndonesianDate } from '../data/initialData';

export interface ReportPdfOptions {
  title?: string;
  subtitle?: string;
  periodLabel?: string;
  selectedClass?: string;
  reportDate?: string; // e.g. "2026-09-06"
  cityName?: string; // e.g. "Tihulale"
  signer1Title?: string; // e.g. "Mengetahui,\nKepala Sekolah"
  signer1Name?: string;
  signer1Nip?: string;
  signer2Title?: string; // e.g. "Petugas / Guru Piket Presensi"
  signer2Name?: string;
  signer2Nip?: string;
  orientation?: 'portrait' | 'landscape';
}

export function generateAttendancePdf(
  records: AttendanceRecord[],
  students: Student[],
  config: SchoolConfig,
  options: ReportPdfOptions = {}
) {
  const orientation = options.orientation || (records.length > 0 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Extract city name from school address or default to Tihulale
  const city = options.cityName || 'Tihulale';
  const printDateStr = formatIndonesianDate(options.reportDate || new Date().toISOString().split('T')[0]);

  // 1. KOP SURAT RESMI SEKOLAH
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('PEMERINTAH PROVINSI MALUKU', pageWidth / 2, 12, { align: 'center' });
  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 16.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 22.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  const addressLine = `${config.schoolAddress} | NPSN: ${config.schoolNpsn}`;
  doc.text(addressLine, pageWidth / 2, 27, { align: 'center' });

  // Double horizontal rule (Garuda / Kop Surat Style)
  const lineY = 29.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(margin, lineY, pageWidth - margin, lineY);
  doc.setLineWidth(0.2);
  doc.line(margin, lineY + 0.8, pageWidth - margin, lineY + 0.8);

  // 2. JUDUL LAPORAN & METADATA
  const titleY = lineY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const mainTitle = options.title || 'LAPORAN REKAPITULASI PRESENSI SISWA';
  doc.text(mainTitle, pageWidth / 2, titleY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const metaY = titleY + 5;
  const periodText = options.periodLabel || `Periode: ${printDateStr}`;
  const classText = `Kelas: ${options.selectedClass || 'Semua Kelas'}`;
  const semesterText = `Tahun Pelajaran: ${config.academicYear}`;
  doc.text(`${periodText}  |  ${classText}  |  ${semesterText}`, pageWidth / 2, metaY, { align: 'center' });

  // 3. STATISTIK RINGKASAN DATA
  const total = records.length;
  const hadir = records.filter((r) => r.status === 'HADIR').length;
  const terlambat = records.filter((r) => r.status === 'TERLAMBAT').length;
  const sakit = records.filter((r) => r.status === 'SAKIT').length;
  const izin = records.filter((r) => r.status === 'IZIN').length;
  const alpa = records.filter((r) => r.status === 'ALPA').length;
  const hadirRate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

  const statsY = metaY + 3.5;
  const boxWidth = (pageWidth - margin * 2) / 6;
  const boxHeight = 8.5;

  const statItems = [
    { label: 'Total Catatan', val: `${total}`, color: [241, 245, 249], textCol: [30, 41, 59] },
    { label: 'Hadir (H)', val: `${hadir}`, color: [236, 253, 245], textCol: [4, 120, 87] },
    { label: 'Terlambat (T)', val: `${terlambat}`, color: [254, 243, 199], textCol: [180, 83, 9] },
    { label: 'Sakit (S)', val: `${sakit}`, color: [224, 242, 254], textCol: [3, 105, 161] },
    { label: 'Izin (I)', val: `${izin}`, color: [239, 246, 255], textCol: [29, 78, 216] },
    { label: 'Alpa (A)', val: `${alpa}`, color: [255, 228, 230], textCol: [190, 18, 60] },
  ];

  statItems.forEach((st, i) => {
    const x = margin + i * boxWidth;
    doc.setFillColor(st.color[0], st.color[1], st.color[2]);
    doc.rect(x, statsY, boxWidth - 1.5, boxHeight, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(st.label, x + (boxWidth - 1.5) / 2, statsY + 3, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(st.textCol[0], st.textCol[1], st.textCol[2]);
    doc.text(st.val, x + (boxWidth - 1.5) / 2, statsY + 7, { align: 'center' });
  });

  // 4. TABEL PRESENSI SISWA (AutoTable)
  const tableStartY = statsY + boxHeight + 4;

  const headers = [
    ['No', 'Tanggal', 'Waktu', 'NIS', 'Nama Siswa', 'Kelas', 'L/P', 'Status', 'Keterangan / Alasan Resmi']
  ];

  const rows = records.map((r, idx) => [
    idx + 1,
    r.date,
    r.time || '-',
    r.studentNis || '-',
    r.studentName,
    r.studentClass,
    r.gender || '-',
    r.status,
    r.note || '-'
  ]);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin, bottom: 42 },
    head: headers,
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 }, // No
      1: { halign: 'center', cellWidth: 20 }, // Tanggal
      2: { halign: 'center', cellWidth: 15 }, // Waktu
      3: { halign: 'center', cellWidth: 18 }, // NIS
      4: { halign: 'left', fontStyle: 'bold' }, // Nama Siswa
      5: { halign: 'center', cellWidth: 16 }, // Kelas
      6: { halign: 'center', cellWidth: 10 }, // L/P
      7: { halign: 'center', cellWidth: 20 }, // Status
      8: { halign: 'left' }, // Keterangan
    },
    didParseCell: (data) => {
      // Highlight Status column
      if (data.section === 'body' && data.column.index === 7) {
        const val = data.cell.raw;
        if (val === 'SAKIT') {
          data.cell.styles.textColor = [3, 105, 161];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'IZIN') {
          data.cell.styles.textColor = [29, 78, 216];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'ALPA') {
          data.cell.styles.textColor = [190, 18, 60];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'TERLAMBAT') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'HADIR') {
          data.cell.styles.textColor = [4, 120, 87];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data) => {
      // Page numbering footer
      const totalPagesExp = '{total_pages_count_string}';
      const str = `Halaman ${data.pageNumber} • Dokumen Resmi Rekapitulasi Presensi ${config.schoolName}`;
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(str, margin, pageHeight - 6);
      doc.text(`Tingkat Kehadiran: ${hadirRate}%`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }
  });

  // 5. LEMBAR PENGESAHAN / TANDA TANGAN RESMI
  // Retrieve the final Y position after the table
  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // If table ended near bottom of page, add a new page for signatures
  let signY = finalY + 8;
  if (signY + 36 > pageHeight - margin) {
    doc.addPage();
    signY = 25;
  }

  const signColWidth = 70;
  const leftSignX = margin + 10;
  const rightSignX = pageWidth - margin - signColWidth;

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Left Sign: Kepala Sekolah
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', leftSignX + signColWidth / 2, signY, { align: 'center' });
  doc.text('Kepala Sekolah', leftSignX + signColWidth / 2, signY + 4, { align: 'center' });

  const principalName = options.signer1Name || config.principalName;
  const principalNip = options.signer1Nip || config.principalNip || '-';

  doc.setFont('helvetica', 'bold');
  doc.text(principalName, leftSignX + signColWidth / 2, signY + 24, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(leftSignX + 5, signY + 25, leftSignX + signColWidth - 5, signY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${principalNip}`, leftSignX + signColWidth / 2, signY + 28.5, { align: 'center' });

  // Right Sign: Petugas / Guru Piket
  const dateHeading = `${city}, ${printDateStr}`;
  doc.setFontSize(8.5);
  doc.text(dateHeading, rightSignX + signColWidth / 2, signY, { align: 'center' });
  const signer2Title = options.signer2Title || 'Petugas Presensi / Guru Piket';
  doc.text(signer2Title, rightSignX + signColWidth / 2, signY + 4, { align: 'center' });

  const signer2Name = options.signer2Name || 'Admin Presensi Sekolah';
  const signer2Nip = options.signer2Nip || '-';

  doc.setFont('helvetica', 'bold');
  doc.text(signer2Name, rightSignX + signColWidth / 2, signY + 24, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(rightSignX + 5, signY + 25, rightSignX + signColWidth - 5, signY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP/NUPTK: ${signer2Nip}`, rightSignX + signColWidth / 2, signY + 28.5, { align: 'center' });

  // 6. SAVE & DOWNLOAD FILE
  const sanitizedSchoolName = config.schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedClass = (options.selectedClass || 'Semua_Kelas').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Presensi_${sanitizedSchoolName}_${sanitizedClass}_${options.reportDate || 'rekap'}.pdf`;

  doc.save(fileName);
}
