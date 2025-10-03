"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useOutsideClick } from '../../../hooks/use-outside-click'
import { getApiClient } from '../../../../lib/axiosInstance'
import { onCreditsRefresh } from '../../../../lib/creditsBus'
import Image from 'next/image'

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

  // Close dropdown when clicking outside
  useOutsideClick(dropdownRef, () => {
    setShowDropdown(false)
  })

  // Fetch user and credits from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the user token from localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('user')
        
        if (!token) {
          console.log('No auth token found')
          setLoading(false)
          return
        }

        // Parse token if it's stored as user object
        let authToken = token
        try {
          const userObj = JSON.parse(token)
          authToken = userObj.token || userObj.idToken
        } catch {
          // Token is already a string
        }

        console.log('Fetching user data with token:', authToken ? 'present' : 'missing')
        console.log('🍪 Current cookies before API call:', document.cookie)

        // Call backend API to get current user data using axios
        // Note: The backend expects the token in cookies (app_session), not Authorization header
        const api = getApiClient()
        const response = await api.get('/api/auth/me')

        console.log('📥 /api/me response status:', response.status)
        console.log('📥 /api/me response headers:', response.headers)

        const responseData = response.data
        console.log('Raw user data response:', responseData)
        
        // Parse the new response structure
        const userData = responseData.data?.user || responseData.user || responseData
        console.log('Parsed user data:', userData)
        
        setUserData(userData)
        try {
          const stored = localStorage.getItem('isPublicGenerations')
          const server = (userData && (userData as any).isPublic)
          const next = (stored != null) ? (stored === 'true') : Boolean(server)
          setIsPublic(next)
        } catch {}

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

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      
      // Clear authentication cookie
      document.cookie = 'app_session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax'
      
      // Call logout API using axios
      const api = getApiClient()
      await api.post('/api/auth/logout')
      
      // Redirect to landing page
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if API call fails
      window.location.href = '/'
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
  console.log(userData?.photoURL)

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

            <Image className='cursor-pointer' src="/icons/coinswhite.svg" alt='logo' width={25} height={25} />

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
                    {userData?.metadata?.accountStatus && (
                      <div className='text-green-400 text-xs mt-1'>
                        {userData.metadata.accountStatus.toUpperCase()}
                      </div>
                    )}
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
                  <button className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                    <span className='text-white text-sm'>Upgrade Plan</span>
                  </button>

                  {/* Purchase Credits */}
                  <button className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                    <span className='text-white text-sm'>Purchase Additional Credits</span>
                  </button>

                  {/* Theme Toggle */}
                  <button 
                    onClick={toggleTheme}
                    className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'
                  >
                    <span className='text-white text-sm'>Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </button>

                  {/* Make generations public toggle */}
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                    <span className='text-white text-sm'>Make generations public</span>
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
                      className={`w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-blue-500' : 'bg-white/20'}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full transition-transform transform ${isPublic ? 'translate-x-5' : 'translate-x-0'} relative top-0.5 left-0.5`} />
                    </button>
                  </div>

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
    </div>
  )
}

export default Nav