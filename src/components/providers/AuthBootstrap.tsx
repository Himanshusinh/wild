"use client"
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getMeCached } from '@/lib/me'
import { setUser } from '@/store/slices/authSlice'

// Prefetches the authenticated user once per app mount and stores it in Redux.
// Also warms the storage-backed cache so subsequent pages don't refetch.
export default function AuthBootstrap() {
  const dispatch = useDispatch()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await getMeCached()
        if (!mounted) return
        if (me) {
          dispatch(setUser(me))
        } else {
          // CRITICAL FIX: If getMeCached returns null/undefined, clear user state
          // This handles the case where cookie exists but backend rejects it
          dispatch(setUser(null))
        }
      } catch (error: any) {
        // CRITICAL FIX: If /api/auth/me returns 401, clear user state
        // This handles the case where cookie exists but is expired/invalid
        if (error?.response?.status === 401) {
          console.warn('[AuthBootstrap] 401 Unauthorized - clearing user state', {
            hasCookie: typeof document !== 'undefined' ? document.cookie.includes('app_session=') : false
          });
          dispatch(setUser(null))
        }
        // ignore other errors; anonymous users are valid
      }
    })()
    return () => { mounted = false }
  }, [dispatch])

  return null
}
