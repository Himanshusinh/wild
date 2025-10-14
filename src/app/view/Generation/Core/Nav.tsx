"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOutsideClick } from '../../../hooks/use-outside-click'
import { getApiClient } from '../../../../lib/axiosInstance'
import { useCredits } from '../../../../hooks/useCredits'
import { NAV_ROUTES } from '../../../../routes/routes'
import toast from 'react-hot-toast'
import { signOut } from 'firebase/auth'
import { auth } from '../../../../lib/firebase'

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
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>(() => {
    try {
      const stored = localStorage.getItem('theme')
      return (stored === 'dark' || stored === 'light' || stored === 'auto') ? stored : 'dark'
    } catch { return 'dark' }
  })
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isPublicGenerations')
      return stored ? stored === 'true' : true
    } catch { return true }
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const themeDropdownRef = useRef<HTMLDivElement>(null)

  // Use Redux credits state
  const { creditBalance, refreshCredits, loading: creditsLoading, error: creditsError } = useCredits()
  const router = useRouter()

  // Debug logging removed

  useOutsideClick(dropdownRef, () => setShowDropdown(false))
  
  // Close theme dropdown when clicking outside
  useOutsideClick(themeDropdownRef, () => {
    setShowThemeDropdown(false)
  })

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.classList.add('dark')
          root.classList.remove('light')
        } else {
          root.classList.remove('dark')
          root.classList.add('light')
        }
      } else if (theme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }

    applyTheme()

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const api = getApiClient()
        const response = await api.get('/api/auth/me')
        const payload = response.data
        const user = payload?.data?.user || payload?.user || payload
        try { console.log('[PublicGen][me] plan:', user?.plan, 'canTogglePublicGenerations:', (user as any)?.canTogglePublicGenerations, 'forcePublicGenerations:', (user as any)?.forcePublicGenerations) } catch {}
        setUserData(user || null)
        try {
          const stored = localStorage.getItem('isPublicGenerations')
          const server = (user && (user as any).isPublic)
          // Plan-based gating: only Plan C/D may toggle; otherwise force true
          const planRaw = String((user as any)?.plan || '').toUpperCase()
          const isPlanCOrD = (user as any)?.canTogglePublicGenerations === true || /(^|\b)PLAN\s*C\b/.test(planRaw) || /(^|\b)PLAN\s*D\b/.test(planRaw) || planRaw === 'C' || planRaw === 'D'
          let next = true
          if (isPlanCOrD) {
            next = (stored != null) ? (stored === 'true') : (server !== undefined ? Boolean(server) : true)
          } else {
            // Force true and persist for consumers
            try { localStorage.setItem('isPublicGenerations', 'true') } catch {}
          }
          setIsPublic(next)
        } catch { }

        // Refresh credits from Redux store
        await refreshCredits()
      } catch (e) {
        // no-op
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  // Credits are now managed by Redux - no need for event listeners

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      try { await signOut(auth) } catch {}
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; ${expired}; SameSite=Lax`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`
      } catch {}
    } catch {}
    if (typeof window !== 'undefined') {
      try {
        history.pushState(null, document.title, location.href)
        window.addEventListener('popstate', () => {
          history.pushState(null, document.title, location.href)
        })
      } catch {}
      window.location.replace('/view/Landingpage?toast=LOGOUT_SUCCESS')
    }
  }

  const selectTheme = (selectedTheme: 'dark' | 'light' | 'auto') => {
    setTheme(selectedTheme)
    try {
      localStorage.setItem('theme', selectedTheme)
    } catch {}
    setShowThemeDropdown(false)
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark': return 'Dark'
      case 'light': return 'Light'
      case 'auto': return 'System Preference'
      default: return 'Dark'
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
    <div className='fixed md:top-1 md:left-18 left-4 md:right-4 right-0 z-40 -top-1 '>
      <div className='flex justify-between items-center m-3'>
        <div className=''>
          {/* <Image src="/core/logosquare.png" alt='logo' width={25} height={25} /> */}
        </div>

        <div className='flex items-center md:gap-3 gap-1 '>
          {/* <Image className='cursor-pointer border rounded-full p-2 border-white/15' src="/icons/searchwhite.svg" alt='logo' width={45} height={45} /> */}
          <button
            onClick={() => refreshCredits()}
            className='text-sm md:text-base flex items-center gap-2 bg-black/15 dark:bg-white/15 border border-black/15 dark:border-white/15 backdrop-blur-3xl rounded-full shadow-xl p-1 w-auto md:px-3 px-2 md:py-2 py-0.5 justify-center hover:bg-black/20 dark:hover:bg-white/20 transition-colors z-50 text-black dark:text-white'
            title={`Credits: ${creditBalance ?? userData?.credits ?? 0}${creditsError ? ` (Error: ${creditsError})` : ''}`}
          >
            {creditsLoading ? '...' : (creditBalance ?? userData?.credits ?? 0)}
            <Image className='cursor-pointer md:w-6 md:h-6 w-4 h-4 brightness-50 dark:brightness-100 transition-all duration-300' src="/icons/coinswhite.svg" alt='logo' width={25} height={25} />
          </button>

          {/* Profile trigger + dropdown (same behavior as homepage) */}
          <div className='relative' ref={dropdownRef}>
            <button onClick={() => setShowDropdown(v => !v)} className='flex items-center gap-2 border border-black/15 dark:border-white/15 rounded-full cursor-pointer transition-colors duration-300'>
              {(!loading && userData?.photoURL && !avatarFailed) ? (
                <img
                  src={userData.photoURL}
                  alt='profile'
                  referrerPolicy='no-referrer'
                  onError={() => setAvatarFailed(true)}
                  className='md:w-[40px] md:h-[40px] w-[30px] h-[30px] rounded-full object-cover'
                />
              ) : (
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='text-black/80 dark:text-white/80 md:w-[40px] md:h-[40px] w-[30px] h-[30px]'>
                  <circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='2'/>
                  <path d='M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8' stroke='currentColor' strokeWidth='2'/>
                </svg>
              )}
            </button>

            {showDropdown && (
              <div className='absolute right-0 top-full mt-2 w-80 rounded-2xl backdrop-blur-3xl bg-white/90 dark:bg-white/10 shadow-xl border border-black/10 dark:border-white/10 overflow-hidden transition-colors duration-300'>
                <div className='p-4'>
                  {/* Header */}
                  <div className='flex items-center gap-3 mb-4 pb-4 border-b border-black/10 dark:border-white/10'>
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden'>
                      {(!loading && userData?.photoURL && !avatarFailed) ? (
                        <img src={userData.photoURL} alt='avatar' referrerPolicy='no-referrer' onError={() => setAvatarFailed(true)} className='w-full h-full object-cover' />
                      ) : (
                        <span className='text-white font-semibold text-lg'>{loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}</span>
                      )}
                    </div>
                    <div className='flex-1'>
                      <div className='text-black dark:text-white font-semibold text-lg'>{loading ? 'Loading...' : (userData?.username || 'User')}</div>
                      <div className='text-gray-600 dark:text-gray-300 text-sm'>{loading ? 'Loading...' : (userData?.email || 'user@example.com')}</div>
                      {/* {userData?.metadata?.accountStatus && (
                        <div className='text-green-400 text-xs mt-1'>{userData.metadata.accountStatus.toUpperCase()}</div>
                      )} */}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className='space-y-2'>
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

                    <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                      <span className='text-black dark:text-white text-sm'>Active Plan</span>
                      <span className='text-gray-600 dark:text-gray-300 text-sm'>{userData?.plan || 'Free'}</span>
                    </div>

                    <button
                      onClick={handleUpgradePlan}
                      className='w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
                    >
                      <span className='text-black dark:text-white text-sm'>Upgrade Plan</span>
                    </button>
                    <button
                      onClick={handlePurchaseCredits}
                      className='w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
                    >
                      <span className='text-black dark:text-white text-sm'>Purchase Additional Credits</span>
                    </button>

                    {/* Theme Toggle */}
                    <div className='relative' ref={themeDropdownRef}>
                      <button 
                        onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                        className='w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between'
                      >
                        <span className='text-black dark:text-white text-sm'>Theme: {getThemeLabel()}</span>
                        <svg 
                          className={`w-4 h-4 text-black/70 dark:text-white/70 transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`}
                          fill='none' 
                          stroke='currentColor' 
                          viewBox='0 0 24 24'
                        >
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </button>

                      {/* Theme Dropdown Menu */}
                      {showThemeDropdown && (
                        <div className='absolute left-0 top-full mt-1 w-full rounded-lg backdrop-blur-3xl bg-white dark:bg-black shadow-lg border border-black/10 dark:border-white/10 overflow-hidden z-10 transition-colors duration-300'>
                          <button
                            onClick={() => selectTheme('dark')}
                            className={`w-full text-left py-2 px-3 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${theme === 'dark' ? 'bg-black/5 dark:bg-white/5' : ''}`}
                          >
                            <span className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-black dark:text-white'}`}>Dark</span>
                          </button>
                          <button
                            onClick={() => selectTheme('light')}
                            className={`w-full text-left py-2 px-3 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${theme === 'light' ? 'bg-black/5 dark:bg-white/5' : ''}`}
                          >
                            <span className={`text-sm ${theme === 'light' ? 'text-blue-400' : 'text-black dark:text-white'}`}>Light</span>
                          </button>
                          <button
                            onClick={() => selectTheme('auto')}
                            className={`w-full text-left py-2 px-3 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${theme === 'auto' ? 'bg-black/5 dark:bg-white/5' : ''}`}
                          >
                            <span className={`text-sm ${theme === 'auto' ? 'text-blue-400' : 'text-black dark:text-white'}`}>System Preference</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Make generations public toggle */}
                    <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                      <span className='text-black dark:text-white text-sm'>Make generations public</span>
                      <button
                        type='button'
                        aria-pressed={isPublic}
                      onClick={async () => {
                        const planRaw = String(userData?.plan || '').toUpperCase()
                        const canToggle = /(^|\b)PLAN\s*C\b/.test(planRaw) || /(^|\b)PLAN\s*D\b/.test(planRaw) || planRaw === 'C' || planRaw === 'D'
                        if (!canToggle) {
                          toast('Public generations are always enabled on your plan')
                          setIsPublic(true)
                          try { localStorage.setItem('isPublicGenerations', 'true') } catch {}
                          return
                        }
                        const next = !isPublic
                        setIsPublic(next)
                        try { localStorage.setItem('isPublicGenerations', String(next)) } catch { }
                      }}
                        className={`w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-blue-500' : 'bg-black/20 dark:bg-white/20'}`}
                      >
                        <span className={`block w-4 h-4 bg-white rounded-full transition-transform transform ${isPublic ? 'translate-x-5' : 'translate-x-0'} relative top-0.5 left-0.5`} />
                      </button>
                    </div>

                    <div className='border-t border-black/10 dark:border-white/10 my-2'></div>

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

                    <button onClick={handleLogout} className='w-full text-left py-2 px-3 rounded-lg hover:bg-red-500/20 transition-colors'>
                      <span className='text-red-400 text-sm'>Log Out</span>
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