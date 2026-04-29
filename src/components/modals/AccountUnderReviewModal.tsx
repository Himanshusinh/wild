// wild/src/components/modals/AccountUnderReviewModal.tsx
import React from 'react';
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setModalOpen } from '@/store/slices/uiSlice';
import { ShieldAlert } from 'lucide-react';

export default function AccountUnderReviewModal() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state) => state.ui.modals?.accountUnderReview);
    const info = useAppSelector((state) => state.ui.moderationInfo);

    if (!isOpen || !info) return null;

    const onClose = () => {
        dispatch(setModalOpen({ modal: 'accountUnderReview', isOpen: false }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#141414] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-yellow-500/10 border-yellow-500/20">
                        <ShieldAlert className="h-8 w-8 text-yellow-500" />
                    </div>

                    <h2 className="mb-2 text-xl font-bold text-white">Temporary Feature Limit</h2>

                    <p className="mb-4 text-sm text-gray-300">
                        {info.message || "Your account has been flagged by our automated risk systems. Some features like content generation and credit usage are temporarily limited until a human moderator reviews your account."}
                    </p>

                    {info.reason && (
                        <div className="mb-6 p-3 rounded-lg bg-black/40 border border-white/5 text-left">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Reason</span>
                            <p className="text-sm text-gray-300">{info.reason}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onClose}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
