import React from 'react';
import Link from "next/link";
import Image from "next/image";
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import TurnstileCaptcha from '@/components/TurnstileCaptcha';
import { getImageUrl } from "@/routes/imageroute";
import { LEGAL_ROUTES } from '../../../../routes/routes';
import { textFieldSx, EyeIcon, EyeOffIcon, ValidationPopup, OtpInput } from './shared';

interface SignUpFormProps {

    username: string;
    setUsername: (val: string) => void;
    isUsernameFocused: boolean;
    setIsUsernameFocused: (val: boolean) => void;
    usernameRequirements: any[];
    hasCapitalLetters: boolean;
    availability: any;
    email: string;
    setEmail: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean) => void;
    isPasswordFocused: boolean;
    setIsPasswordFocused: (val: boolean) => void;
    passwordRequirements: any[];
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (val: boolean) => void;
    otpSent: boolean;
    otp: string;
    setOtp: (val: string) => void;
    processing: boolean;
    resendCooldown: number;
    handleSendOtp: (e: React.FormEvent) => void;
    handleVerifyOtp: (e: React.FormEvent) => void;
    handleGoogleLogin: () => void;
    handleCaptchaVerify: (token: string) => void;
    handleCaptchaError: () => void;
    UsernameFeedbackComponent: React.ComponentType<any>;
}

export const SignUpForm = ({
    username, setUsername, isUsernameFocused, setIsUsernameFocused, usernameRequirements, hasCapitalLetters, availability,
    email, setEmail,
    password, setPassword, showPassword, setShowPassword, isPasswordFocused, setIsPasswordFocused, passwordRequirements,
    confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword,
    otpSent, otp, setOtp, processing, resendCooldown,
    handleSendOtp, handleVerifyOtp, handleGoogleLogin, handleCaptchaVerify, handleCaptchaError,
    UsernameFeedbackComponent
}: SignUpFormProps) => {
    return (
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="flex flex-col gap-2">
            <div className="relative">
                <TextField
                    label="User Name"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setIsUsernameFocused(false)}
                    required
                    sx={textFieldSx}
                    disabled={otpSent}
                />
                {isUsernameFocused && (
                    <ValidationPopup requirements={usernameRequirements} value={username} />
                )}
            </div>
            {!hasCapitalLetters && username.length > 0 && (
                <UsernameFeedbackComponent status={availability.status} result={availability.result} error={availability.error} onSuggestion={setUsername} />
            )}

            <TextField
                label="Email"
                variant="outlined"
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                sx={textFieldSx}
                disabled={otpSent}
            />

            <div className="relative">
                <TextField
                    label="Password"
                    variant="outlined"
                    fullWidth
                    size="small"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: '#858585' }}>
                                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={textFieldSx}
                    disabled={otpSent}
                />
                {isPasswordFocused && (
                    <ValidationPopup requirements={passwordRequirements} value={password} />
                )}
            </div>

            <TextField
                label="Confirm Password"
                variant="outlined"
                fullWidth
                size="small"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} sx={{ color: '#858585' }}>
                                {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={textFieldSx}
                disabled={otpSent}
            />

            <div className="text-[11px] text-center text-gray-500 leading-relaxed py-2">
                By signing up, you agree to our <Link href={LEGAL_ROUTES.TERMS_CONDITIONS} className="text-[#4182CF] underline" target="_blank">Terms and Conditions</Link> & <Link href={LEGAL_ROUTES.PRIVACY_PAGE} className="text-[#4182CF] underline" target="_blank">Privacy Policy</Link>.
            </div>



            {otpSent && (
                <div className="space-y-4 px-4 py-2">
                    <div className="text-center space-y-0 mb-2">
                        <p className="text-green-400 text-xs font-medium">OTP has been sent to your email</p>
                        <p className="text-gray-400 text-[10px]">Please enter the 6-digit code below</p>
                    </div>
                    <OtpInput value={otp} onChange={setOtp} disabled={processing} />
                    <div className="flex flex-col items-end w-full gap-1 mt-1">
                        {resendCooldown > 0 ? (
                            <span className="text-gray-400 text-[10px] font-medium">
                                Resend in 0:{resendCooldown.toString().padStart(2, '0')}
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleSendOtp(e as any); }}
                                className="text-[#4182CF] text-[10px] font-semibold hover:text-[#4B8EDF] transition-colors -mt-2"
                            >
                                Resend Code
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="flex items-center gap-4 py-0 mt-0">
                <div className="flex-grow h-px bg-[#2D3035]"></div>
                <span className="text-gray-500 text-xs font-medium">OR</span>
                <div className="flex-grow h-px bg-[#2D3035]"></div>
            </div>

            <button
                type="button"
                onClick={() => handleGoogleLogin()}
                className="w-full bg-[#24242A] hover:bg-[#2D3035] text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors mt-2"
            >
                <Image src={getImageUrl('core', 'google')} alt="Google" width={18} height={18} className="w-4 h-4" />
                <span className="text-sm font-semibold">Continue with Google</span>
            </button>

            <div className="flex justify-center pt-2">
                <button
                    type="submit"
                    disabled={processing || (!otpSent && (!username || !email || !password || !confirmPassword)) || (otpSent && otp.length < 6)}
                    className={`w-3/4 py-2.5 rounded-xl font-semibold text-sm transition-all ${processing || (!otpSent && (!username || !email || !password || !confirmPassword)) || (otpSent && otp.length < 6)
                        ? "bg-[#4182CF]/47 text-white/50 cursor-not-allowed"
                        : "bg-[#4182CF] hover:bg-[#4B8EDF] text-white"
                        }`}
                >
                    {processing ? (otpSent ? "Verifying..." : "Creating...") : (otpSent ? "Sign Up" : "Get OTP")}
                </button>
            </div>
            <div className="flex justify-center -my-2 transform scale-90 origin-center mt-2">
                <TurnstileCaptcha onVerify={handleCaptchaVerify} onError={handleCaptchaError} theme="dark" />
            </div>


        </form>
    );
};
