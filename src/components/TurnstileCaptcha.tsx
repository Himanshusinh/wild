'use client';

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef } from 'react';

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

/**
 * Cloudflare Turnstile Captcha Component
 * Privacy-friendly alternative to reCAPTCHA
 * 
 * Usage:
 * 1. Get keys from Cloudflare Dashboard > Turnstile
 * 2. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to .env.local
 * 3. Use in forms before submit
 */
export default function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  size = 'normal',
}: TurnstileCaptchaProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);
  
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.warn('⚠️ NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set. Captcha will not work.');
    return (
      <div className="my-4 p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/10">
        <p className="text-xs text-yellow-500">
          Captcha configuration missing. Please add NEXT_PUBLIC_TURNSTILE_SITE_KEY to environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="my-4 flex justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={(token) => {
          console.log('✅ Turnstile verification successful');
          onVerify(token);
        }}
        onError={() => {
          console.error('❌ Turnstile verification failed');
          onError?.();
        }}
        onExpire={() => {
          console.warn('⏰ Turnstile token expired');
          onExpire?.();
        }}
        options={{
          theme,
          size,
          action: 'submit',
          cData: 'wildmind_form_verification',
        }}
      />
    </div>
  );
}
