'use client';

import React, { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeDownload } from '@/store/slices/downloadSlice';
import { toast } from 'sonner';

export default function DownloadStatusIndicator() {
  const dispatch = useAppDispatch();
  const downloads = useAppSelector((state: any) => state.download?.downloads || []);
  const toastIdsRef = useRef<Map<string, string>>(new Map());
  const previousStatusRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    downloads.forEach((download: any) => {
      const previousStatus = previousStatusRef.current.get(download.id);
      const currentStatus = download.status;
      const toastId = toastIdsRef.current.get(download.id);
      
      // Only show toast when status changes
      if (previousStatus !== currentStatus) {
        previousStatusRef.current.set(download.id, currentStatus);
        
        // Always dismiss existing toast when status changes
        if (toastId) {
          toast.dismiss(toastId);
          toastIdsRef.current.delete(download.id);
        }
        
        if (currentStatus === 'pending') {
          const newToastId = toast.loading(`Preparing download: ${download.filename}`, {
            id: `download-${download.id}`,
            duration: Infinity,
          });
          toastIdsRef.current.set(download.id, String(newToastId));
        } else if (currentStatus === 'downloading') {
          const newToastId = toast.loading(`Downloading: ${download.filename} (${Math.round(download.progress)}%)`, {
            id: `download-${download.id}`,
            duration: Infinity,
          });
          toastIdsRef.current.set(download.id, String(newToastId));
        } else if (currentStatus === 'completed') {
          // Dismiss loading toast by both ID and reference, then show success
          const downloadToastId = `download-${download.id}`;
          toast.dismiss(downloadToastId);
          if (toastId) {
            toast.dismiss(toastId);
          }
          toastIdsRef.current.delete(download.id);
          
          // Small delay to ensure loading toast is dismissed before showing success
          setTimeout(() => {
            toast.success(`Downloaded: ${download.filename}`, {
              id: `download-success-${download.id}`,
              duration: 3000,
            });
          }, 100);
          
          // Auto-remove from Redux after showing success
          setTimeout(() => {
            dispatch(removeDownload(download.id));
          }, 3000);
        } else if (currentStatus === 'failed') {
          // Dismiss loading toast by both ID and reference, then show error
          const downloadToastId = `download-${download.id}`;
          toast.dismiss(downloadToastId);
          if (toastId) {
            toast.dismiss(toastId);
          }
          toastIdsRef.current.delete(download.id);
          
          // Small delay to ensure loading toast is dismissed before showing error
          setTimeout(() => {
            toast.error(`Download failed: ${download.filename}${download.error ? ` - ${download.error}` : ''}`, {
              id: `download-error-${download.id}`,
              duration: 5000,
            });
          }, 100);
          
          // Auto-remove from Redux after showing error
          setTimeout(() => {
            dispatch(removeDownload(download.id));
          }, 5000);
        }
      } else if (currentStatus === 'downloading') {
        // Update progress for downloading status - always use consistent ID
        const downloadToastId = `download-${download.id}`;
        toast.loading(`Downloading: ${download.filename} (${Math.round(download.progress)}%)`, {
          id: downloadToastId,
          duration: Infinity,
        });
        // Update the ref to track the toast ID
        if (!toastId) {
          toastIdsRef.current.set(download.id, downloadToastId);
        }
      }
    });

    // Clean up toasts for downloads that no longer exist
    const currentDownloadIds = new Set(downloads.map((d: any) => d.id));
    toastIdsRef.current.forEach((toastId, downloadId) => {
      if (!currentDownloadIds.has(downloadId)) {
        toast.dismiss(toastId);
        toastIdsRef.current.delete(downloadId);
        previousStatusRef.current.delete(downloadId);
      }
    });
  }, [downloads, dispatch]);

  // This component doesn't render anything - it just manages toasts
  return null;
}
