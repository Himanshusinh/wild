import React from 'react';
import TextField from '@mui/material/TextField';
import { textFieldSx } from './shared';

interface ForgotPasswordModalProps {
    showForgotPassword: boolean;
    setShowForgotPassword: (val: boolean) => void;
    forgotPasswordSent: boolean;
    setForgotPasswordSent: (val: boolean) => void;
    forgotPasswordEmail: string;
    setForgotPasswordEmail: (val: string) => void;
    forgotPasswordError: string | null;
    processing: boolean;
    handleForgotPassword: (e: React.FormEvent) => void;
}

export const ForgotPasswordModal = ({
    showForgotPassword,
    setShowForgotPassword,
    forgotPasswordSent,
    setForgotPasswordSent,
    forgotPasswordEmail,
    setForgotPasswordEmail,
    forgotPasswordError,
    processing,
    handleForgotPassword
}: ForgotPasswordModalProps) => {
    if (!showForgotPassword) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C1C20] rounded-2xl border border-gray-800 w-full max-w-sm p-6 space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-white">Reset Password</h2>
                    <p className="text-gray-400 text-xs">
                        {forgotPasswordSent
                            ? "Check your email for password reset instructions."
                            : "Enter your email address to receive a reset link."}
                    </p>
                </div>

                {forgotPasswordSent ? (
                    <div className="space-y-4">
                        <div className="p-3 bg-green-900/20 border border-green-800 rounded-xl text-green-400 text-xs text-center">
                            Reset link sent to {forgotPasswordEmail}
                        </div>
                        <button
                            onClick={() => {
                                setShowForgotPassword(false);
                                setForgotPasswordSent(false);
                            }}
                            className="w-full py-2.5 bg-gray-800 text-white rounded-xl font-semibold text-sm hover:bg-gray-700"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <TextField
                            label="Email Address"
                            variant="outlined"
                            fullWidth
                            size="small"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            required
                            sx={textFieldSx}
                        />
                        {forgotPasswordError && <p className="text-red-400 text-[10px] text-center">{forgotPasswordError}</p>}
                        <div className="flex gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                                className="flex-1 py-2 bg-gray-800 text-white rounded-xl font-semibold text-sm hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 py-2 bg-[#4182CF] text-white rounded-xl font-semibold text-sm hover:bg-[#4B8EDF]"
                            >
                                {processing ? "Sending..." : "Send Link"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
