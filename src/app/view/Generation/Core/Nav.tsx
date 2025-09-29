"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useOutsideClick } from '../../../hooks/use-outside-click'
import { getApiClient } from '../../../../lib/axiosInstance'
import { onCreditsRefresh } from '../../../../lib/creditsBus'

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
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useOutsideClick(dropdownRef, () => setShowDropdown(false))

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const api = getApiClient()
        const response = await api.get('/api/auth/me')
        const payload = response.data
        const user = payload?.data?.user || payload?.user || payload
        setUserData(user || null)

        // Fetch credits/token balance
        try {
          const creditsRes = await api.get('/api/credits/me')
          const creditsPayload = creditsRes.data?.data || creditsRes.data
          const balance = Number(creditsPayload?.creditBalance)
          if (!Number.isNaN(balance)) setCreditBalance(balance)
        } catch {}
      } catch (e) {
        // no-op
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  // Listen for credits refresh bus event
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
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      document.cookie = 'app_session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax'
      const api = getApiClient()
      await api.post('/api/auth/logout')
    } catch {}
    window.location.href = '/'
  }

  return (
    <div className='fixed top-1 left-18 right-0 z-40  '>
      <div className='flex justify-between items-center m-3'>
        <div className=''>
          {/* <Image src="/core/logosquare.png" alt='logo' width={25} height={25} /> */}
        </div>

        <div className='flex items-center gap-5'>
          <Image className='cursor-pointer border rounded-full p-2 border-[#998E8E]' src="/icons/searchwhite.svg" alt='logo' width={35} height={35} />
          <button className='flex items-center gap-2 bg-[#0011FF] border border-[#998E8E] rounded-full p-1 w-24 justify-center'>
            {loading ? '...' : (creditBalance ?? userData?.credits ?? 150)}
            <Image className='cursor-pointer' src="/icons/coinswhite.svg" alt='logo' width={25} height={25} />
          </button>

          {/* Profile trigger + dropdown (same behavior as homepage) */}
          <div className='relative' ref={dropdownRef}>
            <button onClick={() => setShowDropdown(v => !v)} className='flex items-center gap-2 border border-[#998E8E] rounded-full p-1 cursor-pointer'>
              {(!loading && userData?.photoURL && !avatarFailed) ? (
                <img
                  src={userData.photoURL}
                  alt='profile'
                  referrerPolicy='no-referrer'
                  onError={() => setAvatarFailed(true)}
                  className='w-[25px] h-[25px] rounded-full object-cover'
                />
              ) : (
                <Image className='cursor-pointer' src="/icons/person.svg" alt='logo' width={25} height={25} />
              )}
            </button>

            {showDropdown && (
              <div className='absolute right-0 top-full mt-2 w-80 rounded-2xl backdrop-blur-3xl bg-black/90 shadow-xl border border-white/10 overflow-hidden'>
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
                      <div className='flex items-center justify-between'>
                        <span className='text-white text-sm'>Login Count</span>
                        <span className='text-gray-300 text-sm'>{userData?.loginCount || 0}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-white text-sm'>Device</span>
                        <span className='text-gray-300 text-sm'>{userData?.deviceInfo?.browser || 'Unknown'}</span>
                      </div>
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