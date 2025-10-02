"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useOutsideClick } from '../../../hooks/use-outside-click'
import { getApiClient } from '../../../../lib/axiosInstance'
import { useCredits } from '../../../../hooks/useCredits'

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
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isPublicGenerations')
      return stored ? stored === 'true' : false
    } catch { return false }
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Use Redux credits state
  const { creditBalance, refreshCredits, loading: creditsLoading, error: creditsError } = useCredits()
  
  // Debug logging
  React.useEffect(() => {
    console.log('Nav credits state:', { creditBalance, creditsLoading, creditsError });
  }, [creditBalance, creditsLoading, creditsError]);

  useOutsideClick(dropdownRef, () => setShowDropdown(false))

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
          const next = (stored != null) ? (stored === 'true') : Boolean(server)
          setIsPublic(next)
        } catch {}

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
      document.cookie = 'app_session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax'
      const api = getApiClient()
      await api.post('/api/auth/logout')
    } catch {}
    window.location.href = '/view/Landingpage'
  }

  return (
    <div className='fixed top-1 left-18 right-4 z-40  '>
      <div className='flex justify-between items-center m-3'>
        <div className=''>
          {/* <Image src="/core/logosquare.png" alt='logo' width={25} height={25} /> */}
        </div>

        <div className='flex items-center gap-3'>
          {/* <Image className='cursor-pointer border rounded-full p-2 border-white/15' src="/icons/searchwhite.svg" alt='logo' width={45} height={45} /> */}
          <button 
            onClick={() => refreshCredits()} 
            className='flex items-center gap-2 bg-white/15 border border-white/15 backdrop-blur-3xl rounded-full shadow-xl p-1 w-auto px-3 py-2 justify-center hover:bg-white/20 transition-colors z-50'
            title={`Credits: ${creditBalance ?? userData?.credits ?? 150}${creditsError ? ` (Error: ${creditsError})` : ''}`}
          >
            {creditsLoading ? '...' : (creditBalance ?? userData?.credits ?? 150)}
            <Image className='cursor-pointer' src="/icons/coinswhite.svg" alt='logo' width={25} height={25} />
          </button>

          {/* Profile trigger + dropdown (same behavior as homepage) */}
          <div className='relative' ref={dropdownRef}>
            <button onClick={() => setShowDropdown(v => !v)} className='flex items-center gap-2 border border-white/15 rounded-full  cursor-pointer'>
              {(!loading && userData?.photoURL && !avatarFailed) ? (
                <img
                  src={userData.photoURL}
                  alt='profile'
                  referrerPolicy='no-referrer'
                  onError={() => setAvatarFailed(true)}
                  className='w-[40px] h-[40px] rounded-full object-cover'
                />
              ) : (
                <Image className='cursor-pointer' src="/icons/person.svg" alt='logo' width={25} height={25} />
              )}
            </button>

            {showDropdown && (
              <div className='absolute right-0 top-full mt-2 w-80 rounded-2xl backdrop-blur-3xl bg-white/10 shadow-xl border border-white/10 overflow-hidden'>
                <div className='p-4'>
                  {/* Header */}
                  <div className='flex items-center gap-3 mb-4 pb-4 border-b border-white/10'>
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden'>
                      {(!loading && userData?.photoURL && !avatarFailed) ? (
                        <img src={userData.photoURL} alt='avatar' referrerPolicy='no-referrer' onError={() => setAvatarFailed(true)} className='w-full h-full object-cover' />
                      ) : (
                        <span className='text-white font-semibold text-lg'>{loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}</span>
                      )}
                    </div>
                    <div className='flex-1'>
                      <div className='text-white font-semibold text-lg'>{loading ? 'Loading...' : (userData?.username || 'User')}</div>
                      <div className='text-gray-300 text-sm'>{loading ? 'Loading...' : (userData?.email || 'user@example.com')}</div>
                      {userData?.metadata?.accountStatus && (
                        <div className='text-green-400 text-xs mt-1'>{userData.metadata.accountStatus.toUpperCase()}</div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className='space-y-2'>
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

                    <div className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                      <span className='text-white text-sm'>Active Plan</span>
                      <span className='text-gray-300 text-sm'>{userData?.plan || 'Free'}</span>
                    </div>

                    <button className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                      <span className='text-white text-sm'>Upgrade Plan</span>
                    </button>
                    <button className='w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors'>
                      <span className='text-white text-sm'>Purchase Additional Credits</span>
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

                    <div className='border-t border-white/10 my-2'></div>
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