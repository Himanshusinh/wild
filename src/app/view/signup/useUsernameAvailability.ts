import { useEffect, useRef, useState } from 'react'

const USERNAME_REGEX = /^[a-z0-9_.-]{3,30}$/

export type UsernameCheckResult = {
  available: boolean
  normalized: string
  suggestions?: string[]
}

export const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api'

export function useUsernameAvailability(apiBase = '') {
  const [username, setUsername] = useState<string>('')
  const [status, setStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'|'error'>('idle')
  const [result, setResult] = useState<UsernameCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const [debounced, setDebounced] = useState<string>('')
  const lastRequestedRef = useRef<string>('')

  // debounce username value
  useEffect(() => {
    const id = setTimeout(() => setDebounced(username), 400)
    return () => clearTimeout(id)
  }, [username])

  useEffect(() => {
    setError(null)
    setResult(null)

    const value = debounced.trim().toLowerCase()
    if (!value) { setStatus('idle'); return }

    if (!USERNAME_REGEX.test(value)) { setStatus('invalid'); return }

    // cancel previous
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setStatus('checking')
    lastRequestedRef.current = value
    const base = (apiBase || DEFAULT_API_BASE).replace(/\/$/, '')
    const url = `${base}/auth/username/check?username=${encodeURIComponent(value)}`

    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(json?.message || 'Request failed')
        const data: UsernameCheckResult | undefined = json?.data
        if (!data || typeof data.available !== 'boolean') throw new Error('Malformed response')
        // Only apply if response matches the latest requested username
        if (lastRequestedRef.current !== value) return
        setResult(data)
        setStatus(data.available ? 'available' : 'taken')
      })
      .catch((e) => {
        if (e?.name === 'AbortError') { setStatus('idle'); return }
        setError(e?.message || 'Network error')
        setStatus('error')
      })

    return () => controller.abort()
  }, [debounced, apiBase])

  return {
    username,
    setUsername,
    status,
    result,
    error,
    isChecking: status === 'checking',
    isAvailable: status === 'available',
    isTaken: status === 'taken',
    isInvalid: status === 'invalid'
  }
}

export const USERNAME_REGEX_CONST = USERNAME_REGEX


