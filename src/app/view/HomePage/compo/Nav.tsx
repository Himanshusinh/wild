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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  // useOutsideClick(dropdownRef, () => {
  //   setShowDropdown(false)
  // })

  // Manual click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      // Add a small delay to prevent immediate closure
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDropdown])

  // Debug showDropdown state
  useEffect(() => {
    console.log('showDropdown state changed:', showDropdown)
  }, [showDropdown])

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
        
        try {
          const stored = localStorage.getItem('isPublicGenerations')
          const server = (user && (user as any).isPublic)
          const next = (stored != null) ? (stored === 'true') : (server !== undefined ? Boolean(server) : false)
          setIsPublic(next)
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
    console.log('Profile clicked, current state:', showDropdown)
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
    <div className='fixed top-0 left-0 right-0 z-[70] w-full'>
      <div className='w-full bg-black/10 backdrop-blur-3xl border-b border-white/10 px-2 md:px-4 py-2 md:py-3'>
        <div className='flex items-center justify-end gap-2 md:gap-3 relative'>
          {/* Group 1: search + credits inside shared background */}
          <div className='flex items-center gap-2 md:gap-3 rounded-full backdrop-blur-3xl bg-white/5 shadow-lg border border-white/10 px-1.5 py-0.5 md:px-2 md:py-1'>
          {/* <svg className='cursor-pointer p-1' width='36' height='36' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z' stroke='currentColor' strokeWidth='2' className='text-white/70'/>
            <path d='M21 21l-4.3-4.3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' className='text-white/70'/>
          </svg> */}
          <button className='flex items-center rounded-full  text-white text-sm md:text-lg px-3 py-1.5 md:px-6 md:py-2 gap-1.5 md:gap-2'>
            {loading ? '...' : (creditBalance ?? userData?.credits ?? 150)}

            <Image className='cursor-pointer md:w-[25px] md:h-[25px]' src={imageRoutes.icons.coins} alt='logo' width={18} height={18} />

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
          <div className='rounded-full'>
            <button 
              onClick={() => {
                console.log('Profile button clicked, current state:', showDropdown);
                setShowDropdown(!showDropdown);
              }}
              className='flex items-center justify-center rounded-full w-10 h-10 md:w-12 md:h-12 p-1 hover:bg-white/10 transition-colors'
            >
              {(!loading && userData?.photoURL && !avatarFailed) ? (
                <img
                  src={userData.photoURL}
                  alt='profile'
                  referrerPolicy='no-referrer'
                  onError={() => setAvatarFailed(true)}
                  className='w-8 h-8 md:w-10 md:h-10 rounded-full object-cover'
                />
              ) : (
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='text-white/80 md:w-6 md:h-6'>
                  <circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='2'/>
                  <path d='M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8' stroke='currentColor' strokeWidth='2'/>
                </svg>
              )}
            </button>
          </div>

          {/* Profile Dropdown */}
          {showDropdown && (
            <div className='absolute right-0 top-full mt-2 w-72 md:w-80 rounded-2xl backdrop-blur-3xl bg-white/10 shadow-xl border border-white/10 overflow-hidden z-[80] transform translate-x-0 translate-y-0'>
              <div className='p-3 md:p-4'>
                {/* User Info Header */}
                <div className='flex items-center gap-2 md:gap-3 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-white/10'>
                  <div className='w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden'>
                    {(!loading && userData?.photoURL && !avatarFailed) ? (
                      <img
                        src={userData.photoURL}
                        alt='avatar'
                        referrerPolicy='no-referrer'
                        onError={() => setAvatarFailed(true)}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <span className='text-white font-semibold text-sm md:text-lg'>
                        {loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}
                      </span>
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='text-white font-semibold text-sm md:text-lg'>
                      {loading ? 'Loading...' : ( userData?.username || 'User')}
                    </div>
                    <div className='text-gray-300 text-xs md:text-sm'>
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
                <div className='space-y-1.5 md:space-y-2'>
                  {/* User Info */}
                  <div className='space-y-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-white/5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-white text-xs md:text-sm'>Status</span>
                      <span className='text-green-400 text-xs md:text-sm'>{userData?.metadata?.accountStatus || 'Active'}</span>
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
                  <div className='flex items-center justify-between py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-white/5 transition-colors'>
                    <span className='text-white text-xs md:text-sm'>Active Plan</span>
                    <span className='text-gray-300 text-xs md:text-sm'>{userData?.plan || 'Free'}</span>
                  </div>

                  {/* Upgrade Plan */}
                  <button 
                    onClick={handleUpgradePlan}
                    className='w-full text-left py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-xs md:text-sm'>Upgrade Plan</span>
                  </button>

                  {/* Purchase Credits */}
                  <button 
                    onClick={handlePurchaseCredits}
                    className='w-full text-left py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-xs md:text-sm'>Purchase Additional Credits</span>
                  </button>

                  {/* Theme Toggle */}
                  {/* <button 
                    onClick={toggleTheme}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-sm'>Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </button> */}

                  {/* Make generations public toggle */}
                  <div className='flex items-center justify-between py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-white/5 transition-colors'>
                    <span className='text-white text-xs md:text-sm'>Make generations public</span>
                    <button
                      type='button'
                      aria-pressed={isPublic}
                      onClick={async () => {
                        const next = !isPublic
                        setIsPublic(next)
                        try {
                          const api = getApiClient()
                          await api.patch('/api/auth/me', { isPublic: next })
                        } catch {}
                        try { localStorage.setItem('isPublicGenerations', String(next)) } catch {}
                      }}
                      className={`w-8 h-4 md:w-10 md:h-5 rounded-full transition-colors ${isPublic ? 'bg-blue-500' : 'bg-white/20'}`}
                    >
                      <span className={`block w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-transform transform ${isPublic ? 'translate-x-4 md:translate-x-5' : 'translate-x-0'} relative top-0 left-0.5`} />
                    </button>
                  </div>

                  {/* Account Settings */}
                  <button 
                    onClick={() => {
                      router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT)
                      setShowDropdown(false)
                    }}
                    className='w-full text-left py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-xs md:text-sm'>Account Settings</span>
                  </button>

                  {/* Divider */}
                  <div className='border-t border-white/10 my-1.5 md:my-2'></div>

                  {/* Logout */}
                  <button 
                    onClick={handleLogout}
                    className='w-full text-left py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-red-500/20 transition-colors'
                  >
                    <span className='text-red-400 text-xs md:text-sm'>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

export default Nav