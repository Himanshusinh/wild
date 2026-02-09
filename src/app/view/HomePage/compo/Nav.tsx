"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useOutsideClick } from '../../../hooks/use-outside-click'
import { getApiClient } from '../../../../lib/axiosInstance'
import { getMeCached } from '../../../../lib/me'
import { onCreditsRefresh } from '../../../../lib/creditsBus'
import { NAV_ROUTES } from '../../../../routes/routes'
import Image from 'next/image'
import { signOut } from 'firebase/auth'
import { auth } from '../../../../lib/firebase'
import { imageRoutes } from '../routes'
import { getPublicPolicyFromUser } from '@/hooks/usePublicPolicy'
import toast from 'react-hot-toast'

interface UserData {
  uid: string
  email: string
  username: string
  photoURL?: string
  displayName?: string
  provider: string
  createdAt?: string
  emailVerified?: boolean
  isActive?: boolean
  lastLoginAt?: string
  loginCount?: number
  lastLoginIP?: string
  userAgent?: string
  credits?: number
  plan?: string
  metadata?: {
    accountStatus: string
    roles: string[]
  }
  preferences?: {
    theme: string
    language: string
  }
  deviceInfo?: {
    os: string
    browser: string
    device: string
  }
}

const Nav = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark')
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isPublicGenerations')
      return stored ? stored === 'true' : false
    } catch { return false }
  })
  const [canTogglePublic, setCanTogglePublic] = useState<boolean>(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useOutsideClick(dropdownRef, () => {
    setShowDropdown(false)
  })

  // Fetch user and credits from backend
  const didInitUserRef = useRef(false)
  useEffect(() => {
    if (didInitUserRef.current) return; // Prevent StrictMode double-mount fetches in dev
    didInitUserRef.current = true;
    const fetchUserData = async () => {
      try {
        const api = getApiClient()
        const user = await getMeCached()
        setUserData(user || null)

        // Get public policy from user data
        const policy = getPublicPolicyFromUser(user);
        setCanTogglePublic(policy.canToggle);

        try {
          const stored = localStorage.getItem('isPublicGenerations')
          const server = (user && (user as any).isPublic)
          const next = (stored != null) ? (stored === 'true') : (server !== undefined ? Boolean(server) : false)
          // If user is restricted (cannot toggle), force to true
          if (!policy.canToggle) {
            setIsPublic(true);
          } else {
            setIsPublic(next);
          }
        } catch { }

        // Fetch credits/token balance
        try {
          const creditsRes = await api.get('/api/credits/me')
          const creditsPayload = creditsRes.data?.data || creditsRes.data
          const balance = Number(creditsPayload?.creditBalance)
          if (!Number.isNaN(balance)) setCreditBalance(balance)
        } catch (e) {
          // silent fail, UI will fallback
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Listen for credits refresh requests
  const didInitCreditsRef = useRef(false)
  useEffect(() => {
    if (didInitCreditsRef.current) return;
    didInitCreditsRef.current = true;
    const api = getApiClient()
    const unsubscribe = onCreditsRefresh(async () => {
      try {
        const creditsRes = await api.get('/api/credits/me')
        const creditsPayload = creditsRes.data?.data || creditsRes.data
        const balance = Number(creditsPayload?.creditBalance)
        if (!Number.isNaN(balance)) setCreditBalance(balance)
      } catch { }
    })
    return unsubscribe
  }, [])

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')

      // Call Next.js logout proxy to clear server and client cookies robustly
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })

      // Also sign out from Firebase to stop background token refresh
      try { await signOut(auth) } catch { }

      // Proactively clear cookie variants on current domain and parent domain
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; ${expired}; SameSite=Lax`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`
      } catch { }

      // Clear history stack: prevent navigating back into the app
      if (typeof window !== 'undefined') {
        try {
          history.pushState(null, document.title, location.href)
          window.addEventListener('popstate', () => {
            history.pushState(null, document.title, location.href)
          })
        } catch { }
        window.location.replace('/view/HomePage?toast=LOGOUT_SUCCESS')
      }
    } catch (err) {
      console.error('Logout error:', err)
      toast.error('Failed to logout. Please try again.', { duration: 4000 })
      if (typeof window !== 'undefined') {
        // Still redirect even on error to prevent user from being stuck
        setTimeout(() => {
          window.location.replace('/view/HomePage?toast=LOGOUT_FAILED')
        }, 2000)
      }
    }
  }

  const toggleDropdown = () => {
    // On mobile, navigate directly to account settings instead of opening dropdown
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT)
      return
    }
    setShowDropdown(!showDropdown)
  }

  const toggleTheme = () => {
    const themes: ('dark' | 'light' | 'auto')[] = ['dark', 'light', 'auto']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
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
    <>
      <div className='fixed top-4 right-2 md:right-4 z-[60]'>
        <div className='flex items-center gap-3'>
          {!userData && (
            <button
              onClick={() => router.push('/view/signin')}
              className='flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-white/20 hover:border-white/30 transition-all duration-200 shadow-lg'
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#0F1419] rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Want Private Generations?
              </h3>
              <p className="text-gray-300 text-sm mb-6">
                Your plan requires all generations to be public. Upgrade to Plan C or D for private generations.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors font-medium text-sm text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push('/view/pricing');
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors font-medium text-sm text-white"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Nav