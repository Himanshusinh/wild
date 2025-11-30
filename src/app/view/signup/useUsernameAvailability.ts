import { useEffect, useRef, useState } from 'react'

const USERNAME_REGEX = /^[a-z0-9_.-]{3,30}$/

export type UsernameCheckResult = {
  available: boolean
  normalized: string
  suggestions?: string[]
}

export const DEFAULT_API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` : (process.env.NEXT_PUBLIC_API_BASE ? `${process.env.NEXT_PUBLIC_API_BASE}/api` : ''))

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

    fetch(url, { 
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
    })
      .then(async (r) => {
        // If response is not JSON, try to handle gracefully
        let json: any = {}
        try { json = await r.json() } catch { json = {} }
        // Non-2xx
        if (!r.ok) {
          const msg = (json && (json.message || json.error)) || 'Request failed'
          throw new Error(msg)
        }
        // Expect formatApiResponse shape
        const data: UsernameCheckResult | undefined = json?.data
        if (!data || typeof data.available !== 'boolean') {
          throw new Error('Malformed response from server')
        }
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


