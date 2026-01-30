import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

function normalizeStorageBucket(raw: string | undefined, projectId: string | undefined): string | undefined {
  const pid = (projectId || '').trim();
  let b = (raw || '').trim();
  if (!b) {
    return pid ? `${pid}.appspot.com` : undefined;
  }

  // Accept gs://bucket
  b = b.replace(/^gs:\/\//i, '');

  // Accept full API URL and extract bucket
  const m = b.match(/\/v0\/b\/([^/]+)\/o/i);
  if (m && m[1]) b = m[1];

  // Common misconfiguration: using hosting-like domain instead of bucket name.
  // Firebase Storage bucket is typically <projectId>.appspot.com.
  if (/\.firebasestorage\.app$/i.test(b)) {
    const fixed = b.replace(/\.firebasestorage\.app$/i, '.appspot.com');
    return fixed;
  }

  return b;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: normalizeStorageBucket(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// CRITICAL FIX: Explicitly set auth persistence to LOCAL (survives page refreshes)
// This ensures Firebase auth state persists even after browser refresh
// Without this, auth.currentUser can become null after page refresh, breaking session refresh
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('[Firebase] Failed to set auth persistence:', error);
    // Non-fatal - Firebase defaults to local persistence anyway
  });
}

export default app;
