'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  COMPANY_ROUTES,
  FEATURE_ROUTES,
  LEGAL_ROUTES,
  MUSICGENERATION,
  PRODUCT_ROUTES,
  SOCIAL_LINKS,
} from '@/routes/routes'

const LogoSvg = () => (
  <Image
    src="/core/logosquare.png"
    alt="WildMind Logo"
    width={54}
    height={54}
    className="h-10 w-10 md:h-12 md:w-12 object-contain"
    unoptimized
  />
)

const FooterNew: React.FC = () => {
  const router = useRouter()

  const handleBlogClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    router.push(COMPANY_ROUTES.BLOG)
  }

  const legalLinks = [
    { name: 'Terms of use', href: LEGAL_ROUTES.TERMS },
    { name: 'Privacy Policy', href: LEGAL_ROUTES.PRIVACY },
    { name: 'Cookies', href: LEGAL_ROUTES.COOKIES },
    { name: 'Legal Notice', href: LEGAL_ROUTES.LEGAL_NOTICE },
    { name: 'DMCA', href: LEGAL_ROUTES.DMCA },
  ]

  const columnHeadingClass =
    'mb-[18px] text-[13px] font-bold uppercase tracking-[0.14em] text-[#F0EFE9]'
  const footerLinkClass =
    'text-[14px] leading-[1.35] text-[rgba(255,255,255,0.78)] transition-colors duration-200 hover:text-white'

  return (
    <footer className="relative z-[10] w-full">
      <div className="mx-3 border-t border-white/10 md:mx-[18px] lg:mx-8">
        <div className="grid grid-cols-1 gap-10 px-6 py-12 sm:px-8 md:grid-cols-2 md:px-10 lg:grid-cols-[200px_repeat(4,minmax(0,1fr))] lg:gap-10 lg:px-10">
          <div className="relative z-[1]">
            <div className="mb-[0px]">
              <LogoSvg />
            </div>
            <div className="mb-0 text-[13px] font-bold tracking-[-0.01em] text-[#F0EFE9]">
              <span className="font-light">WILD</span>MIND AI
            </div>
            {/* <div className="mb-2 text-[11px] leading-[1.6] text-[rgba(255,255,255,0.6)]">
              Imagination to Creation
            </div> */}
            {/* <div className="flex gap-2">
              <Link
                href={SOCIAL_LINKS.X}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/10 text-[11px] text-[rgba(255,255,255,0.75)] transition-all duration-200 hover:border-white/25 hover:text-white"
              >
                𝕏
              </Link>
              <Link
                href={SOCIAL_LINKS.LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/10 text-[10px] text-[rgba(255,255,255,0.75)] transition-all duration-200 hover:border-white/25 hover:text-white"
              >
                in
              </Link>
              <Link
                href={SOCIAL_LINKS.YOUTUBE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/10 text-[11px] text-[rgba(255,255,255,0.75)] transition-all duration-200 hover:border-white/25 hover:text-white"
              >
                ▶
              </Link>
            </div> */}
          </div>

          <div className="relative z-[1]">
            <div className={columnHeadingClass}>Solutions</div>
            <div className="flex flex-col gap-3">
              <Link href={FEATURE_ROUTES.IMAGE_GENERATION} className={footerLinkClass}>
                Image Generation
              </Link>
              <Link href={FEATURE_ROUTES.VIDEO_GENERATION} className={footerLinkClass}>
                Video Generation
              </Link>
              <Link href={MUSICGENERATION.TEXT_TO_MUSIC} className={footerLinkClass}>
                Audio Generation
              </Link>
              <Link href="/edit-image?feature=upscale" className={footerLinkClass}>
                Upscale
              </Link>
              <Link href="/edit-image?feature=vectorize" className={footerLinkClass}>
                Vectorize
              </Link>
              <Link href="/edit-image?feature=reimagine" className={footerLinkClass}>
                Enhance
              </Link>
            </div>
          </div>

          <div className="relative z-[1]">
            <div className={columnHeadingClass}>Product</div>
            <div className="flex flex-col gap-3">
              <Link href={PRODUCT_ROUTES.PRICING} className={footerLinkClass}>
                Pricing
              </Link>
              <Link href={PRODUCT_ROUTES.FAQS} className={footerLinkClass}>
                FAQs
              </Link>
              <Link href={LEGAL_ROUTES.CANCELLATION_REFUNDS} className={footerLinkClass}>
                Cancellation & Refunds
              </Link>
              <Link href={LEGAL_ROUTES.SHIPPING} className={footerLinkClass}>
                Shipping
              </Link>
            </div>
          </div>

          <div className="relative z-[1]">
            <div className={columnHeadingClass}>Company</div>
            <div className="flex flex-col gap-3">
              <Link href={COMPANY_ROUTES.BLOG} onClick={handleBlogClick} className={footerLinkClass}>
                Blog
              </Link>
              <Link href={COMPANY_ROUTES.SUPPORT} className={footerLinkClass}>
                Support
              </Link>
              <Link href={COMPANY_ROUTES.CONTACT} className={footerLinkClass}>
                Contact Us
              </Link>
              <Link href={LEGAL_ROUTES.TERMS_CONDITIONS} className={footerLinkClass}>
                Terms and Conditions
              </Link>
              <Link href={LEGAL_ROUTES.PRIVACY_PAGE} className={footerLinkClass}>
                Privacy
              </Link>
            </div>
          </div>

          <div className="relative z-[1]">
            <div className={columnHeadingClass}>Stay Connected</div>
            <div className="flex flex-col gap-3">
              <Link href={SOCIAL_LINKS.FACEBOOK} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                Facebook
              </Link>
              <Link href={SOCIAL_LINKS.X} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                X
              </Link>
              <Link href={SOCIAL_LINKS.INSTAGRAM} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                Instagram
              </Link>
              <Link href={SOCIAL_LINKS.YOUTUBE} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                Youtube
              </Link>
              <Link href={SOCIAL_LINKS.LINKEDIN} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                LinkedIn
              </Link>
              <Link href={SOCIAL_LINKS.THREADS} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                Threads
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-5 border-t border-white/10 px-6 py-7 sm:px-8 md:flex-row md:items-center md:px-10">
          <div className="text-xs text-[rgba(255,255,255,0.6)]">
            Copyright © 2026 WildMind AI Pvt Ltd. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs text-[rgba(255,255,255,0.78)] transition-colors duration-200 hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterNew
