"use client"
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export default function ToastMount() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    try {
      // Use setTimeout to ensure toast shows after page is fully loaded
      setTimeout(() => {
        const search = new URLSearchParams(window.location.search)
        const q = search.get('toast')
        
        if (q) {
          // Handle all toast types here
          if (q === 'LOGOUT_SUCCESS') {
            toast.success('Logged out successfully', { duration: 2500 })
          } else if (q === 'LOGOUT_FAILED') {
            toast.error('Logout failed. Please try again.', { duration: 4000 })
          } else if (q === 'SESSION_EXPIRED') {
            toast.error('Session expired. Please log in again.', { duration: 5000 })
          } else if (q === 'UNAUTHORIZED') {
            toast.error('Please log in to access that page.', { duration: 5000 })
          } else if (q === 'LOGIN_REQUIRED') {
            toast('Please log in to continue.', { icon: '🔒', duration: 4000 })
          }

          // Clear the param from URL without reloading
          const url = new URL(window.location.href)
          url.searchParams.delete('toast')
          window.history.replaceState({}, '', url.toString())
        }

        const key = 'toastMessage'
        const flag = localStorage.getItem(key)
        if (flag) {
          // Only handle logout here to avoid duplicate login toasts.
          // Login success is handled in HomePage with a small delay for better UX.
          if (flag === 'LOGOUT_SUCCESS') {
            toast.success('Logged out successfully', { duration: 2500 })
          } else if (flag === 'LOGOUT_FAILED') {
            toast.error('Logout failed. Please try again.', { duration: 4000 })
          }
          localStorage.removeItem(key)
        }
      }, 500) // Increased delay to 500ms to ensure Toaster is ready
    } catch {}
  }, [])
  return null

}


