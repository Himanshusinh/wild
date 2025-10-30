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
        if (me) dispatch(setUser(me))
      } catch {
        // ignore; anonymous users are valid
      }
    })()
    return () => { mounted = false }
  }, [dispatch])

  return null
}
