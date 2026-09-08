import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Edit3,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  X,
  Save,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
import { AdminAccount, AdminRole, SchoolConfig } from '../types';
import {
  getAdminAccounts,
  updateAdminAccount,
  addAdminAccount,
  deleteAdminAccount,
  resetAdminAccountsToDefault,
  updateAdminPassword,
} from '../utils/authService';

interface AdminAccountsManagerProps {
  config: SchoolConfig;
  onUpdateConfig?: (updated: SchoolConfig) => void;
  onSessionUserUpdated?: (account: AdminAccount) => void;
}

export const AdminAccountsManager: React.FC<AdminAccountsManagerProps> = ({
  config,
  onUpdateConfig,
  onSessionUserUpdated,
}) => {
  const [accounts, setAccounts] = useState<AdminAccount[]>(() => getAdminAccounts());
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Edit Form State
  const [editFullName, setEditFullName] = useState<string>('');
  const [editNip, setEditNip] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editRole, setEditRole] = useState<AdminRole>('Super Admin');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editNewPassword, setEditNewPassword] = useState<string>('');
  const [syncToPrincipalConfig, setSyncToPrincipalConfig] = useState<boolean>(true);
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);

  // Status & Feedback message
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const refreshAccounts = () => {
    const list = getAdminAccounts();
    setAccounts(list);
    return list;
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Open Edit Modal / Form
  const handleStartEdit = (acc: AdminAccount) => {
    setEditingAccount(acc);
    setIsAddingNew(false);
    setEditFullName(acc.fullName);
    setEditNip(acc.nip || '');
    setEditUsername(acc.username);
    setEditRole(acc.role);
    setEditEmail(acc.email || '');
    setEditNewPassword('');
    setShowPasswordInput(false);
    setSyncToPrincipalConfig(acc.role === 'Kepala Sekolah');
  };

  // Open Add New Account Form
  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingAccount(null);
    setEditFullName('');
    setEditNip('');
    setEditUsername('');
    setEditRole('Operator Presensi');
    setEditEmail('');
    setEditNewPassword('123456');
    setShowPasswordInput(false);
    setSyncToPrincipalConfig(false);
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setIsAddingNew(false);
  };

  // Save changes for editing or creating
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFullName.trim()) {
      showNotification('error', 'Nama lengkap akun wajib diisi.');
      return;
    }

    if (!editUsername.trim()) {
      showNotification('error', 'Username wajib diisi.');
      return;
    }

    if (isAddingNew) {
      // Adding new account
      const res = addAdminAccount({
        fullName: editFullName.trim(),
        nip: editNip.trim(),
        username: editUsername.trim().toLowerCase(),
        role: editRole,
        email: editEmail.trim(),
        passwordHash: editNewPassword.trim() || '123456',
      });

      if (res.success && res.account) {
        refreshAccounts();
        showNotification('success', res.message);
        setIsAddingNew(false);
      } else {
        showNotification('error', res.message);
      }
    } else if (editingAccount) {
      // Editing existing account
      const updates: Partial<AdminAccount> = {
        fullName: editFullName.trim(),
        nip: editNip.trim(),
        username: editUsername.trim().toLowerCase(),
        role: editRole,
        email: editEmail.trim(),
      };

      if (editNewPassword.trim()) {
        if (editNewPassword.trim().length < 5) {
          showNotification('error', 'Kata sandi baru minimal harus 5 karakter.');
          return;
        }
        updates.passwordHash = editNewPassword.trim();
      }

      const res = updateAdminAccount(editingAccount.id, updates);

      if (res.success && res.account) {
        refreshAccounts();
        showNotification('success', res.message);

        // Sync to SchoolConfig if this is Kepala Sekolah
        if (
          (editRole === 'Kepala Sekolah' || editingAccount.role === 'Kepala Sekolah') &&
          syncToPrincipalConfig &&
          onUpdateConfig
        ) {
          onUpdateConfig({
            ...config,
            principalName: editFullName.trim(),
            principalNip: editNip.trim(),
          });
        }

        if (onSessionUserUpdated) {
          onSessionUserUpdated(res.account);
        }

        setEditingAccount(null);
      } else {
        showNotification('error', res.message);
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus akun "${name}"? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      const res = deleteAdminAccount(id);
      if (res.success) {
        refreshAccounts();
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Kembalikan seluruh daftar akun ke bawaan sistem (Administrator Utama, Operator Presensi, dan Kepala Sekolah)?'
      )
    ) {
      const def = resetAdminAccountsToDefault();
      setAccounts(def);
      showNotification('success', 'Daftar akun admin berhasil direset ke pengaturan awal.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 transition-all shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{feedback.message}</div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Daftar Akun Pengguna &amp; NIP Terdaftar</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik tombol <strong>"Edit Akun &amp; NIP"</strong> pada kartu di bawah untuk mengubah Nama Lengkap, NIP, Peran, atau Kata Sandi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Akun</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
            title="Reset ke akun default bawaan"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Grid of Registered Accounts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isSuperAdmin = acc.role === 'Super Admin';
          const isOperator = acc.role === 'Operator Presensi';
          const isKepsek = acc.role === 'Kepala Sekolah';

          const cardTheme = isSuperAdmin
            ? 'border-blue-200 bg-gradient-to-b from-blue-50/40 to-white hover:border-blue-400'
            : isOperator
            ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white hover:border-emerald-400'
            : 'border-purple-200 bg-gradient-to-b from-purple-50/40 to-white hover:border-purple-400';

          const badgeTheme = isSuperAdmin
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : isOperator
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : 'bg-purple-100 text-purple-800 border-purple-200';

          const avatarBg = isSuperAdmin
            ? 'bg-blue-600 text-white'
            : isOperator
            ? 'bg-emerald-600 text-white'
            : 'bg-purple-600 text-white';

          return (
            <div
              key={acc.id}
              className={`p-4 rounded-2xl border shadow-xs transition-all flex flex-col justify-between ${cardTheme}`}
            >
              <div>
                {/* Card Top: Role Badge & ID */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeTheme}`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{acc.role}</span>
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {acc.id}
                  </span>
                </div>

                {/* Account Profile Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${avatarBg}`}
                  >
                    {acc.fullName
                      ? acc.fullName
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'AD'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug break-words">
                      {acc.fullName}
                    </h4>
                    <div className="text-[11px] font-mono text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
                      <span>User:</span>
                      <strong className="text-slate-900 bg-white/80 px-1.5 py-0.2 rounded border border-slate-200">
                        {acc.username}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* NIP & Email Details Box */}
                <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/90 text-xs space-y-1.5 mb-3">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Fingerprint className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>NIP:</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-800 text-right truncate">
                      {acc.nip || '-'}
                    </span>
                  </div>

                  {acc.email && (
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Email:</span>
                      </span>
                      <span className="text-[10px] text-slate-600 text-right truncate max-w-[140px]">
                        {acc.email}
                      </span>
                    </div>
                  )}

                  {acc.lastLogin && (
                    <div className="text-[10px] text-emerald-700 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Login Terakhir:</span>
                      <span className="font-semibold">{acc.lastLogin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => handleStartEdit(acc)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 hover:border-blue-400 shadow-2xs transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Akun &amp; NIP</span>
                </button>

                {accounts.length > 1 && !isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(acc.id, acc.fullName)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Hapus Akun"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit or Add Account Modal / Panel */}
      {(editingAccount || isAddingNew) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isAddingNew ? 'Tambah Akun Administrator' : 'Edit Akun, Nama & NIP'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAddingNew
                      ? 'Lengkapi data identitas dan kredensial akun baru'
                      : `Perbarui profil untuk ${editingAccount?.fullName}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAccount} className="space-y-4">
              {/* Field 1: Nama Lengkap & Gelar */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Contoh: Drs. H. Bambang Sujarwo, M.Pd."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Nama ini akan ditampilkan pada kop surat, beranda, laporan absensi, dan kartu identitas.
                </p>
              </div>

              {/* Field 2: NIP (Nomor Induk Pegawai) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  NIP (Nomor Induk Pegawai)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    placeholder="Contoh: 19720415 199803 1 004"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pengguna juga dapat menggunakan NIP ini sebagai username saat masuk ke sistem SIADIK.
                </p>
              </div>

              {/* Field 3: Username & Hak Akses (Role) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="misal: admin, operator, kepsek"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Peran / Hak Akses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AdminRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Operator Presensi">Operator Presensi</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                  </select>
                </div>
              </div>

              {/* Field 4: Alamat Email */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Alamat Email (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="nama@sekolah.sch.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Field 5: Kata Sandi Baru (Opsional saat edit, Wajib saat buat baru) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    {isAddingNew ? 'Kata Sandi Awal' : 'Ubah Kata Sandi (Opsional)'}
                  </label>
                  {!isAddingNew && (
                    <span className="text-[10px] text-slate-400">
                      Biarkan kosong jika tidak ingin diubah
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPasswordInput ? 'text' : 'password'}
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder={
                      isAddingNew
                        ? 'Kata sandi akun baru (minimal 5 karakter)'
                        : 'Masukkan kata sandi baru jika ingin mengubah'
                    }
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sync to Principal checkbox if applicable */}
              {(editRole === 'Kepala Sekolah' || editingAccount?.role === 'Kepala Sekolah') && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToPrincipalConfig}
                      onChange={(e) => setSyncToPrincipalConfig(e.target.checked)}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-purple-900">
                        Sinkronkan ke Identitas Kepala Sekolah
                      </span>
                      <p className="text-[11px] text-purple-700 mt-0.5">
                        Otomatis memperbarui Nama &amp; NIP Kepala Sekolah di Kop Surat Kartu Siswa dan Dokumen Resmi.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
