  "use client"

import { useState, type FormEvent, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import axios from "axios"
import axiosInstance, { getApiClient } from '@/lib/axiosInstance'
import Image from "next/image"
import { useUsernameAvailability } from "./useUsernameAvailability"
import { getImageUrl } from "@/routes/imageroute"
import { signInWithCustomToken, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { APP_ROUTES } from '../../../routes/routes'
import toast from 'react-hot-toast'
import LoadingScreen from '@/components/ui/LoadingScreen'

// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 7) => {
  console.log("🍪 Starting cookie setting process...")
  console.log("🍪 Cookie name:", name)
  console.log("🍪 Cookie value length:", value.length)

  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`

  console.log("🍪 Setting cookie string:", cookieString)
  console.log("🍪 Current cookies before setting:", document.cookie)  

  document.cookie = cookieString

  // Immediate verification
  console.log("🍪 Current cookies immediately after setting:", document.cookie)

  // Verify cookie was set after a delay
  setTimeout(() => {
    const cookies = document.cookie.split(';').map(c => c.trim())
    console.log("🍪 All cookies after timeout:", cookies)
    const targetCookie = cookies.find(c => c.startsWith(`${name}=`))
    console.log("🍪 Cookie verification:", targetCookie ? "SET" : "NOT SET")
    if (targetCookie) {
      console.log("🍪 Found cookie:", targetCookie)
      console.log("🍪 Cookie value extracted:", targetCookie.split('=')[1])
    } else {
      console.log("❌ Cookie NOT found in document.cookie")
    }
  }, 100)
}

const clearCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`
}

export default function SignInForm() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams?.get('returnUrl') || null
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [processing, setProcessing] = useState(false)
  const [username, setUsername] = useState("")
  const [showUsernameForm, setShowUsernameForm] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false) // Login flow toggle
  const [rememberMe, setRememberMe] = useState(false) // Remember me checkbox
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isUsernameSubmitting, setIsUsernameSubmitting] = useState(false)
  const [authLoading, setAuthLoading] = useState(false) // full-screen overlay during sign-ins

  // Redeem code states
  const [showRedeemCodeForm, setShowRedeemCodeForm] = useState(false)
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemCodeValidated, setRedeemCodeValidated] = useState(false)
  const [redeemCodeInfo, setRedeemCodeInfo] = useState<any>(null)

  // Username live availability (always declared to keep hook order stable)
  const availability = useUsernameAvailability(process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` : '')
  
  // BUG FIX #19: Sync auth state across multiple tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'authToken') {
        // Auth state changed in another tab
        if (e.newValue) {
          // Another tab logged in - reload to sync state (only if not on signup page)
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/sign')) {
            window.location.reload()
          }
        } else {
          // Another tab logged out - clear local state
          setError("")
          setSuccess("")
          setProcessing(false)
          setAuthLoading(false)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  useEffect(() => {
    availability.setUsername(username)
  }, [username])

  // Check for capital letters in username
  const hasCapitalLetters = /[A-Z]/.test(username)

  // Test cookie setting function
  const testCookieSetting = () => {
    console.log("🧪 Testing cookie setting...")
    setCookie('test_cookie', 'test_value_123', 1)

    setTimeout(() => {
      console.log("🧪 Test cookies after setting:", document.cookie)
      const testCookie = document.cookie.split(';').find(c => c.trim().startsWith('test_cookie='))
      console.log("🧪 Test cookie found:", testCookie)
    }, 200)
  }

  // Loading Spinner Component (white ring, no label)
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-1">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
    </div>
  )

  // Redirect Spinner Component (white ring, no label) 
  const RedirectSpinner = () => (
    <div className="flex items-center justify-center py-1">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
    </div>
  )

  const refreshFirebaseIdToken = async (): Promise<string | null> => {
    try {
      if (!auth?.currentUser) return null
      const fresh = await auth.currentUser.getIdToken(true)
      if (fresh) {
        try {
          localStorage.setItem('authToken', fresh)
        } catch (err) {
          console.warn('[Auth] Failed to persist refreshed ID token:', err)
        }
      }
      return fresh || null
    } catch (error) {
      console.warn('[Auth] Firebase ID token refresh failed:', error)
      return null
    }
  }

  const switchToGoogleSignIn = () => {
    setShowLoginForm(false) // Ensure we're in sign-up mode for Google
    setError("")
    // Trigger Google sign-in
    setTimeout(() => {
      handleGoogleLogin()
    }, 100)
  }

  const switchToEmailSignIn = () => {
    setShowLoginForm(true) // Switch to login mode
    setError("")
  }

  // Handle login form submission
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // BUG FIX #5: Prevent race condition - block if already processing
    if (processing || authLoading) {
      console.log("⚠️ Login already in progress, ignoring duplicate request")
      return
    }
    
    console.log("🔐 Starting login process...")
    console.log("📧 Email:", email.trim())
    console.log("🔒 Password provided:", password ? "***" : "empty")

    if (!email.trim() || !password) {
      setError("Please enter both email and password")
      return
    }

    setError("")
    setSuccess("")
  setProcessing(true)
  setAuthLoading(true)

    try {
      // Step 1: Send credentials to backend
      console.log("🌐 Step 1: Sending credentials to backend...")
      const response = await axiosInstance.post("/api/auth/login", {
        email: email.trim(),
        password: password
      }, {
        withCredentials: true
      })

      console.log("📥 Login response status:", response.status)
      console.log("📥 Login response data:", response.data)

      if (response.data?.data) {
        // Server sets the session cookie; custom token is optional and not required on client
        const { user, customToken, passwordLoginIdToken, redirect } = response.data.data

        console.log("✅ Login successful!")
        console.log("👤 User:", user)

        // Optionally store ID token (helps with Bearer-first APIs); safe to proceed without it since cookie is set
        try {
          if (passwordLoginIdToken && typeof passwordLoginIdToken === 'string') {
            localStorage.setItem("authToken", passwordLoginIdToken)
          }
        } catch {}

        // Store user profile; rely on httpOnly session cookie for auth
        try { localStorage.setItem("user", JSON.stringify(user)) } catch {}

        // Persist toast flag for next page (faster redirect)
  try { localStorage.setItem('toastMessage', 'LOGIN_SUCCESS') } catch {}
  setIsRedirecting(true)
        setEmail("")
        setPassword("")

        // Set a short-lived hint cookie to prevent race-condition redirects in middleware
        try { document.cookie = 'auth_hint=1; Max-Age=120; Path=/; SameSite=Lax' } catch {}
        
        // Use returnUrl if present (from Canvas Studio redirect), otherwise use redirect from server or default
        let finalRedirectUrl = returnUrl || redirect || APP_ROUTES.HOME
        // Add toast parameter if not already present
        const urlObj = new URL(finalRedirectUrl, window.location.origin)
        if (!urlObj.searchParams.has('toast')) {
          urlObj.searchParams.set('toast', 'LOGIN_SUCCESS')
        }
        finalRedirectUrl = urlObj.toString().replace(window.location.origin, '') || finalRedirectUrl + '?toast=LOGIN_SUCCESS'
        
        console.log("🏠 Redirecting to:", finalRedirectUrl)
        console.log("🔗 Return URL was:", returnUrl)

        await refreshFirebaseIdToken()
        
        // BUG FIX #18: Prevent browser back button after login
        // Replace current history entry to prevent back navigation
        window.history.replaceState(null, '', finalRedirectUrl)
        
        // Use replace instead of href to prevent back button
        window.location.replace(finalRedirectUrl)

      } else {
        console.error("❌ Login failed:", response.data?.message)
        setError(response.data?.message || "Login failed. Please try again.")
      }

    } catch (error: any) {
      console.error("❌ Login error:", error)

      // BUG FIX #17: Handle network interruption gracefully
      if (!navigator.onLine) {
        setError("Network connection lost. Please check your internet connection and try again.")
        setProcessing(false)
        setAuthLoading(false)
        return
      }
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setError("Network error. Please check your connection and try again.")
        setProcessing(false)
        setAuthLoading(false)
        return
      }

      // Prefer detailed validation errors when present
      const validationList = error?.response?.data?.data
      if (Array.isArray(validationList) && validationList.length > 0) {
        const detailedMessage = validationList
          .map((e: any) => e?.msg || e?.message)
          .filter(Boolean)
          .join('\n')
        setError(detailedMessage || 'Please fix the highlighted fields and try again.')
      } else {
        const errorMessage = error.response?.data?.message || 'An error occurred'
        if (errorMessage.includes('already have an account with Google')) {
          setError("This email is registered with Google. Please use the Google sign-in button below.")
        } else if (error.response?.status === 401) {
          setError("Invalid credentials. Please check your email and password.")
        } else if (error.response?.status === 404) {
          setError("User not found. Please check your email.")
        } else if (error.response?.status === 400 && errorMessage === 'Validation failed') {
          setError('Please check your input and try again.')
        } else {
          setError(errorMessage)
        }
      }
    } finally {
      setProcessing(false)
      // If we're redirecting now, keep the overlay via isRedirecting; otherwise hide it
      if (!isRedirecting) setAuthLoading(false)
    }
  }

  // Debug logging on component mount 
  useEffect(() => { 
    console.log("🎯 SignUp Form Component Mounted") 
    console.log("🌐 Current URL:", window.location.href)
    console.log("🔧 Axios configured:", !!axios)
  }, [])


  // API handlers for form flow
  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("🚀 Starting OTP send process...")
    console.log("📧 Email:", email.trim())
    console.log("🔒 Password provided:", !!password)
    console.log("✅ Terms accepted:", termsAccepted)

    if (!termsAccepted) {
      console.log("❌ Terms not accepted")
      setError("Please accept the terms & policy to continue")
      return
    }
    if (password !== confirmPassword) {
      console.log("❌ Password mismatch")
      setError("Password doesn't match")
      return
    }
    if (password.length < 6) {
      console.log("❌ Password too short")
      setError("Password must be at least 6 characters")
      return
    }

    console.log("✅ Validation passed, calling API...")
    setError("")
    setSuccess("")
    setProcessing(true)

    try {
      const requestData = {
        email: email.trim()
      }
      console.log("📤 Sending request to:", "http://localhost:5000/api/auth/email/start")
      console.log("📤 Request data:", requestData)

      // Call backend API to start email OTP
      const response = await axiosInstance.post("/api/auth/email/start", requestData, {
        withCredentials: true // Include cookies
      })

      console.log("📥 Response status:", response.status)
      console.log("📥 Response data:", response.data)
      console.log("📥 Response headers:", response.headers)

      // Check the nested response structure from your backend
      if (response.data && response.data.data && response.data.data.sent) {
        console.log("✅ OTP sent successfully!")
        setOtpSent(true)
        toast.success(`OTP sent to ${email.trim()}`)
        setError("")
        setSuccess(`OTP sent to ${email.trim()}`)
      } else {
        console.log("❌ OTP not sent - checking response structure:")
        console.log("❌ response.data:", response.data)
        console.log("❌ response.data.data:", response.data?.data)
        console.log("❌ response.data.data.sent:", response.data?.data?.sent)
        setError("Failed to send OTP. Please try again.")
      }
    } catch (error: any) {
      console.error("❌ OTP sending error details:")
      console.error("Error object:", error)
      console.error("Error message:", error.message)
      console.error("Error response:", error.response)
      console.error("Error status:", error.response?.status)
      console.error("Error data:", error.response?.data)

      const errorMessage = error.response?.data?.message || 'An error occurred'

      if (errorMessage.includes('already have an account with Google')) {
        setError("This email is registered with Google. Please use the Google sign-in button below.")
      } else if (errorMessage.includes('Account already exists')) {
        setError("Account already exists. Please use sign-in instead.")
      } else {
        // Handle other errors normally
        setError(errorMessage)
      }
    } finally {
      console.log("🏁 OTP send process completed")
      setProcessing(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("🔍 Starting OTP verification process...")
    console.log("📧 Email:", email.trim())
    console.log("🔢 OTP entered:", otp.trim())
    console.log("🔒 Password:", password ? "***" : "empty")

    setError("")
    setSuccess("")
    setProcessing(true)

    try {
      const requestData = {
        email: email.trim(),
        code: otp.trim(), // Backend expects 'code' field, not 'otp'
        password: password
      }
      console.log("📤 Sending verification request to:", "http://localhost:5000/api/auth/email/verify")
      console.log("📤 Request data:", requestData)

      // Call backend API to verify OTP and create user
      const response = await axiosInstance.post("/api/auth/email/verify", requestData, {
        withCredentials: true // Include cookies
      })

      console.log("📥 Verification response status:", response.status)
      console.log("📥 Verification response data:", response.data)
      console.log("📥 Verification response headers:", response.headers)

      if (response.data) {
        console.log("✅ OTP verification successful!")
        console.log("🔍 Full response data:", JSON.stringify(response.data, null, 2))

        // Get custom token from backend response
        const customToken = response.data.customToken || response.data.data?.customToken || response.data.token || response.data.data?.token || response.data.idToken || response.data.data?.idToken

        if (customToken) {
          console.log("🔑 Custom token received from backend")
          console.log("🔑 Custom token length:", customToken.length)
          console.log("🔑 Custom token preview:", customToken.substring(0, 50))

          try {
            // CRITICAL: Convert custom token to ID token using Firebase
            console.log("🔄 Converting custom token to ID token using Firebase...")
            console.log("🔍 Firebase auth config:", {
              apiKey: auth.app.options.apiKey,
              projectId: auth.app.options.projectId,
              authDomain: auth.app.options.authDomain
            })
            console.log("🔑 Custom token preview:", customToken.substring(0, 100))

            const userCredential = await signInWithCustomToken(auth, customToken)
            const actualIdToken = await userCredential.user.getIdToken()

            console.log("✅ ID token obtained!")
            console.log("🔑 ID token length:", actualIdToken.length)
            console.log("🔑 Token type comparison:")
            console.log("   Custom token starts with:", customToken.substring(0, 20))
            console.log("   ID token starts with:", actualIdToken.substring(0, 20))

            // Create session with the REAL ID token
            console.log("🔄 [SESSION] Creating session with backend using ID token...")
            console.log("🔄 [SESSION] ID token details:", {
              length: actualIdToken.length,
              prefix: actualIdToken.substring(0, 30),
              suffix: actualIdToken.substring(actualIdToken.length - 20),
              timestamp: new Date().toISOString()
            });
            const backendBaseForSession = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
            console.log("🔄 [SESSION] Backend base URL:", backendBaseForSession);
            console.log("🔄 [SESSION] Full session URL:", `${backendBaseForSession}/api/auth/session`);
            
            // Create session directly with backend
            const sessionResponse = await fetch(`${backendBaseForSession}/api/auth/session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ idToken: actualIdToken })
            })

            console.log("🔄 [SESSION] Session response:", {
              status: sessionResponse.status,
              statusText: sessionResponse.statusText,
              ok: sessionResponse.ok,
              headers: Object.fromEntries(sessionResponse.headers.entries())
            });

            if (sessionResponse.status === 200) {
              const sessionData = await sessionResponse.json().catch(() => ({}));
              console.log("✅ [SESSION] Session created with ID token!", {
                responseData: sessionData,
                cookies: document.cookie
              });
              console.log("🍪 [SESSION] Cookies after session creation:", document.cookie)
              await refreshFirebaseIdToken()

              // Test /api/me immediately to verify it works
              try {
                console.log("🧪 Testing /api/auth/me immediately...")
                const meResponse = await axiosInstance.get('/api/auth/me', {
                  withCredentials: true
                })
                console.log("✅ /api/auth/me SUCCESS:", meResponse.data)
              } catch (meError: any) {
                console.error("❌ /api/auth/me still fails:", meError.response?.data)
              }

              // Store user profile only; rely on httpOnly cookie for auth
              const createdUser = response.data?.data?.user || response.data?.user || response.data
              localStorage.setItem("user", JSON.stringify(createdUser))
              try { localStorage.setItem('authToken', actualIdToken) } catch {}
              setShowUsernameForm(true)
              setOtp("")
              setOtpSent(false)
              setError("")
            } else {
              const errorData = await sessionResponse.json().catch(() => ({}));
              console.error("❌ [SESSION] Session creation failed:", {
                status: sessionResponse.status,
                statusText: sessionResponse.statusText,
                errorData: errorData,
                responseText: await sessionResponse.text().catch(() => '')
              });
            }
          } catch (conversionError: any) {
            console.error("❌ Token conversion error:", conversionError)
            setError("Authentication failed. Please try again.")
            toast.error('Authentication failed. Please try again.')
          }
        } else {
          console.error("❌ No custom token found in response")
          setError("Authentication failed. Please try again.")
          toast.error('Authentication failed. Please try again.')
        }
      }
    } catch (error: any) {
      console.error("❌ OTP verification error details:")
      console.error("Error object:", error)
      console.error("Error message:", error.message)
      console.error("Error response:", error.response)
      console.error("Error status:", error.response?.status)
      console.error("Error data:", error.response?.data)
      console.error("Error config:", error.config)

      if (error.response?.data?.data && Array.isArray(error.response.data.data)) {
        // Handle validation errors from backend
        const validationErrors = error.response.data.data
        const errorMessages = validationErrors.map((err: any) => err.msg).join(', ')
        console.log("📝 Setting validation errors:", errorMessages)
        setError(errorMessages)
      } else if (error.response?.data?.message) {
        console.log("📝 Setting error from response:", error.response.data.message)
        setError(error.response.data.message)
      } else if (error.response?.data?.error) {
        console.log("📝 Setting error from response.error:", error.response.data.error)
        setError(error.response.data.error)
      } else {
        console.log("📝 Setting generic error message")
        setError("Invalid OTP or expired. Please try again.")
      }
    } finally {
      console.log("🏁 OTP verification process completed")
      setProcessing(false)
    }
  }

  const handleResendOtp = async () => {
    console.log("🔄 Starting OTP resend process...")
    console.log("📧 Email for resend:", email.trim())

    setProcessing(true)
    setError("")

    try {
      const requestData = {
        email: email.trim()
      }
      console.log("📤 Resending OTP to:", "http://localhost:5000/api/auth/email/start")
      console.log("📤 Resend request data:", requestData)

      // Call backend API to resend OTP
      const response = await axios.post("http://localhost:5000/api/auth/email/start", requestData, {
        withCredentials: true // Include cookies
      })

      console.log("📥 Resend response status:", response.status)
      console.log("📥 Resend response data:", response.data)

      if (response.data && response.data.data && response.data.data.sent) {
        console.log("✅ OTP resent successfully!")
        setError("")
        setSuccess(`OTP resent to ${email.trim()}`)
      } else {
        console.log("❌ OTP not resent - checking response structure:")
        console.log("❌ response.data:", response.data)
        console.log("❌ response.data.data:", response.data?.data)
        console.log("❌ response.data.data.sent:", response.data?.data?.sent)
        setError("Failed to resend OTP. Please try again.")
      }
    } catch (error: any) {
      console.error("❌ Resend OTP error details:")
      console.error("Resend error:", error)
      console.error("Resend error response:", error.response)
      console.error("Resend error data:", error.response?.data)

      if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError("Failed to resend OTP. Please try again.")
      }
    } finally {
      console.log("🏁 OTP resend process completed")
      setProcessing(false)
    }
  }

  const handleGoogleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // BUG FIX #5: Prevent race condition - block if already processing
    if (processing || authLoading) {
      console.log("⚠️ Login already in progress, ignoring duplicate request")
      return
    }

    console.log("🔵 Starting Google sign-in...")
    console.log("📋 Current form state - showLoginForm:", showLoginForm)

  setProcessing(true)
  setAuthLoading(true)
    setError("")
    setSuccess("")

    try {
      // Create Google Auth Provider
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')

      console.log("🔄 Launching Google OAuth popup...")

      // Step 1: Sign in with Google popup
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      console.log("✅ Google popup successful!")
      console.log("👤 Google user:", user.email)

      // Step 2: Get Firebase ID token
      const idToken = await user.getIdToken()
      console.log("🔑 Firebase ID token obtained")

      // Step 3: Send to backend
      console.log("📤 Sending to backend /api/auth/google via same-origin proxy")
      const response = await axiosInstance.post(`/api/auth/google`, {
        idToken: idToken
      }, {
        withCredentials: true
      })

      console.log("📥 Backend response:", response.data)

      if (response.data?.data) {
        const { user: userData, needsUsername, customToken: sessionToken, idToken: legacyIdToken, redirect } = response.data.data
        const sessionTokenResolved = sessionToken || legacyIdToken


        if (needsUsername) {
          console.log("📝 New user needs username")
          // Store user data temporarily
          sessionStorage.setItem("tempGoogleUser", JSON.stringify(userData))
          setSuccess("Google account connected! Please choose a username.")
          toast.success('Google account connected! Choose a username')
          setShowUsernameForm(true)
          setAuthLoading(false)

        } else {
          console.log("✅ Existing user, logging in...")

          // Convert custom token to ID token and create session
          const userCredential = await signInWithCustomToken(auth, sessionTokenResolved)
          const finalIdToken = await userCredential.user.getIdToken()

          // Create session
          console.log("🔄 [SESSION] Creating session for existing Google user...");
          console.log("🔄 [SESSION] ID token details:", {
            length: finalIdToken.length,
            prefix: finalIdToken.substring(0, 30),
            suffix: finalIdToken.substring(finalIdToken.length - 20),
            timestamp: new Date().toISOString()
          });
          const backendBaseForSession = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '')
          console.log("🔄 [SESSION] Using Next.js API route:", '/api/auth/session');
          // Use Next.js API route for session creation to avoid cross-domain cookie issues
          const resp = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken: finalIdToken })
          })
          
          console.log("🔄 [SESSION] Session response:", {
            status: resp.status,
            statusText: resp.statusText,
            ok: resp.ok,
            headers: Object.fromEntries(resp.headers.entries())
          });
          
          if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            console.error("❌ [SESSION] Session creation failed for existing Google user:", {
              status: resp.status,
              statusText: resp.statusText,
              errorData: errorData,
              responseText: await resp.text().catch(() => '')
            });
          } else {
            const sessionData = await resp.json().catch(() => ({}));
            console.log("✅ [SESSION] Session created successfully for existing Google user!", {
              responseData: sessionData,
              cookies: document.cookie
            });
            await refreshFirebaseIdToken();
          }
          // BUG FIX #2: Clear all auth data before setting new to prevent cross-account confusion
          try {
            const { clearAuthData } = await import('@/lib/authUtils');
            clearAuthData();
          } catch (e) {
            console.warn('Failed to clear auth data:', e);
            // Fallback: manually clear critical items
            try {
              localStorage.removeItem('user');
              localStorage.removeItem('authToken');
              sessionStorage.removeItem('me_cache');
            } catch {}
          }

          try { if (resp?.ok) { localStorage.setItem('authToken', finalIdToken) } } catch {}

          console.log("✅ Session created, redirecting...")
          // Defer toast to Home page: mark a flag so Home shows a success message after redirect
          try { localStorage.setItem('toastMessage', 'LOGIN_SUCCESS') } catch {}

          // Store user profile only; rely on httpOnly cookie for auth
          localStorage.setItem("user", JSON.stringify(userData))
          try { localStorage.setItem('authToken', finalIdToken) } catch {}
          setIsRedirecting(true)

          // Use returnUrl if present (from Canvas Studio redirect), otherwise use redirect from server or default
          const finalRedirectUrl = returnUrl || redirect || APP_ROUTES.HOME
          console.log("🏠 Google login redirecting to:", finalRedirectUrl)
          console.log("🔗 Return URL was:", returnUrl)

          // BUG FIX #18: Prevent browser back button after login
          window.history.replaceState(null, '', finalRedirectUrl)
          
          setTimeout(() => {
            window.location.replace(finalRedirectUrl)
          }, 2000)
        }
      }

    } catch (error: any) {
      console.error("❌ Google sign-in failed:", error)

      const errorMessage = error.response?.data?.message || 'An error occurred'

      if (errorMessage.includes('already have an account with email/password')) {
        setError("This email is registered with email/password. Please use the regular sign-in form above.")
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError("Google sign-in was cancelled.")
      } else if (error.code === 'auth/popup-blocked') {
        setError("Google sign-in popup was blocked. Please allow popups and try again.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setProcessing(false)
      if (!isRedirecting) setAuthLoading(false)
    }
  }

  const handleUsernameSubmit = async () => {
    console.log("👤 Starting username submission process...")
    console.log("👤 Username entered:", username.trim())

    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_.-]{3,30}$/
    if (!usernameRegex.test(username.trim())) {
      setError("Username must be 3-30 characters, lowercase letters, numbers, dots, underscores, and hyphens only")
      return
    }

    setError("")
    setProcessing(true)
    setIsUsernameSubmitting(true)

    try {
      // Check if this is a Google user
      const tempUserData = sessionStorage.getItem("tempGoogleUser")
      console.log("💾 Temporary Google user data:", tempUserData)

      if (tempUserData) {
        // This is a Google username submission
        const userData = JSON.parse(tempUserData)
        console.log("👤 Google user object:", userData)

        // Send username to backend via same-origin proxy
        const response = await axiosInstance.post(`/api/auth/google/username`, {
          uid: userData.uid,
          username: username.trim()
        }, {
          withCredentials: true
        })

        console.log("📥 Google username response:", response.data)

        if (response.data?.data) {
          const { customToken: sessionToken, idToken: legacyIdToken, redirect } = response.data.data
          const sessionTokenResolved = sessionToken || legacyIdToken

          console.log("✅ Username set successfully!")

          // Convert custom token and create session
          const userCredential = await signInWithCustomToken(auth, sessionTokenResolved)
          const finalIdToken = await userCredential.user.getIdToken()

          console.log("🔄 [SESSION] Creating session after Google username set...");
          console.log("🔄 [SESSION] ID token details:", {
            length: finalIdToken.length,
            prefix: finalIdToken.substring(0, 30),
            suffix: finalIdToken.substring(finalIdToken.length - 20),
            timestamp: new Date().toISOString()
          });
          
          let sessionResponse;
          try {
            sessionResponse = await (axiosInstance || getApiClient()).post('/api/auth/session',
              { idToken: finalIdToken },
              { withCredentials: true }
            );
            console.log("✅ [SESSION] Session created successfully after Google username set!", {
              status: sessionResponse.status,
              statusText: sessionResponse.statusText,
              data: sessionResponse.data,
              cookies: document.cookie
            });
            await refreshFirebaseIdToken();
          } catch (sessionError: any) {
            console.error("❌ [SESSION] Session creation failed after Google username set:", {
              message: sessionError?.message,
              response: sessionError?.response?.data,
              status: sessionError?.response?.status,
              statusText: sessionError?.response?.statusText,
              error: sessionError
            });
            throw sessionError;
          }

          // Clear temporary data
          sessionStorage.removeItem("tempGoogleUser")

          // Store final user data
          const finalUserData = {
            ...userData,
            username: username.trim()
          }
          localStorage.setItem("user", JSON.stringify(finalUserData))

          console.log("✅ Google authentication complete!")
          setShowUsernameForm(false)
          setShowRedeemCodeForm(true)
          setSuccess("Account created successfully! You can now apply a redeem code to get additional credits or continue with the free plan.")
          toast.success('Account created successfully')
        }

      } else {
        // This is a regular email/password sign-up flow
        console.log("🔄 Processing regular email sign-up username submission")

        // Get the user data from localStorage
        const userData = localStorage.getItem("user")
        console.log("💾 User data from localStorage:", userData)

        if (userData) {
          const user = JSON.parse(userData)
          console.log("👤 Parsed user object:", user)

          const requestData = {
            username: username.trim(),
            email: email
          }
          console.log("📤 Sending username request to:", "http://localhost:5000/api/auth/email/username")
          console.log("📤 Request data:", requestData)

          // Set username for the user
          const response = await axiosInstance.post("/api/auth/email/username", requestData, {
            withCredentials: true // Include cookies
          })

          console.log("📥 Username response status:", response.status)
          console.log("📥 Username response data:", response.data)
          console.log("📥 Username response headers:", response.headers)

          if (response.data) {
            console.log("✅ Username updated successfully:", username)
            console.log("🔍 Username response data:", JSON.stringify(response.data, null, 2))

            // Get custom token from backend response
            const customToken = response.data.token || response.data.data?.token || response.data.idToken || response.data.data?.idToken

            if (customToken) {
              console.log("🔑 Custom token received after username creation")
              console.log("🔑 Custom token length:", customToken.length)

              try {
                // Convert custom token to ID token
                console.log("🔄 Converting custom token to ID token...")
                console.log("🔍 Firebase auth config:", {
                  apiKey: auth.app.options.apiKey,
                  projectId: auth.app.options.projectId,
                  authDomain: auth.app.options.authDomain
                })
                console.log("🔑 Custom token preview:", customToken.substring(0, 100))

                const userCredential = await signInWithCustomToken(auth, customToken)
                const actualIdToken = await userCredential.user.getIdToken()

                console.log("✅ ID token obtained after username creation!")
                console.log("🔑 ID token length:", actualIdToken.length)

                // Create session with the REAL ID token
                console.log("🔄 [SESSION] Creating session with backend using ID token after username creation...")
                console.log("🔄 [SESSION] ID token details:", {
                  length: actualIdToken.length,
                  prefix: actualIdToken.substring(0, 30),
                  suffix: actualIdToken.substring(actualIdToken.length - 20),
                  timestamp: new Date().toISOString()
                });
            // Use Next.js API route for session creation to avoid cross-domain cookie issues
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ idToken: actualIdToken })
            })
            
            console.log("🔄 [SESSION] Session response:", {
              status: sessionResponse.status,
              statusText: sessionResponse.statusText,
              ok: sessionResponse.ok,
              headers: Object.fromEntries(sessionResponse.headers.entries())
            });

                if (sessionResponse.status === 200) {
                  const sessionData = await sessionResponse.json().catch(() => ({}));
                  console.log("✅ [SESSION] Session created with ID token after username creation!", {
                    responseData: sessionData,
                    cookies: document.cookie
                  });
                  console.log("🍪 [SESSION] Cookies after session creation:", document.cookie)
                  await refreshFirebaseIdToken();

                  // Test /api/me immediately to verify it works
                  try {
                    console.log("🧪 Testing /api/auth/me after username creation...")
                    const meResponse = await axiosInstance.get('/api/auth/me', {
                      withCredentials: true
                    })
                    console.log("✅ /api/auth/me SUCCESS after username:", meResponse.data)
                  } catch (meError: any) {
                    console.error("❌ /api/auth/me still fails:", meError.response?.data)
                  }

                  // Store user data in localStorage for Nav component
                  const userData = {
                    uid: response.data.uid || response.data.data?.uid,
                    email: email,
                    username: username.trim(),
                    token: actualIdToken,
                    idToken: actualIdToken
                  }
                  localStorage.setItem("user", JSON.stringify(userData))
                  localStorage.setItem("authToken", actualIdToken || "")
                } else {
                  const errorData = await sessionResponse.json().catch(() => ({}));
                  console.error("❌ [SESSION] Session creation failed after username creation:", {
                    status: sessionResponse.status,
                    statusText: sessionResponse.statusText,
                    errorData: errorData,
                    responseText: await sessionResponse.text().catch(() => '')
                  });
                }
              } catch (conversionError: any) {
                console.error("❌ Token conversion error:", conversionError)
              }
            }

            // Clear form data
            setEmail("")
            setPassword("")
            setConfirmPassword("")
            setUsername("")
            setShowUsernameForm(false)
            setOtpSent(false)
            setTermsAccepted(false)
            setError("")

            // Show redeem code form
            setShowRedeemCodeForm(true)
            setSuccess("Account created successfully! You can now apply a redeem code to get additional credits or continue with the free plan.")
          }
        } else {
          console.log("❌ No user data found in localStorage")
          setError("User data not found. Please try the sign-up process again.")
        }
      }

    } catch (error: any) {
      console.error("❌ Username submission error details:")
      console.error("Error object:", error)
      console.error("Error message:", error.message)
      console.error("Error response:", error.response)
      console.error("Error status:", error.response?.status)
      console.error("Error data:", error.response?.data)
      console.error("Error config:", error.config)

      if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else if (error.response?.status === 400) {
        setError("Username already taken. Please choose another.")
      } else {
        setError("Failed to set username. Please try again.")
      }
    } finally {
      console.log("🏁 Username submission process completed")
      setProcessing(false)
      setIsUsernameSubmitting(false)
    }
  }

  // Redeem Code Functions
  const handleRedeemCodeValidation = async () => {
    if (!redeemCode.trim()) {
      setError("Please enter a redeem code")
      return
    }

    setError("")
    setProcessing(true)

    try {
      const response = await axiosInstance.post("/api/redeem-codes/validate", {
        redeemCode: redeemCode.trim().toUpperCase()
      })

      if (response.data?.data?.valid) {
        setRedeemCodeValidated(true)
        setRedeemCodeInfo(response.data.data)
        const timeInfo = response.data.data.remainingTime ? ` (expires in ${response.data.data.remainingTime})` : ''
        setSuccess(`✓ Valid ${response.data.data.planName}! You'll get ${response.data.data.creditsToGrant.toLocaleString()} credits when you apply this code${timeInfo}.`)
      } else {
        setError(response.data?.data?.error || "Invalid redeem code")
        setRedeemCodeValidated(false)
        setRedeemCodeInfo(null)
      }
    } catch (error: any) {
      console.error("❌ Redeem code validation failed:", error)
      setError(error.response?.data?.message || "Failed to validate redeem code")
      setRedeemCodeValidated(false)
      setRedeemCodeInfo(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleRedeemCodeSubmit = async () => {
    if (!redeemCodeValidated) {
      setError("Please validate your redeem code first")
      return
    }

    setError("")
    setProcessing(true)

    try {
      const response = await axiosInstance.post("/api/auth/redeem-code/apply", {
        redeemCode: redeemCode.trim().toUpperCase()
      }, {
        withCredentials: true
      })

      if (response.data?.responseStatus === 'success') {
        setSuccess(`🎉 ${response.data.data.planName} activated! You received ${response.data.data.creditsGranted.toLocaleString()} credits.`)

        // Redirect to home after successful redeem
        setTimeout(() => {
          setIsRedirecting(true)
          setShowRedeemCodeForm(false)
          // BUG FIX #18: Prevent browser back button
          window.history.replaceState(null, '', APP_ROUTES.HOME)
          window.location.replace(APP_ROUTES.HOME)
        }, 2000)
      } else {
        setError(response.data?.message || "Failed to apply redeem code")
      }
    } catch (error: any) {
      console.error("❌ Redeem code application failed:", error)
      setError(error.response?.data?.message || "Failed to apply redeem code")
    } finally {
      setProcessing(false)
    }
  }

  const handleSkipRedeemCode = () => {
    setIsRedirecting(true)
    setShowRedeemCodeForm(false)
    setTimeout(() => {
      window.location.href = APP_ROUTES.HOME
    }, 1000)
  }


  return (
    <div className="w-full h-full flex flex-col px-4 sm:px-6 md:px-10 lg:px-auto bg-[#1E1E1E] relative overflow-x-hidden">
      {(authLoading || isRedirecting) && (
        <LoadingScreen message={isRedirecting ? 'Redirecting…' : 'Signing you in…'} subMessage={isRedirecting ? 'Just a moment while we finish up' : undefined} />
      )}
      <div className="flex items-center mt-4 md:mt-8 mb-4">
        <Image
          src={getImageUrl('core', 'logo')}
          alt="WildMind Logo"
          width={120}
          height={40}
          className="h-8 md:h-10 w-auto"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-l from-gray-900/90 via-transparent to-transparent pointer-events-none"></div>


      {/* Header with WildMind Logo - Top Left */}


      {/* Form Content - No scrolling */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-lg space-y-4 md:space-y-6 px-1 sm:px-0">
          {/* Welcome Section - Only show when not on OTP screen, username screen, or login screen */}
          {!otpSent && !showUsernameForm && !showLoginForm && (
            <div className="text-start space-y-2 mb-4">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-semibold text-white">Welcome to WildMind!</h1>
              <p className="text-white text-sm md:text-base font-light">Sign up to access the platform.</p>
            </div>
          )}

          {showUsernameForm ? (
            <div className="space-y-2 md:space-y-2 mb:space-y-4 lg:space-y-4">
              {/* Title */}
              <div className="text-start space-y-2 mb-4">
                <h1 className="text-xl md:text-2xl lg:text-4xl font-semibold text-white">Verification Successful!</h1>
                <p className="text-white text-sm md:text-base font-light">Last step, Make a Unique Username</p>
              </div>

              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-white font-medium text-base md:text-lg">Enter User Name</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 md:px-6 py-2 mt-2 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-base md:text-lg"
                  required
                />
                {/* Capital letters validation */}
                {hasCapitalLetters && (
                  <div className="rounded-xl p-2 bg-red-500/20 border border-red-500/25">
                    <p className="text-white text-xs">Capital letters are not allowed in usernames. Please use lowercase letters only.</p>
                  </div>
                )}

                {/* Live availability feedback - only show if no capital letters */}
                {!hasCapitalLetters && (
                  <UsernameAvailabilityFeedback
                    status={availability.status}
                    result={availability.result}
                    error={availability.error}
                    onSuggestion={setUsername}
                  />
                )}
              </div>

              {/* Access WildMind Button */}
              <button
                onClick={handleUsernameSubmit}
                disabled={!availability.isAvailable || hasCapitalLetters || isUsernameSubmitting}
                className="w-full bg-[#1C303D] hover:bg-[#3367D6] disabled:bg-[#3A3A3A] disabled:text-[#9B9B9B] py-2 rounded-full font-semibold text-base md:text-lg text-white transition-all duration-200"
              >
                {isUsernameSubmitting ? <LoadingSpinner /> : "Access WildMind"}
              </button>
            </div>
          ) : showRedeemCodeForm ? (
            <div className="space-y-4">
              {/* Title */}
              <div className="text-start space-y-2 mb-4">
                <h1 className="text-xl md:text-4xl font-semibold text-white">Almost There!</h1>
                <p className="text-white text-sm md:text-base font-light">Do you have a redeem code? Apply it now to get additional credits, or continue with the free plan.</p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="rounded-xl p-4 bg-emerald-500/20 border border-emerald-500/25">
                  <p className="text-white text-base leading-relaxed">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-xl p-4 bg-red-500/20 border border-red-500/25">
                  <p className="text-white text-base leading-relaxed">{error}</p>
                </div>
              )}

              {/* Redeem Code Input */}
              <div className="space-y-1">
                <label className="text-white font-medium text-lg">
                  Redeem Code <span className="text-gray-400 text-base">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your redeem code (e.g., STU-123456-ABC123)"
                  value={redeemCode}
                  onChange={(e) => {
                    setRedeemCode(e.target.value.toUpperCase())
                    setRedeemCodeValidated(false)
                    setRedeemCodeInfo(null)
                    setError("")
                    setSuccess("")
                  }}
                  className="w-full px-6 py-2 mt-2 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-lg uppercase"
                />

                {/* Validation feedback */}
                {redeemCodeInfo && redeemCodeValidated && (
                  <div className="text-sm text-green-400 ml-2 flex items-center space-x-2">
                    <span>✓</span>
                    <span>
                      Valid {redeemCodeInfo.planName} - You'll get {redeemCodeInfo.creditsToGrant.toLocaleString()} credits!
                      {redeemCodeInfo.remainingTime && (
                        <span className="text-green-300 ml-1">(expires in {redeemCodeInfo.remainingTime})</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Help text */}
                <div className="text-xs text-gray-400 ml-2">
                  Student codes start with "STU-" and Business codes start with "BUS-"
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-4 mt-6">
                {/* Validate/Apply Code Button */}
                {redeemCode && !redeemCodeValidated ? (
                  <button
                    onClick={handleRedeemCodeValidation}
                    disabled={processing || !redeemCode.trim()}
                    className="w-full bg-[#1C303D] hover:bg-[#3367D6] disabled:bg-[#3A3A3A] disabled:text-[#9B9B9B] py-2 rounded-full font-semibold text-lg text-white transition-all duration-200"
                  >
                    {processing ? <LoadingSpinner /> : "Validate Code"}
                  </button>
                ) : redeemCodeValidated ? (
                  <button
                    onClick={handleRedeemCodeSubmit}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-[#3A3A3A] disabled:text-[#9B9B9B] py-2 rounded-full font-semibold text-lg text-white transition-all duration-200"
                  >
                    {processing ? <LoadingSpinner /> : "Apply Redeem Code"}
                  </button>
                ) : null}

                {/* Skip Button */}
                <button
                  onClick={handleSkipRedeemCode}
                  disabled={processing}
                  className="w-full bg-[#2e2e2e] hover:bg-[#3e3e3e] border border-[#464646] py-2 rounded-full font-semibold text-lg text-white transition-all duration-200"
                >
                  Continue with Free Plan
                </button>

                {/* Info about free plan */}
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Free plan includes 4,120 credits to get you started
                  </p>
                </div>
              </div>
            </div>
          ) : showLoginForm ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Title */}
              <div className="text-start space-y-2 mb-4">
                <h1 className="text-4xl font-semibold text-white">Welcome back!</h1>
                <p className="text-white text-base font-light">Enter your Credentials to access your account.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl p-4 bg-red-500/20 border border-red-500/25">
                  <p className="text-white text-base leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success Message or Redirect Spinner */}
              {isRedirecting ? (
                <RedirectSpinner />
              ) : success && (
                <div className="rounded-xl p-4 bg-emerald-500/20 border border-emerald-500/25">
                  <p className="text-white text-base leading-relaxed">{success}</p>
                </div>
              )}

              {/* Email/Username Input */}
              <div className="space-y-1">
                <label className="text-white font-medium text-lg">Email address / User Name</label>
                <input
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full px-6 py-2 mt-2 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-lg"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-white font-medium text-lg">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-6 py-2 mt-2 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-lg"
                  required
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center mt-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 text-[#5AD7FF] bg-[#2e2e2e] border-[#464646] rounded focus:ring-[#5AD7FF] focus:ring-2"
                  />
                  <label htmlFor="remember" className="text-base text-[#A0A0A0]">
                    Remember for 30 days
                  </label>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-[#1C303D] hover:bg-[#3367D6] disabled:bg-[#464646] py-2 rounded-full font-semibold text-lg text-white transition-all duration-200"
              >
                {processing ? "Logging in..." : "Login"}
              </button>

              {/* Separator */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-grow h-px bg-[#464646]"></div>
                <span className="text-[#A0A0A0] text-base">Or</span>
                <div className="flex-grow h-px bg-[#464646]"></div>
              </div>

              {/* Social Login Button */}
              <div className="mb-8">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-[#1a1a1a] text-white font-medium py-4 px-6 rounded-full border border-[#464646] hover:bg-[#2a2a2a] transition-all duration-200 flex items-center justify-center gap-4"
                >
                  <Image src={getImageUrl('core', 'google')} alt="Google" width={24} height={24} className="w-6 h-6" />
                  <span className="text-base">{showLoginForm ? "Sign in with Google" : "Sign up with Google"}</span>
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center mb-10">
                <span className="text-[#A0A0A0] text-base">Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="text-[#4285F4] underline cursor-pointer text-base font-medium"
                >
                  Sign Up
                </button>
              </div>
            </form>
          ) : otpSent ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Title */}
              <div className="text-start space-y-2 mb-4">
                <h1 className="text-xl md:text-4xl font-semibold text-white">Verify code</h1>
                <p className="text-white text-sm md:text-base font-light">An authentication code has been sent to your email.</p>
              </div>

              {/* Code Input */}
              <div className="space-y-1">
                <label className="text-white font-medium text-base md:text-lg">Enter Code</label>
                <input
                  type="text"
                  placeholder="Enter your Code"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setOtp(value)
                  }}
                  className="w-full px-4 md:px-6 py-2 mt-2 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-base md:text-lg"
                  required
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={processing || otp.length < 4}
                className={`w-full py-2 rounded-full font-semibold text-base md:text-lg transition-all duration-200 ${processing || otp.length < 4
                    ? "bg-[#3A3A3A] text-[#9B9B9B] cursor-not-allowed"
                    : "bg-[#1C303D] hover:bg-[#3367D6] text-white"
                  }`}
              >
                {processing ? "Verifying..." : "Verify"}
              </button>

              {/* Resend Link */}
              <div className="text-center mt-6">
                <span className="text-[#A0A0A0] text-sm md:text-base">Not receive email? </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#4285F4] underline cursor-pointer text-sm md:text-base font-medium"
                >
                  Resend
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl p-4 bg-red-500/20 border border-red-500/25">
                  <p className="text-white text-base text-center leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success Message or Redirect Spinner */}
              {isRedirecting ? (
                <RedirectSpinner />
              ) : success && (
                <div className="rounded-xl p-4 bg-emerald-500/20 border border-emerald-500/25">
                  <p className="text-white text-base text-center leading-relaxed">{success}</p>
                </div>
              )}
            </form>
          ) : (
            <>
              {/* Email Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-0.5">
                  <label className="text-white font-medium text-sm md:text-base">Email address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    autoComplete="email"
                    className="w-full px-4 md:px-6 py-2 md:py-1.5 mt-1 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-base md:text-lg"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-white font-medium text-sm md:text-base">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 md:px-6 py-2 md:py-1.5 mt-1 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-base md:text-lg"
                    required
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1">
                  <label className="text-white font-medium text-sm md:text-base">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 md:px-6 py-2 md:py-1.5 mt-1 bg-[#171717] border border-[#464646] placeholder-[#9094A6] focus:outline-none focus:border-[#5AD7FF] rounded-full text-white text-base md:text-lg"
                    required
                  />
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-3 mt-4">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#5AD7FF] bg-[#2e2e2e] border-[#464646] rounded focus:ring-[#5AD7FF] focus:ring-2"
                  />
                  <label htmlFor="terms" className="text-sm md:text-base text-[#A0A0A0]">
                    I agree to the{" "}
                    <span className="text-[#5AD7FF] underline cursor-pointer text-sm md:text-base">terms & policy</span>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl p-4 bg-red-500/20 border border-red-500/25">
                    <p className="text-white text-base leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing || !termsAccepted}
                  className={`w-full mx-auto py-2 rounded-full font-semibold text-base md:text-lg transition-all duration-200 ${processing || !termsAccepted
                      ? "bg-[#3A3A3A] text-[#9B9B9B] cursor-not-allowed"
                      : "bg-[#1C303D] hover:bg-[#3367D6] text-white"
                    }`}
                >
                  {processing ? "Sending..." : "Sign Up"}
                </button>
              </form>

              {/* Separator */}
              <div className="flex items-center gap-4 my-6 md:my-8">
                <div className="flex-grow h-px bg-[#464646]"></div>
                <span className="text-[#A0A0A0] text-sm md:text-base">Or</span>
                <div className="flex-grow h-px bg-[#464646]"></div>
              </div>

              {/* Social Login Button */}
              <div className="mb-6 md:mb-8">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-[#1a1a1a] text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-full border border-[#464646] hover:bg-[#2a2a2a] transition-all duration-200 flex items-center justify-center gap-3 md:gap-4"
                >
                  <Image src={getImageUrl('core', 'google')} alt="Google" width={24} height={24} className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-sm md:text-base">{showLoginForm ? "Sign in with Google" : "Sign up with Google"}</span>
                </button>
              </div>

              {/* Already have an account link */}
              <div className="text-center mb-8 md:mb-10">
                <span className="text-[#A0A0A0] text-sm md:text-base">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(true)}
                  className="text-[#4285F4] underline cursor-pointer text-sm md:text-base font-medium"
                >
                  Sign In
                </button>
              </div>


            </>
          )}
        </div>
      </div>

      {/* Separator for visual break */}
      <div className="h-2"></div>

      {/* Footer - Only show when not on OTP screen, username screen, or login screen */}
      {!otpSent && !showUsernameForm && !showLoginForm && (
        <div className="text-center text-xs text-[#A0A0A0] space-y-2 md:space-y-3 pb-6 md:pb-10">
          <p>By Continuing, you agree to WildMind&apos;s</p>
          <p>
            <span className="text-[#4285F4] ">Terms of Use</span> and{" "}
            <span className="text-[#4285F4] ">Privacy Policy</span>.
          </p>
        </div>
      )}

      {/* Debug: Test Cookie Button - Always visible for debugging */}
      {/* <div className="text-center mb-4">
        <button
          type="button"
          onClick={testCookieSetting}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-lg border-2 border-red-400"
        >
          🧪 Test Cookie Setting (Debug)
        </button>
        <p className="text-xs text-gray-400 mt-1">Click to test if cookies work in this browser</p>
      </div> */}

      {/* Cookies Settings - Individual Div - Only show when not on OTP screen, username screen, or login screen */}
      {/* {!otpSent && !showUsernameForm && !showLoginForm && (
        <div className="text-center mb-12">
          <span className="text-[#4285F4] text-xs">Cookies Settings</span>
        </div>
      )} */}
    </div>
  )
}

function UsernameAvailabilityFeedback({ status, result, error, onSuggestion }: { status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'; result: any; error: string | null; onSuggestion: (v: string) => void }) {

  if (status === 'idle') return null
  if (status === 'invalid') {
    return (
      <div className="rounded-xl p-2 bg-amber-500/20 border border-amber-500/25">
        <p className="text-white text-xs">Use 3-30 chars: a-z 0-9 _ . -</p>
      </div>
    )
  }
  if (status === 'checking') {
    return (
      <div className="rounded-xl p-2 bg-white/5 border border-white/10 inline-flex items-center gap-2">
        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" />
        <span className="text-white text-xs">Checking…</span>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="rounded-xl p-2 bg-red-500/20 border border-red-500/25">
        <p className="text-white text-xs">{error || 'Something went wrong'}</p>
      </div>
    )
  }
  if (status === 'available') {
    return (
      <div className="rounded-xl p-2 bg-emerald-500/20 border border-emerald-500/25">
        <p className="text-white text-xs">Username “{result?.normalized}” is available</p>
      </div>
    )
  }
  if (status === 'taken') {
    return (
      <div className="space-y-2">
        <div className="rounded-xl p-2 bg-red-500/20 border border-red-500/25">
          <p className="text-white text-xs">Username is already taken</p>
        </div>
        {result?.suggestions && result.suggestions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {result.suggestions.map((s: string) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white text-xs hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
}

