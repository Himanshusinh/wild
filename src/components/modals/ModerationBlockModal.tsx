"use client";

import React from "react";
import { AlertTriangle, Ban, XCircle, ShieldAlert } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setModalOpen } from "@/store/slices/uiSlice";
import { useRouter } from "next/navigation";
import { clearAuthData } from "@/lib/authUtils";

export default function ModerationBlockModal() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const isOpen = useAppSelector((state) => state.ui.modals?.accountBlocked);
    const info = useAppSelector((state) => state.ui.moderationInfo);

    if (!isOpen || !info) return null;

    const onClose = () => {
        dispatch(setModalOpen({ modal: "accountBlocked", isOpen: false }));
    };

    const handleLogout = async () => {
        await clearAuthData();
        onClose();
        router.push("/auth/login");
    };

    // Determine Icon and Color based on block type
    let Icon = ShieldAlert;
    let colorClass = "text-red-500";
    let bgClass = "bg-red-500/10 border-red-500/20";
    let buttonGradient = "from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500";
    let title = "Access Denied";

    if (info.code === 'ACCOUNT_BANNED') {
        Icon = Ban;
        title = "Account Banned";
    } else if (info.code === 'ACCOUNT_SUSPENDED') {
        Icon = AlertTriangle;
        title = "Account Suspended";
        colorClass = "text-orange-500";
        bgClass = "bg-orange-500/10 border-orange-500/20";
        buttonGradient = "from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500";
    } else if (info.code === 'IP_BLOCKED' || info.code === 'DEVICE_BLOCKED') {
        Icon = XCircle;
        title = info.code === 'IP_BLOCKED' ? "IP Address Blocked" : "Device Blocked";
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#141414] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border ${bgClass}`}>
                        <Icon className={`h-8 w-8 ${colorClass}`} />
                    </div>

                    <h2 className="mb-2 text-xl font-bold text-white">{title}</h2>

                    <p className="mb-4 text-sm text-gray-300">
                        {info.message}
                    </p>

                    {info.reason && (
                        <div className="mb-6 p-3 rounded-lg bg-black/40 border border-white/5 text-left">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Reason</span>
                            <p className="text-sm text-gray-300">{info.reason}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleLogout}
                            className={`w-full rounded-lg bg-gradient-to-r ${buttonGradient} px-4 py-3 text-sm font-medium text-white transition-all active:scale-[0.98]`}
                        >
                            Sign Out
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
