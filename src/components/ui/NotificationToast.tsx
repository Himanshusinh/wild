'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeNotification } from '@/store/slices/uiSlice';

const NotificationToast = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state: any) => state.ui?.notifications || []);

  useEffect(() => {
    // Auto-remove notifications after 5 seconds
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg backdrop-blur-md border
            ${notification.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-100' : ''}
            ${notification.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-100' : ''}
            ${notification.type === 'info' ? 'bg-blue-500/20 border-blue-500/30 text-blue-100' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100' : ''}
            animate-in slide-in-from-right duration-300
          `}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => dispatch(removeNotification(notification.id))}
              className="ml-3 text-white/60 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
