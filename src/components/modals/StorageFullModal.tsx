"use client";

import React from "react";
import { X, HardDrive } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setModalOpen } from "@/store/slices/uiSlice";
import { useRouter } from "next/navigation";

export default function StorageFullModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isOpen = useAppSelector((state) => state.ui.modals?.storageFull);

  if (!isOpen) return null;

  const onClose = () => {
    dispatch(setModalOpen({ modal: "storageFull", isOpen: false }));
  };

  const handleUpgrade = () => {
    onClose();
    router.push("/account/billing");
  };

  const handleCleanup = () => {
    onClose();
    // Ideally routing to a file manager or history page to delete items
    // For now, staying on current page is fine as user likely sees content to delete
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#141414] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
            <HardDrive className="h-8 w-8 text-red-500" />
          </div>
          
          <h2 className="mb-2 text-xl font-bold text-white">Storage Full</h2>
          
          <p className="mb-6 text-sm text-gray-400">
            You've reached your storage limit. To continue generating, please upgrade your plan for more space or delete old files.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-violet-500 active:scale-[0.98]"
            >
              Upgrade Storage
            </button>
            
            <button
              onClick={handleCleanup}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              I'll Delete Some Files
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
