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
        // Optimization: Check if we have any auth credentials (cookie or local storage token)
        // If neither exists, we are definitely anonymous, so skip the API call to prevent 401s
        const hasCookie = typeof document !== 'undefined' && (
            document.cookie.includes('app_session=') || 
            document.cookie.includes('auth_token=')
        )
        
        let hasLocalStorageToken = false
        try {
            if (typeof localStorage !== 'undefined') {
                const userStr = localStorage.getItem('user')
                const userObj = userStr ? JSON.parse(userStr) : null
                hasLocalStorageToken = !!(localStorage.getItem('authToken') || (userObj && (userObj.token || userObj.idToken)))
            }
        } catch {}

        if (!hasCookie && !hasLocalStorageToken) {
             // No credentials at all - clear user state and return
             dispatch(setUser(null))
             return
        }

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
          const errorMessage = error?.response?.data?.message || error?.message || '';
          
          // Check if error is due to cookie not being sent (domain issue)
          const isDomainIssue = errorMessage.includes('Cookie not sent') || 
                                errorMessage.includes('No session token');
          
          if (isDomainIssue) {
            console.warn('[AuthBootstrap] 401 due to cookie domain issue - NOT clearing user state to prevent flash of logout', {
              hasCookie: typeof document !== 'undefined' ? document.cookie.includes('app_session=') : false,
              error: errorMessage
            });
            // Don't clear user state immediately - let the user stay "logged in" on frontend
            // They will be redirected to login eventually if they try to do something that requires auth
            // But this prevents the "flash of logout" when just browsing
          } else {
            console.warn('[AuthBootstrap] 401 Unauthorized - clearing user state', {
              hasCookie: typeof document !== 'undefined' ? document.cookie.includes('app_session=') : false
            });
            dispatch(setUser(null))
            
            // CRITICAL FIX: Redirect to signup with toast if session is invalid
            // This ensures the user knows why they were logged out
            if (typeof window !== 'undefined') {
              const currentPath = window.location.pathname;
              // Don't redirect if already on public pages
              const isPublic = currentPath === '/' || 
                               currentPath.startsWith('/view/Landingpage') || 
                               currentPath.startsWith('/view/signup') || 
                               currentPath.startsWith('/view/signin');
                               
              if (!isPublic) {
                console.warn('[AuthBootstrap] Redirecting to signup due to 401...');
                window.location.href = `/view/signup?next=${encodeURIComponent(currentPath)}&toast=SESSION_EXPIRED`;
              }
            }
          }
        }
        // ignore other errors; anonymous users are valid
      }
    })()
    return () => { mounted = false }
  }, [dispatch])

  return null
}
