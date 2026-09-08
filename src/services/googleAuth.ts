import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Support Vercel environment variables or fallback to firebase-applet-config.json
const resolvedConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId || '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId || '',
};

// Initialize Firebase App if not already initialized
const app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
// Add required Google Workspace scopes
SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if sign-in is in progress
let isSigningIn = false;
// Cache access token in memory ONLY (never localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might need re-prompt or popup if not cached yet
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Helper to detect if user dismissed or cancelled the popup dialog
export const isAuthCancellation = (error: unknown): boolean => {
  if (!error) return false;
  if (typeof error === 'string') {
    return (
      error.includes('auth/popup-closed-by-user') ||
      error.includes('auth/cancelled-popup-request') ||
      error.includes('auth/user-cancelled')
    );
  }
  if (typeof error === 'object') {
    const err = error as { code?: string; message?: string };
    const code = err.code || '';
    const message = err.message || '';
    return (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled' ||
      message.includes('popup-closed-by-user') ||
      message.includes('cancelled-popup-request') ||
      message.includes('user-cancelled')
    );
  }
  return false;
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    return null;
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    // If the user cancelled or closed the popup window, handle gracefully without logging an error
    if (isAuthCancellation(error)) {
      return null;
    }

    // Check if popup was blocked by browser policies
    const errObj = error as { code?: string; message?: string };
    if (errObj?.code === 'auth/popup-blocked' || errObj?.message?.includes('popup-blocked')) {
      throw new Error('Jendela popup diblokir oleh peramban. Harap izinkan popup atau buka aplikasi di tab baru.');
    }

    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
