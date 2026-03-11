import React from 'react';
import Image from "next/image";
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import TurnstileCaptcha from '@/components/TurnstileCaptcha';
import { getImageUrl } from "@/routes/imageroute";
import { textFieldSx, EyeIcon, EyeOffIcon } from './shared';

interface SignInFormProps {
    email: string;
    setEmail: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean) => void;
    processing: boolean;
    lastAuthMethod: string | null;
    handleLogin: (e: React.FormEvent) => void;
    handleGoogleLogin: () => void;
    setShowForgotPassword: (val: boolean) => void;
    handleCaptchaVerify: (token: string) => void;
    handleCaptchaError: () => void;
}

export const SignInForm = ({
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    processing,
    lastAuthMethod,
    handleLogin,
    handleGoogleLogin,
    setShowForgotPassword,
    handleCaptchaVerify,
    handleCaptchaError
}: SignInFormProps) => {
    return (
        <form onSubmit={handleLogin} className="flex flex-col gap-2">
            <TextField
                label="Email/Username"
                variant="outlined"
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                sx={textFieldSx}
            />

            <TextField
                label="Password"
                variant="outlined"
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            />

            <div className="flex justify-end">
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[#4182CF] text-xs font-normal hover:text-blue-400">
                    Forgot Password?
                </button>
            </div>

            <div className="flex items-center gap-4 py-2">
                <div className="flex-grow h-px bg-[#2D3035]"></div>
                <span className="text-gray-500 text-xs font-medium">OR</span>
                <div className="flex-grow h-px bg-[#2D3035]"></div>
            </div>

            <div className="relative">
                {lastAuthMethod === 'google' && (
                    <div className="absolute -top-2 right-0 z-10">
                        <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-medium px-2 py-0.5 rounded-full">Last Used</span>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    className="w-full bg-[#24242A] hover:bg-[#2D3035] text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                    <Image src={getImageUrl('core', 'google')} alt="Google" width={18} height={18} className="w-4 h-4" />
                    <span className="text-sm font-semibold">Continue with Google</span>
                </button>
            </div>

            <div className="flex justify-center pt-4">
                <button
                    type="submit"
                    disabled={processing || !email || !password}
                    className={`w-3/4 py-2.5 rounded-xl font-semibold transition-all ${processing || !email || !password
                        ? "bg-[#4182CF]/47 text-white/50 cursor-not-allowed"
                        : "bg-[#4182CF] hover:bg-[#4B8EDF] text-white"
                        }`}
                >
                    {processing ? "Signing in..." : "Sign In"}
                </button>
            </div>

            <div className="flex justify-center -my-2 transform scale-90 origin-center mt-2">
                <TurnstileCaptcha
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    theme="dark"
                />
            </div>
        </form>
    );
};
