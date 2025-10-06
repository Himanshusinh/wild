"use client"
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export default function ToastMount() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    try {
      const search = new URLSearchParams(window.location.search)
      const q = search.get('toast')
      if (q === 'LOGOUT_SUCCESS') {
        toast.success('Logged out')
        const url = new URL(window.location.href)
        url.searchParams.delete('toast')
        window.history.replaceState({}, '', url.toString())
      }
      const key = 'toastMessage'
      const flag = localStorage.getItem(key)
      if (flag) {
        if (flag === 'LOGOUT_SUCCESS') toast.success('Logged out')
        if (flag === 'LOGIN_SUCCESS') toast.success('Logged in')
        localStorage.removeItem(key)
      }
    } catch {}
  }, [])
  return null
}


