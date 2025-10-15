"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useOutsideClick } from '../../../hooks/use-outside-click'
import { getApiClient } from '../../../../lib/axiosInstance'
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
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('theme')
      return (stored === 'dark' || stored === 'light') ? stored : 'dark'
    } catch { return 'dark' }
  })
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isPublicGenerations')
      return stored ? stored === 'true' : false
    } catch { return false }
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const themeDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useOutsideClick(dropdownRef, () => {
    setShowDropdown(false)
  })

  // Close theme dropdown when clicking outside
  useOutsideClick(themeDropdownRef, () => {
    setShowThemeDropdown(false)
  })

  // Fetch user and credits from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const api = getApiClient()
        const response = await api.get('/api/auth/me')
        const payload = response.data
        const user = payload?.data?.user || payload?.user || payload
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
  useEffect(() => {
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

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      console.log('Applying theme:', theme)
      console.log('Current classes before:', root.className)
      
      if (theme === 'dark') {
        console.log('Setting dark mode')
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        // light mode
        console.log('Setting light mode')
        root.classList.remove('dark')
        root.classList.add('light')
      }
      
      console.log('Current classes after:', root.className)
    }

    applyTheme()
  }, [theme])

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
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    console.log('Toggling theme to:', newTheme)
    setTheme(newTheme)
    try {
      localStorage.setItem('theme', newTheme)
      console.log('Theme saved to localStorage:', newTheme)
    } catch (e) {
      console.error('Failed to save theme:', e)
    }
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
        <div className='flex items-center gap-3 rounded-full backdrop-blur-3xl bg-black/5 dark:bg-white/5 shadow-lg border border-black/10 dark:border-white/10 px-2 py-1 transition-colors duration-300'>
          {/* <svg className='cursor-pointer p-1' width='36' height='36' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z' stroke='currentColor' strokeWidth='2' className='text-white/70'/>
            <path d='M21 21l-4.3-4.3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' className='text-white/70'/>
          </svg> */}
          <button className='flex items-center rounded-full text-black dark:text-white text-lg px-6 py-2 gap-2 transition-colors duration-300'>
            {loading ? '...' : (creditBalance ?? userData?.credits ?? 150)}

            <Image 
              className='cursor-pointer brightness-50 dark:brightness-100 transition-all duration-300' 
              src={imageRoutes.icons.coins} 
              alt='logo' 
              width={25} 
              height={25} 
            />

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
          <div className='rounded-full backdrop-blur-3xl bg-black/20 dark:bg-black/30 shadow-lg border border-black/10 dark:border-white/10 transition-colors duration-300'>
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
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='text-black/80 dark:text-white/80'>
                  <circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='2'/>
                  <path d='M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8' stroke='currentColor' strokeWidth='2'/>
                </svg>
              )}
            </button>
          </div>

          {/* Profile Dropdown */}
          {showDropdown && (
            <div className='absolute right-0 top-full mt-2 w-80 rounded-2xl backdrop-blur-3xl bg-white/90 dark:bg-white/10 shadow-xl border border-black/10 dark:border-white/10 overflow-hidden transition-colors duration-300'>
              <div className='p-4'>
                {/* User Info Header */}
                <div className='flex items-center gap-3 mb-4 pb-4 border-b border-black/10 dark:border-white/10'>
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
                    <div className='text-black dark:text-white font-semibold text-lg'>
                      {loading ? 'Loading...' : ( userData?.username || 'User')}
                    </div>
                    <div className='text-gray-600 dark:text-gray-300 text-sm'>
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
                  <div className='space-y-1 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-black dark:text-white text-sm'>Status</span>
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
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                    <span className='text-black dark:text-white text-sm'>Active Plan</span>
                    <span className='text-gray-600 dark:text-gray-300 text-sm'>{userData?.plan || 'Free'}</span>
                  </div>

                  {/* Upgrade Plan */}
                  <button 
                    onClick={handleUpgradePlan}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
                  >
                    <span className='text-black dark:text-white text-sm'>Upgrade Plan</span>
                  </button>

                  {/* Purchase Credits */}
                  <button 
                    onClick={handlePurchaseCredits}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
                  >
                    <span className='text-black dark:text-white text-sm'>Purchase Additional Credits</span>
                  </button>

                  {/* Theme Toggle */}
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                    <span className='text-black dark:text-white text-sm'>Theme</span>
                    <button
                      type='button'
                      onClick={toggleTheme}
                      className={`relative w-14 h-7 rounded-full transition-all duration-500 ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-600 to-blue-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                    >
                      {/* Background Icons */}
                      <div className='absolute inset-0 flex items-center justify-between px-1.5'>
                        {/* Sun Icon (Left) */}
                        <svg className={`w-3.5 h-3.5 transition-all duration-500 ${theme === 'light' ? 'text-white scale-100 opacity-100' : 'text-white/30 scale-75 opacity-0'}`} fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z' clipRule='evenodd' />
                        </svg>
                        
                        {/* Moon Icon (Right) */}
                        <svg className={`w-3.5 h-3.5 transition-all duration-500 ${theme === 'dark' ? 'text-white scale-100 opacity-100' : 'text-white/30 scale-75 opacity-0'}`} fill='currentColor' viewBox='0 0 20 20'>
                          <path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
                        </svg>
                      </div>
                      
                      {/* Sliding Knob */}
                      <span className={`absolute top-0.5 block w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-500 ease-in-out transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0.5'}`}>
                        {/* Inner Icon that rotates */}
                        <span className='absolute inset-0 flex items-center justify-center'>
                          {theme === 'dark' ? (
                            <svg className='w-3.5 h-3.5 text-indigo-600 animate-spin-slow' fill='currentColor' viewBox='0 0 20 20'>
                              <path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
                            </svg>
                          ) : (
                            <svg className='w-3.5 h-3.5 text-amber-500 animate-pulse' fill='currentColor' viewBox='0 0 20 20'>
                              <path fillRule='evenodd' d='M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z' clipRule='evenodd' />
                            </svg>
                          )}
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Make generations public toggle */}
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                    <span className='text-black dark:text-white text-sm'>Make generations public</span>
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
                      className={`w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-white/20'}`}
                    >
                      <span className={`block w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${isPublic ? 'translate-x-6' : 'translate-x-0.5'} relative top-0.5`} />
                    </button>
                  </div>

                  {/* Account Settings */}
                  <button 
                    onClick={() => {
                      router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT)  
                      setShowDropdown(false)
                    }}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
                  >
                    <span className='text-black dark:text-white text-sm'>Account Settings</span>
                  </button>

                  {/* Divider */}
                  <div className='border-t border-black/10 dark:border-white/10 my-2'></div>

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
    </div>
  )
}

export default Nav