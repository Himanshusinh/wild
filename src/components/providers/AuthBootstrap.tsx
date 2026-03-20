"use client"
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { getMeCached } from '@/lib/me'
import { setUser } from '@/store/slices/authSlice'
import { auth } from '@/lib/firebase'

// Prefetches the authenticated user once per app mount and stores it in Redux.
// Also warms the storage-backed cache so subsequent pages don't refetch.
// FIXED: Prevent redirect loops by letting axios interceptor handle 401 errors
export default function AuthBootstrap() {
  const dispatch = useDispatch()
  const hasAttemptedAuth = useRef(false)

  useEffect(() => {
    // CIRCUIT BREAKER: Only attempt auth check once to prevent loops
    if (hasAttemptedAuth.current) {
      console.log('[AuthBootstrap] Skipping duplicate auth check')
      return
    }
    hasAttemptedAuth.current = true

    let mounted = true
      ; (async () => {
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
          } catch { }

          if (!hasCookie && !hasLocalStorageToken) {
            // CRITICAL FIX FOR SAFARI/MOBILE:
            // If no cookie/local token, check if we have a persisted Firebase user.
            // Safari ITP often blocks the cross-domain cookie, but Firebase Auth (IndexedDB) persists.

            let firebaseUser = auth.currentUser;

            // If auth not ready, wait briefly (up to 1s) for it to restore from IndexedDB
            if (!firebaseUser) {
              await new Promise<void>(resolve => {
                const unsubscribe = auth.onAuthStateChanged(() => {
                  unsubscribe();
                  resolve();
                });
                // Fallback timeout so we don't block anonymous users forever
                setTimeout(() => {
                  unsubscribe();
                  resolve();
                }, 1000);
              });
              firebaseUser = auth.currentUser;
            }

            if (firebaseUser) {
              try {
                // We have a user! Get token and save to localStorage to bypass cookie issues
                const token = await firebaseUser.getIdToken();
                if (token) {
                  localStorage.setItem('authToken', token);
                  // Also set user object for completeness
                  localStorage.setItem('user', JSON.stringify({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    token: token
                  }));
                  // Proceed to getMeCached below...
                } else {
                  dispatch(setUser(null));
                  return;
                }
              } catch (e) {
                console.error('[AuthBootstrap] Failed to recover session from Firebase:', e);
                dispatch(setUser(null));
                return;
              }
            } else {
              // No credentials at all - clear user state and return
              dispatch(setUser(null))
              return
            }
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
          if (!mounted) return

          // CRITICAL FIX: Don't redirect on 401 - let axios interceptor handle it
          // This prevents redirect loops
          if (error?.response?.status === 401) {
            console.warn('[AuthBootstrap] 401 Unauthorized - clearing user state', {
              hasCookie: typeof document !== 'undefined' ? document.cookie.includes('app_session=') : false,
              note: 'Axios interceptor will handle redirect after max retries'
            });
            dispatch(setUser(null))
            // DO NOT REDIRECT - let axios interceptor's circuit breaker handle it
          } else {
            // ignore other errors; anonymous users are valid
            console.log('[AuthBootstrap] Non-401 error during auth check (expected for anonymous users):', error?.message)
          }
        }
      })()
    return () => { mounted = false }
  }, [dispatch])

  return null
}
