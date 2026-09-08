import { AdminAccount, AdminAuthSession } from '../types';

export const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'ADM-01',
    username: 'admin',
    passwordHash: 'admin123',
    fullName: 'Administrator SIADIK Utama',
    role: 'Super Admin',
    email: 'admin.siadik@sekolah.sch.id',
    nip: '19840912 200801 1 007',
    avatarUrl: '/developer_jecky.svg',
  },
  {
    id: 'ADM-02',
    username: 'operator',
    passwordHash: 'operator123',
    fullName: 'Operator Presensi & Dapodik',
    role: 'Operator Presensi',
    email: 'operator@sekolah.sch.id',
    nip: '19900315 201502 2 003',
  },
  {
    id: 'ADM-03',
    username: 'kepsek',
    passwordHash: 'kepsek123',
    fullName: 'Julis Noya, S.Sos., S.Pd., Gr',
    role: 'Kepala Sekolah',
    email: 'kepsek@sekolah.sch.id',
    nip: '197210232000081001',
  },
];

const STORAGE_KEY_ACCOUNTS = 'siadik_admin_accounts_v1';
const STORAGE_KEY_SESSION_LOCAL = 'siadik_auth_session_local_v1';
const STORAGE_KEY_SESSION_SESSION = 'siadik_auth_session_temp_v1';

/**
 * Retrieve all registered admin accounts
 */
export const getAdminAccounts = (): AdminAccount[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Automatically sync kepsek name and NIP if still using initial placeholder
        const updated = parsed.map((acc: AdminAccount) => {
          if (
            acc.role === 'Kepala Sekolah' &&
            (acc.fullName.includes('Bambang Sujarwo') || !acc.nip || acc.nip.includes('19720415'))
          ) {
            return {
              ...acc,
              fullName: 'Julis Noya, S.Sos., S.Pd., Gr',
              nip: '197210232000081001',
            };
          }
          return acc;
        });
        return updated;
      }
    }
  } catch (e) {
    console.error('Failed to load admin accounts:', e);
  }
  return DEFAULT_ADMIN_ACCOUNTS;
};

/**
 * Persist admin accounts to localStorage
 */
export const saveAdminAccounts = (accounts: AdminAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save admin accounts:', e);
  }
};

/**
 * Authenticate username and password
 */
export const authenticateAdmin = (
  usernameInput: string,
  passwordInput: string,
  rememberMe: boolean = false
): { success: boolean; user?: AdminAccount; message: string } => {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!username) {
    return { success: false, message: 'Silakan masukkan username atau NIP Anda.' };
  }
  if (!password) {
    return { success: false, message: 'Silakan masukkan kata sandi Anda.' };
  }

  const accounts = getAdminAccounts();
  const matched = accounts.find(
    (acc) =>
      acc.username.toLowerCase() === username ||
      (acc.nip && acc.nip.replace(/\s+/g, '') === username.replace(/\s+/g, '')) ||
      (acc.email && acc.email.toLowerCase() === username)
  );

  if (!matched) {
    return {
      success: false,
      message: 'Username, email, atau NIP tidak ditemukan pada sistem SIADIK.',
    };
  }

  if (matched.passwordHash !== password) {
    return {
      success: false,
      message: 'Kata sandi yang Anda masukkan salah. Periksa kembali huruf besar/kecil.',
    };
  }

  // Update last login
  const nowStr = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedAccounts = accounts.map((acc) =>
    acc.id === matched.id ? { ...acc, lastLogin: nowStr } : acc
  );
  saveAdminAccounts(updatedAccounts);

  const loggedInUser: AdminAccount = {
    ...matched,
    lastLogin: nowStr,
  };

  const session: AdminAuthSession = {
    isAuthenticated: true,
    user: loggedInUser,
    loginTimestamp: Date.now(),
    rememberMe,
  };

  saveAuthSession(session);

  return {
    success: true,
    user: loggedInUser,
    message: `Selamat datang kembali, ${matched.fullName}!`,
  };
};

/**
 * Get current active auth session
 */
export const getCurrentAuthSession = (): AdminAuthSession => {
  try {
    // 1. Check localStorage first (if remembered)
    const savedLocal = localStorage.getItem(STORAGE_KEY_SESSION_LOCAL);
    if (savedLocal) {
      const parsed: AdminAuthSession = JSON.parse(savedLocal);
      if (parsed && parsed.isAuthenticated && parsed.user) {
        return parsed;
      }
    }

    // 2. Check sessionStorage
    const savedSession = sessionStorage.getItem(STORAGE_KEY_SESSION_SESSION);
    if (savedSession) {
      const parsed: AdminAuthSession = JSON.parse(savedSession);
      if (parsed && parsed.isAuthenticated && parsed.user) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to get auth session:', e);
  }

  return {
    isAuthenticated: false,
    user: null,
    loginTimestamp: 0,
    rememberMe: false,
  };
};

/**
 * Save current auth session
 */
export const saveAuthSession = (session: AdminAuthSession): void => {
  try {
    if (session.rememberMe) {
      localStorage.setItem(STORAGE_KEY_SESSION_LOCAL, JSON.stringify(session));
      sessionStorage.removeItem(STORAGE_KEY_SESSION_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESSION_SESSION, JSON.stringify(session));
      localStorage.removeItem(STORAGE_KEY_SESSION_LOCAL);
    }
  } catch (e) {
    console.error('Failed to save auth session:', e);
  }
};

/**
 * Clear auth session (Logout)
 */
export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION_LOCAL);
    sessionStorage.removeItem(STORAGE_KEY_SESSION_SESSION);
  } catch (e) {
    console.error('Failed to clear auth session:', e);
  }
};

/**
 * Update an existing admin account (NIP, fullName, role, username, email, etc.)
 */
export const updateAdminAccount = (
  id: string,
  updatedData: Partial<AdminAccount>
): { success: boolean; account?: AdminAccount; message: string } => {
  const accounts = getAdminAccounts();
  const index = accounts.findIndex((acc) => acc.id === id);

  if (index === -1) {
    return { success: false, message: 'Akun tidak ditemukan pada database lokal.' };
  }

  // Validate full name
  if (updatedData.fullName !== undefined && !updatedData.fullName.trim()) {
    return { success: false, message: 'Nama lengkap akun tidak boleh kosong.' };
  }

  // Validate username uniqueness if changed
  if (updatedData.username !== undefined) {
    const newUsername = updatedData.username.trim().toLowerCase();
    if (!newUsername) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }
    const duplicate = accounts.find(
      (acc) => acc.id !== id && acc.username.toLowerCase() === newUsername
    );
    if (duplicate) {
      return {
        success: false,
        message: `Username "${newUsername}" sudah digunakan oleh akun lain.`,
      };
    }
  }

  const updatedAccount: AdminAccount = {
    ...accounts[index],
    ...updatedData,
    fullName: updatedData.fullName ? updatedData.fullName.trim() : accounts[index].fullName,
    nip: updatedData.nip !== undefined ? updatedData.nip.trim() : accounts[index].nip,
    username: updatedData.username ? updatedData.username.trim().toLowerCase() : accounts[index].username,
    email: updatedData.email !== undefined ? updatedData.email.trim() : accounts[index].email,
  };

  accounts[index] = updatedAccount;
  saveAdminAccounts(accounts);

  // If the active session belongs to this user, update active session
  const currentSession = getCurrentAuthSession();
  if (currentSession.isAuthenticated && currentSession.user && currentSession.user.id === id) {
    saveAuthSession({
      ...currentSession,
      user: updatedAccount,
    });
  }

  return {
    success: true,
    account: updatedAccount,
    message: `Profil akun ${updatedAccount.fullName} berhasil diperbarui.`,
  };
};

/**
 * Add a new admin account
 */
export const addAdminAccount = (
  accountData: Omit<AdminAccount, 'id'>
): { success: boolean; account?: AdminAccount; message: string } => {
  const accounts = getAdminAccounts();
  const username = accountData.username.trim().toLowerCase();

  if (!accountData.fullName.trim()) {
    return { success: false, message: 'Nama lengkap akun wajib diisi.' };
  }
  if (!username) {
    return { success: false, message: 'Username wajib diisi.' };
  }
  if (!accountData.passwordHash) {
    return { success: false, message: 'Kata sandi wajib diisi.' };
  }

  const duplicate = accounts.find((acc) => acc.username.toLowerCase() === username);
  if (duplicate) {
    return { success: false, message: `Username "${username}" sudah digunakan.` };
  }

  const newAccount: AdminAccount = {
    ...accountData,
    id: `ADM-${Date.now().toString().slice(-4)}`,
    username,
    fullName: accountData.fullName.trim(),
    nip: accountData.nip?.trim() || '',
    email: accountData.email?.trim() || '',
  };

  accounts.push(newAccount);
  saveAdminAccounts(accounts);

  return {
    success: true,
    account: newAccount,
    message: `Akun ${newAccount.fullName} berhasil ditambahkan.`,
  };
};

/**
 * Delete an admin account
 */
export const deleteAdminAccount = (
  id: string
): { success: boolean; message: string } => {
  const accounts = getAdminAccounts();
  if (accounts.length <= 1) {
    return {
      success: false,
      message: 'Tidak dapat menghapus. Sistem harus memiliki minimal 1 akun Administrator.',
    };
  }

  const index = accounts.findIndex((acc) => acc.id === id);
  if (index === -1) {
    return { success: false, message: 'Akun tidak ditemukan.' };
  }

  const deleted = accounts[index];
  const updatedAccounts = accounts.filter((acc) => acc.id !== id);
  saveAdminAccounts(updatedAccounts);

  return {
    success: true,
    message: `Akun ${deleted.fullName} berhasil dihapus.`,
  };
};

/**
 * Reset admin accounts to initial default
 */
export const resetAdminAccountsToDefault = (): AdminAccount[] => {
  saveAdminAccounts(DEFAULT_ADMIN_ACCOUNTS);
  return DEFAULT_ADMIN_ACCOUNTS;
};

/**
 * Update admin account password
 */
export const updateAdminPassword = (
  username: string,
  oldPassword: string,
  newPassword: string
): { success: boolean; message: string } => {
  if (!newPassword || newPassword.length < 5) {
    return {
      success: false,
      message: 'Kata sandi baru minimal harus terdiri dari 5 karakter.',
    };
  }

  const accounts = getAdminAccounts();
  const index = accounts.findIndex(
    (acc) => acc.username.toLowerCase() === username.toLowerCase()
  );

  if (index === -1) {
    return { success: false, message: 'Akun admin tidak ditemukan.' };
  }

  if (accounts[index].passwordHash !== oldPassword) {
    return { success: false, message: 'Kata sandi lama yang Anda masukkan tidak cocok.' };
  }

  accounts[index].passwordHash = newPassword;
  saveAdminAccounts(accounts);

  return {
    success: true,
    message: 'Kata sandi admin berhasil diperbarui.',
  };
};
