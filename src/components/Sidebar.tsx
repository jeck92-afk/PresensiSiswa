import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  HeartHandshake,
  School,
  BookOpen,
  BookMarked,
  CalendarDays,
  CheckSquare,
  FileSpreadsheet,
  QrCode,
  Moon,
  Sun,
  LogOut,
  Clock,
  X,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { SchoolConfig, AdminAccount } from '../types';
import { PWAInstallButton } from './common/PWAInstallButton';

export type AppMenuTab =
  | 'dashboard'
  | 'teachers'
  | 'students'
  | 'parents'
  | 'classes'
  | 'subjects'
  | 'schedules'
  | 'journals'
  | 'attendance'
  | 'recap'
  | 'scanner';

interface SidebarProps {
  activeTab: AppMenuTab;
  onSelectTab: (tab: AppMenuTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  config: SchoolConfig;
  studentCount: number;
  teacherCount: number;
  classCount: number;
  todayRecordCount: number;
  journalCount?: number;
  onOpenDeveloperModal: () => void;
  adminUser?: AdminAccount | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  onOpenLogout,
  isOpenMobile,
  onCloseMobile,
  config,
  studentCount,
  teacherCount,
  classCount,
  todayRecordCount,
  journalCount = 0,
  onOpenDeveloperModal,
  adminUser,
}) => {
  const mainNavItems = [
    {
      id: 'dashboard' as AppMenuTab,
      label: 'SIADIK (Dasboard)',
      icon: LayoutDashboard,
      badge: 'Utama',
      color: 'text-blue-500',
    },
    {
      id: 'teachers' as AppMenuTab,
      label: 'Data Guru',
      icon: GraduationCap,
      badge: `${teacherCount}`,
      color: 'text-emerald-500',
    },
    {
      id: 'students' as AppMenuTab,
      label: 'Data Siswa',
      icon: Users,
      badge: `${studentCount}`,
      color: 'text-blue-500',
    },
    {
      id: 'parents' as AppMenuTab,
      label: 'Data Orang Tua',
      icon: HeartHandshake,
      badge: null,
      color: 'text-rose-500',
    },
    {
      id: 'classes' as AppMenuTab,
      label: 'Data KElas',
      icon: School,
      badge: `${classCount}`,
      color: 'text-indigo-500',
    },
    {
      id: 'subjects' as AppMenuTab,
      label: 'Mata Pelajaran',
      icon: BookOpen,
      badge: null,
      color: 'text-amber-500',
    },
    {
      id: 'schedules' as AppMenuTab,
      label: 'Jadwal',
      icon: CalendarDays,
      badge: null,
      color: 'text-purple-500',
    },
    {
      id: 'journals' as AppMenuTab,
      label: 'Jurnal Guru',
      icon: BookMarked,
      badge: journalCount > 0 ? `${journalCount}` : 'KBM',
      color: 'text-amber-500',
    },
    {
      id: 'attendance' as AppMenuTab,
      label: 'Absensi',
      icon: CheckSquare,
      badge: todayRecordCount > 0 ? `${todayRecordCount}` : 'Hari Ini',
      color: 'text-emerald-500',
    },
    {
      id: 'recap' as AppMenuTab,
      label: 'Rekap Absensi',
      icon: FileSpreadsheet,
      badge: 'Laporan',
      color: 'text-teal-500',
    },
    {
      id: 'scanner' as AppMenuTab,
      label: 'Scan QR',
      icon: QrCode,
      badge: 'Live',
      color: 'text-indigo-500',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 select-none">
      {/* 1. Brand & Institutional Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo Provinsi Maluku */}
            <div
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center p-1 shrink-0 overflow-hidden ring-2 ring-emerald-500/20"
              title="Pemerintah Provinsi Maluku"
            >
              <img
                src={config.provincialLogoUrl || '/logo_provinsi_maluku.svg'}
                alt="Maluku"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* School Name */}
            <div className="min-w-0">
              <h1 className="font-serif-academic font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                {config.schoolName}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-blue-600 dark:text-blue-400 truncate">SIADIK</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-semibold truncate">Absensi Digital</span>
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logged in Admin User Card */}
        {adminUser && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {adminUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                  {adminUser.fullName}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>{adminUser.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Navigation Items List (Sequential Top to Bottom) */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
        <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu Utama
        </div>

        {/* 1 to 10: Standard Nav Tabs */}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate tracking-tight">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold leading-none shrink-0 ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* PWA Offline App Install Box */}
        <div className="pt-2 px-1">
          <PWAInstallButton variant="sidebar" />
        </div>

        {/* Separator */}
        <div className="pt-2 pb-1">
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Sistem &amp; Tampilan
          </div>
        </div>

        {/* 11. Model Gelap (Interactive Toggle) */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <span>Model Gelap</span>
          </div>

          {/* Toggle pill */}
          <div
            className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${
              isDarkMode ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </div>
        </button>

        {/* 12. Keluar (Logout) */}
        <button
          type="button"
          onClick={onOpenLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 group"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <LogOut className="w-4 h-4" />
          </div>
          <span>Keluar</span>
        </button>
      </div>

      {/* 3. Footer / Developer Credit Card */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
        <button
          type="button"
          onClick={onOpenDeveloperModal}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors text-left cursor-pointer group"
          title="Lihat Profil Pengembang Jecky Marantika, S.Pd., Gr"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-emerald-500/60 ring-2 ring-emerald-500/20">
            <img
              src={config.developerPhotoUrl || '/developer_jecky.svg'}
              alt={config.developerName || 'Jecky Marantika'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold truncate">
              Pengembang Aplikasi
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {config.developerName || 'Jecky Marantika, S.Pd., Gr'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay with Backdrop) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
