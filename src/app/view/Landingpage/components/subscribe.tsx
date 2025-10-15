'use client'

import React, { useEffect, useMemo, useState } from 'react'
import CardSwap, { Card } from './CardSwap';
import { ChevronRight, Check } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '../routes';

interface NewsletterSignupProps {
  onSubmit?: (email: string) => void
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState<string>('')
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 640)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const isReady = useMemo(() => email.trim().length > 0 && isChecked, [email, isChecked])
  const showPolicyHint = useMemo(() => email.trim().length > 0 && !isChecked, [email, isChecked])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isReady) return

    try {
      setStatus('loading')
      const maybePromise = onSubmit?.(email)
      if (maybePromise && typeof (maybePromise as any).then === 'function') {
        await (maybePromise as Promise<unknown>)
      } else {
        // Fallback artificial delay to show spinner if no async handler provided
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
      setStatus('success')
      // Optional: revert back to idle after a brief success state
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      // In case of error, just return to idle so user can retry
      setStatus('idle')
    }
  }

  return (
    <div className="relative z-0 mb-4 max-w-7xl lg:max-w-7xl md:max-w-6xl mx-auto text-white p-6 sm:p-10 mb:p-4 mb:pb-12 rounded-3xl border border-white/20 backdrop-blur-lg bg-[#07070B] shadow-2xl overflow-hidden">
      <div className="absolute inset-[1px] bg-[#07070B] rounded-2xl pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-12 md:gap-20 mb:gap-6">
        {/* Left: Form */}
        <div className="flex-1 space-y-6 w-full mt-4 md:mt-6 mb:space-y-4">
          <div className="space-y-3">
            <span className="uppercase text-sm text-gray-300 tracking-widest mb:text-xs ml-2">Newsletter Signup</span>
            <h2 className="text-3xl md:text-3xl font-bold drop-shadow-md mb:text-2xl ml-2">
              Subscribe for<br />the updates!
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex items-center w-full md:w-[80%]">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={showPolicyHint}
                className={`w-full bg-white/5 border backdrop-blur-sm text-white rounded-full px-4 py-3 pr-12 placeholder-gray-300 shadow-inner focus:outline-none transition-all duration-300 mb:px-3 mb:py-2 mb:pr-10
                  ${showPolicyHint ? 'border-red-400/60 focus:ring-2 focus:ring-red-400/40 focus:border-red-400/60' : 'border-white/20 focus:ring-2 focus:ring-white/30 focus:border-white/40 focus:bg-white/10'}
                `}
              />
              <button
                type="submit"
                disabled={!isReady || status === 'loading'}
                aria-label="Submit email"
                className={`flex items-center justify-center w-9 h-9 rounded-full absolute right-2 top-1/2 -translate-y-1/2 focus:outline-none transition-colors duration-200 mb:w-8 mb:h-8 mb:right-1
                  ${status === 'loading' ? 'cursor-wait' : 'cursor-pointer'}
                  ${isReady ? 'bg-white text-black shadow-md hover:bg-white/90' : 'bg-white/20 text-white/60'}
                `}
              >
                {status === 'loading' ? (
                  <span className="inline-block w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                ) : status === 'success' ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>

            <label className="flex items-start space-x-3 text-gray-300 text-sm cursor-pointer mb:text-xs">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                required
                className="accent-white w-4 h-4 mt-1 mb:w-3 mb:h-3 ml-4"
              />
              <span>
                I agree to the{' '}
                <a href="#" className="underline hover:text-white transition">
                  Privacy Policy
                </a>.
              </span>
            </label>

            {showPolicyHint && (
              <p className="text-xs text-red-400">
                Please agree to the Privacy Policy to continue.
              </p>
            )}

          </form>
        </div>

        {/* Right: CardStack animation (fixed layout and height) */}
        <div className="flex-1 flex items-center justify-center relative min-h-[480px] mb:min-h-[460px] mobile:min-h-[500px] mb:mt-6 mb:justify-end mb:pr-3">
          <div className="w-full flex justify-center mb:justify-end mb:pr-2 mb:transform mb:translate-x-1">
          <CardSwap
            cardDistance={isMobile ? 30 : 50}
            verticalDistance={isMobile ? 50 : 80}
            delay={3500}
            pauseOnHover={false}
            skewAmount={isMobile ? 4 : 5}
          >
              <Card className="bg-black/20 p-0 rounded-[12px] bg-[#0F0F10] border border-[#1F1F22] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] w-[320px] h-[200px] overflow-hidden flex flex-col mb:w-[220px] mb:h-[130px]">
              <div className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#19191B] to-[#121213] border-b border-[#2C2C2E]">
                Updates
              </div>
              {(() => {
                const imageUrl = getImageUrl('subscribe', 'updates');
                return imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Updates"
                    width={320}
                    height={150}
                    className="flex-1 w-full object-cover bg-transparent"
                  />
                ) : (
                  <div className="flex-1 w-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400">Image not available</span>
                  </div>
                );
              })()}
            </Card>

            <Card className="bg-black/20 p-0 rounded-[12px] bg-[#0F0F10] border border-[#1F1F22] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] w-[320px] h-[200px] overflow-hidden flex flex-col mb:w-[220px] mb:h-[130px]">
              <div className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#19191B] to-[#121213] border-b border-[#2C2C2E]">
                Promotional Deals
              </div>
              {(() => {
                const imageUrl = getImageUrl('subscribe', 'promo');
                return imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Promotions"
                    width={320}
                    height={150}
                    className="flex-1 w-full object-cover bg-transparent"
                  />
                ) : (
                  <div className="flex-1 w-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400">Image not available</span>
                  </div>
                );
              })()}
            </Card>

            <Card className="bg-black/20 p-0 rounded-[12px] bg-[#0F0F10] border border-[#1F1F22] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] w-[320px] h-[200px] overflow-hidden flex flex-col mb:w-[220px] mb:h-[130px]">
              <div className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#19191B] to-[#121213] border-b border-[#2C2C2E]">
                Newsletter
              </div>
              {(() => {
                const imageUrl = getImageUrl('subscribe', 'news');
                return imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Newsletter"
                    width={320}
                    height={150}
                    className="flex-1 w-full object-cover bg-[#fff8eb]"
                  />
                ) : (
                  <div className="flex-1 w-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400">Image not available</span>
                  </div>
                );
              })()}
            </Card>

          </CardSwap>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsletterSignup
