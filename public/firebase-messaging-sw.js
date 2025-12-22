/* global importScripts, firebase */

// Firebase Cloud Messaging service worker for Web Push.
// IMPORTANT:
// - Replace the firebaseConfig values below with your actual Firebase project config.
// - These should match the values used in wild/src/lib/firebase.ts

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyCRWmkXyPmux_leqANXftfEuVUfpCKRC5c',
  authDomain: 'api-gateway-wildmind.firebaseapp.com',
  projectId: 'api-gateway-wildmind',
  storageBucket: 'api-gateway-wildmind.firebasestorage.app',
  messagingSenderId: '150722845597',
  appId: '1:150722845597:web:5edaa6b024add658adad74'
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
  // ignore "already exists" errors
}

const messaging = firebase.messaging();

// Handle background messages (when tab is closed / browser in background)
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'WildMind';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


