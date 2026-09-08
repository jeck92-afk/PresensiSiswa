import React from 'react';

interface QrScanner2DIllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const QrScanner2DIllustration: React.FC<QrScanner2DIllustrationProps> = ({
  className = '',
  width = '100%',
  height = '100%',
}) => {
  return (
    <svg
      viewBox="0 0 420 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width, height }}
      aria-label="Ilustrasi 2D Pemindai QR Presensi"
    >
      <defs>
        {/* Glow Effects */}
        <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="scannerCone" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>

        <linearGradient id="tabletBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <filter id="subtleDrop" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Background Soft Circles */}
      <circle cx="210" cy="150" r="120" fill="#0284c7" fillOpacity="0.05" />
      <circle cx="210" cy="150" r="85" fill="#10b981" fillOpacity="0.04" />

      {/* Target Scanner Reticle Corners */}
      <path d="M 80 70 L 60 70 A 10 10 0 0 0 50 80 L 50 100" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 340 70 L 360 70 A 10 10 0 0 1 370 80 L 370 100" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 80 230 L 60 230 A 10 10 0 0 1 50 220 L 50 200" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 340 230 L 360 230 A 10 10 0 0 0 370 220 L 370 200" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* Scanning Cone Area */}
      <polygon points="210,50 90,210 330,210" fill="url(#scannerCone)" />

      {/* Student ID Card Floating */}
      <g transform="translate(110, 85)" filter="url(#subtleDrop)">
        {/* Card Body */}
        <rect x="0" y="0" width="200" height="125" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        
        {/* Card Header Stripe */}
        <rect x="0" y="0" width="200" height="32" rx="14" fill="#2563eb" />
        <rect x="0" y="16" width="200" height="16" fill="#2563eb" />
        {/* Card Header Text */}
        <rect x="14" y="10" width="55" height="6" rx="2" fill="#ffffff" />
        <rect x="14" y="19" width="35" height="4" rx="1.5" fill="#93c5fd" />
        {/* Chip gold */}
        <rect x="160" y="9" width="26" height="15" rx="3" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />

        {/* Student Avatar */}
        <circle cx="45" cy="74" r="22" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="2" />
        <circle cx="45" cy="68" r="9" fill="#4f46e5" />
        <path d="M 31 89 C 31 80, 59 80, 59 89" fill="#4f46e5" />

        {/* Student Data Lines */}
        <rect x="76" y="52" width="55" height="7" rx="2" fill="#0f172a" />
        <rect x="76" y="64" width="40" height="5" rx="1.5" fill="#64748b" />
        <rect x="76" y="74" width="45" height="5" rx="1.5" fill="#94a3b8" />
        {/* Class Badge */}
        <rect x="76" y="86" width="48" height="14" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
        <text x="100" y="96" fill="#1d4ed8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          X IPAS
        </text>

        {/* Big QR Code on Card */}
        <g transform="translate(138, 48)">
          <rect x="0" y="0" width="52" height="52" rx="6" fill="#0f172a" />
          {/* QR Inner Squares */}
          {/* Top-Left Finder */}
          <rect x="5" y="5" width="14" height="14" fill="#ffffff" rx="2" />
          <rect x="8" y="8" width="8" height="8" fill="#0f172a" rx="1" />
          {/* Top-Right Finder */}
          <rect x="33" y="5" width="14" height="14" fill="#ffffff" rx="2" />
          <rect x="36" y="8" width="8" height="8" fill="#0f172a" rx="1" />
          {/* Bottom-Left Finder */}
          <rect x="5" y="33" width="14" height="14" fill="#ffffff" rx="2" />
          <rect x="8" y="36" width="8" height="8" fill="#0f172a" rx="1" />
          {/* Pixels */}
          <rect x="23" y="9" width="5" height="5" fill="#ffffff" />
          <rect x="23" y="19" width="5" height="5" fill="#ffffff" />
          <rect x="33" y="23" width="5" height="5" fill="#ffffff" />
          <rect x="23" y="33" width="5" height="5" fill="#ffffff" />
          <rect x="33" y="38" width="5" height="5" fill="#ffffff" />
          <rect x="42" y="33" width="5" height="5" fill="#ffffff" />
          {/* Center Green Target */}
          <circle cx="26" cy="26" r="3" fill="#10b981" />
        </g>
      </g>

      {/* Dynamic Laser Beam across Card */}
      <line x1="80" y1="150" x2="340" y2="150" stroke="url(#laserGrad)" strokeWidth="4" filter="url(#laserGlow)" />
      <circle cx="210" cy="150" r="4" fill="#ffffff" filter="url(#laserGlow)" />

      {/* Floating Checkmark Success Wave Badge */}
      <g transform="translate(290, 185)" filter="url(#subtleDrop)">
        <rect x="0" y="0" width="115" height="34" rx="17" fill="#10b981" />
        <circle cx="17" cy="17" r="10" fill="#ffffff" />
        <path d="M 12 17 L 15 20 L 22 13" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="35" y="16" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          SIAP SCAN
        </text>
        <text x="35" y="26" fill="#d1fae5" fontSize="7.5" fontWeight="600" fontFamily="sans-serif">
          Arahkan QR ke Kamera
        </text>
      </g>
    </svg>
  );
};
