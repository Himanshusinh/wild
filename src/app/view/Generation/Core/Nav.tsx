"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOutsideClick } from '../../../hooks/use-outside-click'
import { getApiClient } from '../../../../lib/axiosInstance'
import { clearMeCache } from '../../../../lib/me'
import { useCredits } from '../../../../hooks/useCredits'
import { NAV_ROUTES, AUTH_ROUTES, getSignInUrl } from '../../../../routes/routes'
import toast from 'react-hot-toast'
import { signOut } from 'firebase/auth'
import { auth } from '../../../../lib/firebase'
import { useAppSelector } from '@/store/hooks'

interface UserData {
  uid: string
  email: string
  username: string
  photoURL?: string
  displayName?: string
  provider: string
  credits?: number
  metadata?: { accountStatus: string; roles: string[] }
  loginCount?: number
  deviceInfo?: { os: string; browser: string; device: string }
  plan?: string
}

const Nav = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const userData = useAppSelector((state: any) => state?.auth?.user || null) as UserData | null
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isPublicGenerations')
      return stored ? stored === 'true' : true
    } catch { return true }
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use Redux credits state
  const { creditBalance, refreshCredits, loading: creditsLoading, error: creditsError } = useCredits()
  const router = useRouter()

  // Debug logging removed

  useOutsideClick(dropdownRef, () => setShowDropdown(false))

  useEffect(() => {
    if (!userData) return
    try { console.log('[PublicGen][me] plan:', userData?.plan, 'canTogglePublicGenerations:', (userData as any)?.canTogglePublicGenerations, 'forcePublicGenerations:', (userData as any)?.forcePublicGenerations) } catch { }
    try {
      const stored = localStorage.getItem('isPublicGenerations')
      const server = (userData && (userData as any).isPublic)
      const planRaw = String((userData as any)?.plan || '').toUpperCase()
      const isPlanCOrD = (userData as any)?.canTogglePublicGenerations === true || /(^|\b)PLAN\s*C\b/.test(planRaw) || /(^|\b)PLAN\s*D\b/.test(planRaw) || planRaw === 'C' || planRaw === 'D'
      let next = true
      if (isPlanCOrD) {
        next = (stored != null) ? (stored === 'true') : (server !== undefined ? Boolean(server) : true)
      } else {
        try { localStorage.setItem('isPublicGenerations', 'true') } catch { }
      }
      setIsPublic(next)
    } catch { }
  }, [userData])

  // Credits are now managed by Redux - no need for event listeners

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      try { localStorage.removeItem('me_cache') } catch { }
      try { sessionStorage.removeItem('me_cache') } catch { }
      try { clearMeCache() } catch { }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      try { await signOut(auth) } catch { }
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; ${expired}; SameSite=Lax`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`
      } catch { }
    } catch { }
    if (typeof window !== 'undefined') {
      try {
        history.pushState(null, document.title, location.href)
        window.addEventListener('popstate', () => {
          history.pushState(null, document.title, location.href)
        })
      } catch { }
    }
    window.location.replace('/view/HomePage?toast=LOGOUT_SUCCESS')
  }

  // Redirect functions for pricing page
  const handleUpgradePlan = () => {
    router.push('/view/pricing')
    setShowDropdown(false)
  }

  const handlePurchaseCredits = () => {
    router.push('/view/pricing')
    setShowDropdown(false)
  }

  return (
    <div className='fixed top-4 md:left-18 left-4 md:right-4 right-0 z-[60]'>
      <div className='flex justify-between items-center'>
        <div className=''>
          {/* <Image src="/core/logosquare.png" alt='logo' width={25} height={25} /> */}
        </div>

        <div className='flex items-center gap-2 md:gap-4'>
          {/* <Image className='cursor-pointer border rounded-full p-2 border-white/15' src="/icons/searchwhite.svg" alt='logo' width={45} height={45} /> */}
          {/* Credits button removed */}

          {/* Profile trigger removed for signed-in users */}
          {!userData && (
            <button
              onClick={() => router.push(getSignInUrl())}
              className='flex items-center gap-2 bg-white/10 mt-2 backdrop-blur-xl border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/20 hover:border-white/30 transition-all duration-200 shadow-lg'
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Nav