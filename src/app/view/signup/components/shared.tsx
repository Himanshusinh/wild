import React from 'react';

// Shared styling for MUI TextFields across forms
export const textFieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#24242A',
        borderRadius: '12px',
        color: '#FFF',
        fontSize: '14px',
        '& fieldset': {
            borderColor: 'transparent',
            transition: 'border-color 0.2s ease-in-out'
        },
        '&:hover fieldset': { borderColor: 'transparent' },
        '&.Mui-focused fieldset': { borderColor: '#4182CF' },
        '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #24242A inset !important',
            WebkitTextFillColor: '#FFF !important',
            caretColor: '#FFF !important',
            transition: 'background-color 5000s ease-in-out 0s',
        },
        '&.Mui-disabled': {
            backgroundColor: '#24242A',
            opacity: 1, // Keep full opacity
            '& input': {
                WebkitTextFillColor: '#FFF !important',
                color: '#FFF',
            },
            '& fieldset': {
                borderColor: 'transparent',
            }
        },
    },
    '& .MuiInputLabel-root': {
        color: '#858585',
        fontSize: '14px',
        transform: 'translate(14px, 9px) scale(1)',
        '&.Mui-focused, &.MuiFormLabel-filled': {
            zIndex: 1,
            transform: 'translate(14px, -9px) scale(0.75)',
        },
        '& .MuiFormLabel-asterisk': { display: 'none' },
        '&.Mui-disabled': {
            color: '#656565',
        }
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#4182CF' },
};

// SVG Icons
export const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 01-1.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

export const LoadingSpinner = () => (
    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
);

// Helper for cookies
export const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    document.cookie = cookieString
}

export const clearCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`
}

// Global Validation Popup component (for password/username requirements hover)
export const ValidationPopup = ({ requirements, value }: { requirements: any[], value: string }) => {
    return (
        <div className="absolute z-50 animate-in fade-in
            /* Mobile: Shown below the input */
            top-[calc(100%+12px)] left-0 w-full slide-in-from-top-1
            /* Desktop: Shown to the right of the input */
            md:top-1/2 md:left-[calc(100%+16px)] md:-translate-y-1/2 md:w-54 md:max-w-64 lg:max-w-64 md:slide-in-from-left-2
            bg-[#24242A] rounded-xl border border-[#2D3035] p-2 shadow-xl">

            {/* Pointer arrow */}
            <div className="absolute bg-[#24242A] border-[#2D3035] w-3 h-3
                /* Mobile: Arrow pointing up */
                top-0 left-6 -translate-y-1/2 rotate-45 border-l border-t
                /* Desktop: Arrow pointing left */
                md:top-1/2 md:-left-1.5 md:-translate-y-1/2 md:-rotate-45"
            />

            <div className="space-y-1 relative z-10">
                {requirements.map((req, index) => {
                    const isValid = req.test ? req.test(value) : false;
                    return (
                        <div key={index} className="flex items-start gap-1">
                            <span className={`text-[10px] leading-snug ${isValid ? 'text-green-500' : 'text-gray-400'}`}>
                                • {req.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Extracted OtpInput component
export const OtpInput = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newValue = e.target.value.replace(/[^0-9]/g, '');
        if (newValue.length <= 1) {
            const newOtp = value.split('');
            newOtp[index] = newValue;
            onChange(newOtp.join(''));

            if (newValue && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
            if (prevInput) {
                prevInput.focus();
                // Clear the previous input when navigating back
                const newOtp = value.split('');
                newOtp[index - 1] = '';
                onChange(newOtp.join(''));
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        onChange(pastedData.padEnd(6, '').slice(0, 6)); // Ensure it's exactly 6 chars or padded
    };

    return (
        <div className="flex justify-between items-center w-full gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={disabled}
                    className={`
                        w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-center text-lg md:text-xl font-bold rounded-xl 
                        bg-[#1C1C20] border-1 border-[#979797] text-white 
                        focus:border-[#4182CF] focus:outline-none transition-colors
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        disabled:bg-[#1C1C20] disabled:text-[#656565] disabled:-webkit-text-fill-color-[#656565] disabled:opacity-100
                    `}
                    style={{
                        WebkitTextFillColor: disabled ? '#656565' : 'white',
                        opacity: 1
                    }}
                />
            ))}
        </div>
    );
};
