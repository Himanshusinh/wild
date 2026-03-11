import React from 'react';
import { LoadingSpinner } from './shared';

interface RedeemCodeFormProps {
    redeemCode: string;
    setRedeemCode: (val: string) => void;
    redeemCodeValidated: boolean;
    setRedeemCodeValidated: (val: boolean) => void;
    error: string | null;
    success: string | null;
    processing: boolean;
    handleRedeemCodeValidation: () => void;
    handleRedeemCodeSubmit: () => void;
    handleSkipRedeemCode: () => void;
}

export const RedeemCodeForm = ({
    redeemCode,
    setRedeemCode,
    redeemCodeValidated,
    setRedeemCodeValidated,
    error,
    success,
    processing,
    handleRedeemCodeValidation,
    handleRedeemCodeSubmit,
    handleSkipRedeemCode
}: RedeemCodeFormProps) => {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-6 -mt-8">
                <h1 className="text-xl font-bold text-white">Almost There!</h1>
                <p className="text-gray-400 text-xs">Apply a redeem code for credits, or continue with free plan.</p>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Redeem Code (Optional)"
                        value={redeemCode}
                        onChange={(e) => {
                            setRedeemCode(e.target.value.toUpperCase());
                            if (redeemCodeValidated) setRedeemCodeValidated(false);
                        }}
                        className="w-full px-4 py-3 bg-[#24242A] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#4182CF] uppercase border border-transparent hover:border-transparent transition-colors"
                    />
                </div>

                {error && <p className="text-red-400 text-[10px] text-center">{error}</p>}
                {success && <p className="text-green-400 text-[10px] text-center">{success}</p>}

                <button
                    onClick={redeemCodeValidated ? handleRedeemCodeSubmit : handleRedeemCodeValidation}
                    disabled={processing || !redeemCode.trim()}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${processing || !redeemCode.trim()
                        ? "bg-[#4182CF]/47 text-white/50 cursor-not-allowed"
                        : "bg-[#4182CF] hover:bg-[#4B8EDF] text-white"
                        }`}
                >
                    {processing ? <LoadingSpinner /> : (redeemCodeValidated ? "Apply Code" : "Validate Code")}
                </button>

                <div className="flex items-center gap-4 py-2">
                    <div className="flex-grow h-px bg-[#2D3035]"></div>
                    <span className="text-gray-500 text-xs font-medium">OR</span>
                    <div className="flex-grow h-px bg-[#2D3035]"></div>
                </div>

                <button
                    onClick={handleSkipRedeemCode}
                    disabled={processing}
                    className="w-full py-2.5 bg-[#4182CF] hover:bg-[#4B8EDF] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                    Continue with Free Plan
                </button>
            </div>
        </div>
    );
};
