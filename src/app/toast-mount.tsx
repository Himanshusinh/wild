"use client"
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

const showToastByCode = (code: string | null): boolean => {
  if (!code) return false
  const normalized = code.toUpperCase()
  switch (normalized) {
    case 'LOGIN_SUCCESS':
      toast.success('Logged in successfully')
      return true
    case 'LOGOUT_SUCCESS':
      toast.success('Logged out successfully')
      return true
    case 'LOGOUT_FAILED':
      toast.error('Logout failed. Please try again.')
      return true
    default:
      return false
  }
}

export default function ToastMount() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    try {
      const removeToastQuery = () => {
        const url = new URL(window.location.href)
        url.searchParams.delete('toast')
        window.history.replaceState({}, '', url.toString())
      }

      const search = new URLSearchParams(window.location.search)
      const q = search.get('toast')
      if (showToastByCode(q)) {
        removeToastQuery()
      }

      const key = 'toastMessage'
      const flag = localStorage.getItem(key)
      if (showToastByCode(flag)) {
        localStorage.removeItem(key)
      }
    } catch {}
  }, [])
  return null
}