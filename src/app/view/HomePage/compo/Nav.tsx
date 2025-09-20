import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { getImageUrl } from '../routes'
import { useOutsideClick } from '../../../hooks/use-outside-click'

interface UserData {
  uid: string
  email: string
  username: string
  photoURL?: string
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useOutsideClick(dropdownRef, () => {
    setShowDropdown(false)
  })

  // Fetch user data from backend
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

        // Call backend API to get current user data
        // Note: The backend expects the token in cookies (app_session), not Authorization header
        const response = await fetch('http://localhost:5000/api/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // This ensures cookies are sent
        })
        
        console.log('📥 /api/me response status:', response.status)
        console.log('📥 /api/me response headers:', response.headers)

        if (response.ok) {
          const responseData = await response.json()
          console.log('Raw user data response:', responseData)
          
          // Parse the new response structure
          const userData = responseData.data?.user || responseData.user || responseData
          console.log('Parsed user data:', userData)
          
          setUserData(userData)
        } else {
          console.error('Failed to fetch user data:', response.status)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      
      // Clear authentication cookie
      document.cookie = 'app_session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax'
      
      // Call logout API
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
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

  return (
    <div className='fixed top-4 right-4 z-50'>
      <div className='flex items-center gap-3'>
        {/* Group 1: search + credits inside shared background */}
        <div className='flex items-center gap-3 rounded-full backdrop-blur-3xl bg-black/30 shadow-lg border border-white/10 px-3 py-2'>
          <Image className='cursor-pointer p-1' src={getImageUrl('core', 'search')} alt='search' width={36} height={36} />
          <button className='flex items-center rounded-full bg-[#1C303D] text-white text-lg px-6 py-2 gap-2'>
            {loading ? '...' : (userData?.credits || 150)}
            <Image className='cursor-pointer' src={getImageUrl('core', 'coins')} alt='coins' width={26} height={26} />
          </button>
        </div>

        {/* Group 2: person icon with dropdown */}
        <div className='relative' ref={dropdownRef}>
          <div className='rounded-full backdrop-blur-3xl bg-black/30 shadow-lg border border-white/10 p-3'>
            <button 
              onClick={toggleDropdown}
              className='flex items-center justify-center rounded-full'
            >
              <Image className='cursor-pointer' src={getImageUrl('core', 'profile')} alt='profile' width={28} height={28} />
            </button>
          </div>

          {/* Profile Dropdown */}
          {showDropdown && (
            <div className='absolute right-0 top-full mt-2 w-80 rounded-2xl backdrop-blur-3xl bg-black/40 shadow-xl border border-white/10 overflow-hidden'>
              <div className='p-4'>
                {/* User Info Header */}
                <div className='flex items-center gap-3 mb-4 pb-4 border-b border-white/10'>
                  <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                    <span className='text-white font-semibold text-lg'>
                      {loading ? '...' : (userData?.username?.charAt(0).toUpperCase() || userData?.email?.charAt(0).toUpperCase() || 'U')}
                    </span>
                  </div>
                  <div className='flex-1'>
                    <div className='text-white font-semibold text-lg'>
                      {loading ? 'Loading...' : (userData?.username || 'User')}
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
                    <div className='flex items-center justify-between'>
                      <span className='text-white text-sm'>Login Count</span>
                      <span className='text-gray-300 text-sm'>{userData?.loginCount || 0}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-white text-sm'>Device</span>
                      <span className='text-gray-300 text-sm'>{userData?.deviceInfo?.browser || 'Unknown'}</span>
                    </div>
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