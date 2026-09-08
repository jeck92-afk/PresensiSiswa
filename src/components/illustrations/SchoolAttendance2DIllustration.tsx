import React from 'react';

interface SchoolAttendance2DIllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const SchoolAttendance2DIllustration: React.FC<SchoolAttendance2DIllustrationProps> = ({
  className = '',
  width = '100%',
  height = '100%',
}) => {
  return (
    <svg
      viewBox="0 0 560 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width, height }}
      aria-label="Ilustrasi 2D Presensi Siswa dan Pemindai QR Sekolah"
    >
      <defs>
        {/* Soft Background Gradient */}
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
        </linearGradient>

        {/* School Building Gradient */}
        <linearGradient id="schoolWall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id="windowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
        </linearGradient>

        {/* Kiosk Totem Gradient */}
        <linearGradient id="kioskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Laser Scanner Beam */}
        <linearGradient id="scanBeam" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>

        {/* Sun Glow */}
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>

        {/* Student Uniform Blue */}
        <linearGradient id="uniformBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Student Uniform Grey (Indonesian SMA Pants/Skirt) */}
        <linearGradient id="smaGrey" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Filter Soft Drop Shadow */}
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
        </filter>

        <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Decorative Sun & Celestial Circle */}
      <circle cx="460" cy="90" r="70" fill="url(#sunGlow)" />
      <circle cx="460" cy="90" r="38" fill="#fbbf24" fillOpacity="0.35" />
      <circle cx="460" cy="90" r="22" fill="#fef08a" />

      {/* Modern School Building Silhouette (Background) */}
      <g opacity="0.85">
        {/* Main School Center Tower */}
        <path d="M 210 110 L 250 85 L 290 110 L 290 320 L 210 320 Z" fill="url(#schoolWall)" />
        {/* School Clock */}
        <circle cx="250" cy="130" r="14" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
        <line x1="250" y1="130" x2="250" y2="122" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <line x1="250" y1="130" x2="256" y2="130" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

        {/* School Wings & Windows */}
        <rect x="130" y="150" width="80" height="170" rx="4" fill="#1e293b" />
        <rect x="290" y="150" width="80" height="170" rx="4" fill="#1e293b" />

        {/* Windows */}
        <rect x="145" y="170" width="22" height="28" rx="3" fill="url(#windowGlow)" />
        <rect x="175" y="170" width="22" height="28" rx="3" fill="url(#windowGlow)" />
        <rect x="145" y="215" width="22" height="28" rx="3" fill="url(#windowGlow)" />
        <rect x="175" y="215" width="22" height="28" rx="3" fill="url(#windowGlow)" />

        <rect x="305" y="170" width="22" height="28" rx="3" fill="url(#windowGlow)" />
        <rect x="335" y="170" width="22" height="28" rx="3" fill="url(#windowGlow)" />
        <rect x="305" y="215" width="22" height="28" rx="3" fill="url(#windowGlow)" />
        <rect x="335" y="215" width="22" height="28" rx="3" fill="url(#windowGlow)" />

        {/* Modern Flat School Roof Trim */}
        <rect x="125" y="145" width="250" height="6" rx="2" fill="#0284c7" />
        <polygon points="250,60 250,85 244,72" fill="#ef4444" />
        <line x1="250" y1="58" x2="250" y2="85" stroke="#94a3b8" strokeWidth="2" />
      </g>

      {/* Modern Floor / Plaza Platform */}
      <ellipse cx="280" cy="335" rx="260" ry="35" fill="#0f172a" fillOpacity="0.7" />
      <ellipse cx="280" cy="335" rx="220" ry="22" fill="#1e293b" fillOpacity="0.9" />

      {/* Decorative Tropical Leaves / Planters (Left) */}
      <g transform="translate(40, 220)">
        <path d="M 20 100 Q 10 30 50 10 Q 30 60 20 100" fill="#059669" />
        <path d="M 20 100 Q 0 40 10 15 Q 15 65 20 100" fill="#10b981" />
        <path d="M 20 100 Q 40 45 75 35 Q 50 70 20 100" fill="#34d399" />
        {/* Pot */}
        <path d="M 5 95 L 35 95 L 30 120 L 10 120 Z" fill="#334155" />
      </g>

      {/* Decorative Modern Kiosk Terminal (Center Right) */}
      <g transform="translate(295, 140)">
        {/* Kiosk Shadow */}
        <ellipse cx="40" cy="190" rx="35" ry="10" fill="#000000" fillOpacity="0.4" />

        {/* Kiosk Body Pillar */}
        <rect x="25" y="90" width="30" height="98" rx="6" fill="url(#kioskGrad)" />
        <ellipse cx="40" cy="188" rx="28" ry="7" fill="#0284c7" fillOpacity="0.5" />

        {/* Screen Tablet Head */}
        <rect x="0" y="0" width="80" height="96" rx="14" fill="#0f172a" stroke="#0284c7" strokeWidth="3" filter="url(#cardShadow)" />
        {/* Screen Bezel & Display */}
        <rect x="6" y="6" width="68" height="84" rx="8" fill="#1e293b" />
        
        {/* UI Display inside Kiosk */}
        <circle cx="40" cy="28" r="12" fill="#059669" filter="url(#glowGreen)" />
        <path d="M 34 28 L 38 32 L 47 24" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="46" width="44" height="5" rx="2.5" fill="#38bdf8" />
        <rect x="24" y="55" width="32" height="4" rx="2" fill="#94a3b8" />
        <rect x="15" y="66" width="50" height="16" rx="4" fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="1" />
        <text x="40" y="77" fill="#34d399" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          TERVERIFIKASI
        </text>

        {/* Holographic QR Scanning Beam Wave */}
        <path d="M 0 96 L -45 160 L 5 160 Z" fill="url(#scanBeam)" />
        <line x1="-45" y1="160" x2="5" y2="160" stroke="#34d399" strokeWidth="2.5" filter="url(#glowGreen)" />
      </g>

      {/* Student 1 (Male Student holding QR Card) - Left */}
      <g transform="translate(140, 150)">
        {/* Character Shadow */}
        <ellipse cx="50" cy="185" rx="30" ry="8" fill="#000000" fillOpacity="0.35" />

        {/* Legs & Grey Trousers */}
        <path d="M 36 125 L 34 180 L 46 180 L 48 125 Z" fill="url(#smaGrey)" />
        <path d="M 52 125 L 54 180 L 66 180 L 64 125 Z" fill="url(#smaGrey)" />
        {/* Shoes */}
        <ellipse cx="38" cy="182" rx="10" ry="4" fill="#0f172a" />
        <ellipse cx="62" cy="182" rx="10" ry="4" fill="#0f172a" />

        {/* Body Shirt (White Uniform) */}
        <path d="M 28 65 L 72 65 L 68 126 L 32 126 Z" fill="#f8fafc" />
        {/* Tie (Blue SMA) */}
        <polygon points="50,68 47,80 50,110 53,80" fill="#2563eb" />
        {/* Pocket Badge */}
        <rect x="36" y="80" width="8" height="10" rx="1" fill="#cbd5e1" />
        <rect x="38" y="83" width="4" height="3" fill="#2563eb" />

        {/* Head & Hair */}
        <circle cx="50" cy="40" r="16" fill="#fed7aa" />
        {/* Neat Hair */}
        <path d="M 34 38 C 34 22, 66 22, 66 38 C 66 30, 58 26, 50 26 C 42 26, 36 30, 34 38 Z" fill="#1e293b" />
        {/* Friendly Face details */}
        <circle cx="45" cy="40" r="1.5" fill="#1e293b" />
        <circle cx="55" cy="40" r="1.5" fill="#1e293b" />
        <path d="M 47 46 Q 50 49 53 46" stroke="#c2410c" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Left Arm & Hand holding Student ID Card */}
        <path d="M 30 70 L 15 100 L 25 110" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        
        {/* Right Arm extended towards Kiosk holding QR Card */}
        <path d="M 68 70 L 95 90 L 120 85" stroke="#fed7aa" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 68 70 L 88 85" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" />

        {/* Digital Student Card with QR */}
        <g transform="translate(112, 72) rotate(-8)">
          <rect x="0" y="0" width="34" height="24" rx="4" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" filter="url(#cardShadow)" />
          {/* Card Header Strip */}
          <rect x="0" y="0" width="34" height="6" rx="4" fill="#2563eb" />
          {/* Micro Photo */}
          <rect x="4" y="9" width="8" height="10" rx="1" fill="#93c5fd" />
          {/* QR Pattern Mini */}
          <rect x="18" y="9" width="11" height="11" rx="1" fill="#0f172a" />
          <rect x="20" y="11" width="3" height="3" fill="#ffffff" />
          <rect x="24" y="15" width="3" height="3" fill="#ffffff" />
          {/* Lanyard Cord */}
          <path d="M 17 0 C 10 -20, 2 -25, -6 -18" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 1" fill="none" />
        </g>
      </g>

      {/* Student 2 (Female Student with Hijab) - Right */}
      <g transform="translate(390, 160)">
        {/* Character Shadow */}
        <ellipse cx="45" cy="175" rx="28" ry="7" fill="#000000" fillOpacity="0.35" />

        {/* Long Grey Skirt (Indonesian SMA) */}
        <path d="M 30 115 L 22 170 L 68 170 L 60 115 Z" fill="url(#smaGrey)" />
        {/* Shoes */}
        <ellipse cx="36" cy="172" rx="9" ry="4" fill="#0f172a" />
        <ellipse cx="54" cy="172" rx="9" ry="4" fill="#0f172a" />

        {/* White Uniform Top */}
        <path d="M 26 65 L 64 65 L 60 118 L 30 118 Z" fill="#f8fafc" />

        {/* Hijab (White with soft shading) */}
        <path d="M 22 36 C 22 15, 68 15, 68 36 C 72 55, 64 85, 58 92 L 45 88 L 32 92 C 26 85, 18 55, 22 36 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
        {/* Face Oval */}
        <ellipse cx="45" cy="42" rx="12" ry="14" fill="#fed7aa" />
        {/* Friendly eyes and smile */}
        <circle cx="41" cy="42" r="1.5" fill="#1e293b" />
        <circle cx="49" cy="42" r="1.5" fill="#1e293b" />
        <path d="M 42 48 Q 45 51 48 48" stroke="#c2410c" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Cheerful waving hand */}
        <path d="M 24 70 L 10 85 L 8 100" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 64 70 L 78 55 L 85 45" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Holding phone / card */}
        <rect x="80" y="36" width="12" height="20" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
      </g>

      {/* Floating 2D Status Badges (Gamification & Tech Look) */}
      {/* Badge 1: Realtime Verified */}
      <g transform="translate(30, 70)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="145" height="38" rx="19" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
        <circle cx="20" cy="19" r="11" fill="#10b981" />
        <path d="M 15 19 L 18 22 L 25 15" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="38" y="17" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          Presensi Cepat
        </text>
        <text x="38" y="28" fill="#34d399" fontSize="8" fontWeight="600" fontFamily="sans-serif">
          Scan QR &lt; 1 Detik
        </text>
      </g>

      {/* Badge 2: WhatsApp Notification */}
      <g transform="translate(390, 45)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="150" height="38" rx="19" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
        <circle cx="20" cy="19" r="11" fill="#22c55e" />
        {/* Chat icon */}
        <path d="M 14 17 C 14 14.5, 17 13, 20 13 C 23 13, 26 14.5, 26 17 C 26 19.5, 23 21, 20 21 L 18 23 L 18 21 C 15 21, 14 19.5, 14 17 Z" fill="#ffffff" />
        <text x="38" y="17" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          Notif WA Wali
        </text>
        <text x="38" y="28" fill="#4ade80" fontSize="8" fontWeight="600" fontFamily="sans-serif">
          Kirim Otomatis
        </text>
      </g>

      {/* Badge 3: Google Sheets Connected */}
      <g transform="translate(200, 20)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="140" height="34" rx="17" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.5" />
        <circle cx="17" cy="17" r="9" fill="#0ea5e9" />
        <rect x="13" y="12" width="8" height="10" rx="1.5" fill="#ffffff" />
        <line x1="15" y1="15" x2="19" y2="15" stroke="#0ea5e9" strokeWidth="1" />
        <line x1="15" y1="18" x2="19" y2="18" stroke="#0ea5e9" strokeWidth="1" />
        <text x="33" y="16" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Google Sheets
        </text>
        <text x="33" y="26" fill="#38bdf8" fontSize="7.5" fontWeight="600" fontFamily="sans-serif">
          Sinkronisasi Cloud
        </text>
      </g>

      {/* Sparkling Stars / Vector Dots */}
      <circle cx="100" cy="130" r="2.5" fill="#38bdf8" opacity="0.8" />
      <circle cx="120" cy="145" r="1.5" fill="#fbbf24" opacity="0.9" />
      <circle cx="490" cy="170" r="2" fill="#34d399" opacity="0.8" />
      <circle cx="470" cy="220" r="3" fill="#38bdf8" opacity="0.6" />
      <circle cx="280" cy="65" r="2" fill="#facc15" opacity="0.8" />
    </svg>
  );
};
