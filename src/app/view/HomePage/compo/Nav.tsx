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
      } catch {}
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
      try { await signOut(auth) } catch {}

      // Proactively clear cookie variants on current domain and parent domain
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; ${expired}; SameSite=Lax`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`
      } catch {}

      // Clear history stack: prevent navigating back into the app
      if (typeof window !== 'undefined') {
        try {
          history.pushState(null, document.title, location.href)
          window.addEventListener('popstate', () => {
            history.pushState(null, document.title, location.href)
          })
        } catch {}
        window.location.replace('/view/Landingpage?toast=LOGOUT_SUCCESS')
      }
    } catch (_err) {
      if (typeof window !== 'undefined') window.location.replace('/view/Landingpage?toast=LOGOUT_FAILED')
    }
  }

  const toggleDropdown = () => {
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
    <div className='fixed top-4 right-4 z-50'>
      <div className='flex items-center gap-3'>
        {/* Group 1: search + credits inside shared background */}
        <div className='flex items-center gap-3 rounded-full backdrop-blur-3xl bg-white/5 shadow-lg border border-white/10 px-2 py-1'>
          {/* <svg className='cursor-pointer p-1' width='36' height='36' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z' stroke='currentColor' strokeWidth='2' className='text-white/70'/>
            <path d='M21 21l-4.3-4.3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' className='text-white/70'/>
          </svg> */}
          <button className='flex items-center rounded-full text-white text-lg px-6 py-2 gap-2'>
            {loading ? '...' : (creditBalance ?? userData?.credits ?? 150)}

            <Image className='cursor-pointer' src={imageRoutes.icons.coins} alt='logo' width={25} height={25} />

            {/* <svg className='cursor-pointer' width='26' height='26' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <circle cx='12' cy='12' r='9' stroke='#F4D03F' strokeWidth='2' fill='url(#coinGrad)'/>
              <path d='M12 7v10M9 10h6M9 14h6' stroke='#8E6B00' strokeWidth='1.5' strokeLinecap='round'/>
              <defs>  
                <linearGradient id='coinGrad' x1='12' y1='3' x2='12' y2='21' gradientUnits='userSpaceOnUse'>
                  <stop stopColor='#F9E79F'/>
                  <stop offset='1' stopColor='#F4D03F'/>
                </linearGradient>
              </defs>
            </svg> */}
          </button>
        </div>

        {/* Group 2: person icon with dropdown */}
        <div className='relative' ref={dropdownRef}>
          <div className='rounded-full backdrop-blur-3xl bg-black/30 shadow-lg border border-white/10 '>
            <button 
              onClick={toggleDropdown}
              className='flex items-center justify-center rounded-full'
            >
              {(!loading && userData?.photoURL && !avatarFailed) ? (
                <img
                  src={userData.photoURL}
                  alt='profile'
                  referrerPolicy='no-referrer'
                  onError={() => setAvatarFailed(true)}
                  className='w-11 h-11 rounded-full object-cover'
                />
              ) : (
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='text-white/80'>
                  <circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='2'/>
                  <path d='M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8' stroke='currentColor' strokeWidth='2'/>
                </svg>
              )}
            </button>
          </div>

          {/* Profile Dropdown */}
          {showDropdown && (
            <div className='absolute right-0 top-full mt-2 w-80 rounded-2xl backdrop-blur-3xl bg-white/10 shadow-xl border border-white/10 overflow-hidden'>
              <div className='p-4'>
                {/* User Info Header */}
                <div className='flex items-center gap-3 mb-4 pb-4 border-b border-white/10'>
                  <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden'>
                    {(!loading && userData?.photoURL && !avatarFailed) ? (
                      <img
                        src={userData.photoURL}
                        alt='avatar'
                        referrerPolicy='no-referrer'
                        onError={() => setAvatarFailed(true)}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <span className='text-white font-semibold text-lg'>
                        {loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}
                      </span>
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='text-white font-semibold text-lg'>
                      {loading ? 'Loading...' : ( userData?.username || 'User')}
                    </div>
                    <div className='text-gray-300 text-sm'>
                      {loading ? 'Loading...' : (userData?.email || 'user@example.com')}
                    </div>
                    {/* {userData?.metadata?.accountStatus && (
                      <div className='text-green-400 text-xs mt-1'>
                        {userData.metadata.accountStatus.toUpperCase()}
                      </div>
                    )} */}
                  </div>
                </div>

                {/* Menu Items */}
                <div className='space-y-2'>
                  {/* User Info */}
                  <div className='space-y-1 px-3 py-2 rounded-lg bg-white/5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-white text-sm'>Status</span>
                      <span className='text-green-400 text-sm'>{userData?.metadata?.accountStatus || 'Active'}</span>
                    </div>
                    {/* <div className='flex items-center justify-between'>
                      <span className='text-white text-sm'>Login Count</span>
                      <span className='text-gray-300 text-sm'>{userData?.loginCount || 0}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-white text-sm'>Device</span>
                      <span className='text-gray-300 text-sm'>{userData?.deviceInfo?.browser || 'Unknown'}</span>
                    </div> */}
                  </div>

                  {/* Active Plan */}
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                    <span className='text-white text-sm'>Active Plan</span>
                    <span className='text-gray-300 text-sm'>{userData?.plan || 'Free'}</span>
                  </div>

                  {/* Upgrade Plan */}
                  <button 
                    onClick={handleUpgradePlan}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-sm'>Upgrade Plan</span>
                  </button>

                  {/* Purchase Credits */}
                  <button 
                    onClick={handlePurchaseCredits}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-sm'>Purchase Additional Credits</span>
                  </button>

                  {/* Theme Toggle */}
                  {/* <button 
                    onClick={toggleTheme}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-sm'>Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </button> */}

                  {/* Make generations public toggle */}
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                    <span className='text-white text-sm'>
                      Make generations public
                      {!canTogglePublic && <span className="ml-1 text-xs">🔒</span>}
                    </span>
                    <div className="relative group">
                      <button
                        type='button'
                        aria-pressed={isPublic}
                        disabled={!canTogglePublic}
                        onClick={async () => {
                          if (!canTogglePublic) {
                            setShowUpgradeModal(true);
                            return;
                          }
                          const next = !isPublic
                          setIsPublic(next)
                          try {
                            const api = getApiClient()
                            await api.patch('/api/auth/me', { isPublic: next })
                          } catch {}
                          try { localStorage.setItem('isPublicGenerations', String(next)) } catch {}
                        }}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          !canTogglePublic 
                            ? 'bg-white/20 cursor-not-allowed opacity-60' 
                            : isPublic 
                              ? 'bg-blue-500' 
                              : 'bg-white/20'
                        }`}
                      >
                        <span className={`block w-4 h-4 bg-white rounded-full transition-transform transform ${isPublic ? 'translate-x-5' : 'translate-x-0'} relative top-0 left-0.5`} />
                      </button>
                      {!canTogglePublic && (
                        <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                          Upgrade to Plan C or D for private generations
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Settings */}
                  <button 
                    onClick={() => {
                      router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT)
                      setShowDropdown(false)
                    }}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-sm'>Account Settings</span>
                  </button>

                  {/* Divider */}
                  <div className='border-t border-white/10 my-2'></div>

                  {/* Logout */}
                  <button 
                    onClick={handleLogout}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-red-500/20 transition-colors'
                  >
                    <span className='text-red-400 text-sm'>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
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
    </div>
  )
}

export default Nav