import { isSupported, getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Helper to register the current browser for FCM push notifications.
// Call this once after the user logs in (and only in the browser).
export async function registerBrowserPushToken(): Promise<void> {
  if (typeof window === 'undefined') return;

  // CRITICAL FIX: Check if Notification API exists before accessing it
  // Fixes "Can't find variable: Notification" crash on iPhone Safari
  if (typeof Notification === 'undefined') {
    console.warn('[FCM] Notification API not available in this environment');
    return;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn('[FCM] Messaging not supported in this browser');
    return;
  }

  // Use the same localStorage user object that ChromeMount uses
  let uid: string | null = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      uid = u?.uid || null;
    }
  } catch (err) {
    console.error('[FCM] Error parsing user from localStorage', err);
  }

  if (!uid) {
    console.warn('[FCM] No uid found in localStorage; skipping token registration');
    return;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[FCM] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY; cannot get FCM token');
    return;
  }

  const messaging = getMessaging();


  console.log('[FCM] Permission granted, requesting FCM token with VAPID key');
  const token = await getToken(messaging, { vapidKey }).catch((err) => {
    console.error('[FCM] Failed to get token', err);
    return null;
  });

  if (!token) return;

  console.log('[FCM] Got FCM token', token);

  // Store under userDevices/{uid}/tokens/{token}
  const ref = doc(db, 'userDevices', uid, 'tokens', token);
  await setDoc(
    ref,
    {
      token,
      platform: 'web',
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
    },
    { merge: true }
  );

  console.log('[FCM] Registered browser push token for uid', uid);
}

// Optional: attach an in-page listener for foreground messages
export function attachForegroundMessageListener(handler: (payload: any) => void) {
  if (typeof window === 'undefined') return;
  isSupported()
    .then((supported) => {
      if (!supported) return;
      const messaging = getMessaging();
      onMessage(messaging, (payload) => {
        handler(payload);
      });
    })
    .catch(() => { });
}


