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
  // Live validation states
  const [passwordError, setPasswordError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [showLoginForm, setShowLoginForm] = useState(false) // Login flow toggle
  const [rememberMe, setRememberMe] = useState(false) // Remember me checkbox
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isUsernameSubmitting, setIsUsernameSubmitting] = useState(false)
  const [authLoading, setAuthLoading] = useState(false) // full-screen overlay during sign-ins
  const [showPassword, setShowPassword] = useState(false) // Password visibility toggle (synced for both fields)

  // Redeem code states
  const [showRedeemCodeForm, setShowRedeemCodeForm] = useState(false)
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemCodeValidated, setRedeemCodeValidated] = useState(false)
  const [redeemCodeInfo, setRedeemCodeInfo] = useState<any>(null)

  // Username live availability (always declared to keep hook order stable)
  const availability = useUsernameAvailability(process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` : '')
  useEffect(() => {
    availability.setUsername(username)
  }, [username])

  // Check for capital letters in username
  const hasCapitalLetters = /[A-Z]/.test(username)

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  // Live validation: Check passwords match and email is valid
  useEffect(() => {
    // Validate passwords match - only show error if both fields have values
    if (confirmPassword.length > 0 && password.length > 0) {
      if (password !== confirmPassword) {
        setPasswordError("Passwords don't match")
      } else {
        setPasswordError("")
      }
    } else {
      setPasswordError("")
    }

    // Validate email - only show error if email field has value
    if (email.length > 0) {
      if (!isValidEmail(email)) {
        setEmailError("Invalid email address")
      } else {
        setEmailError("")
      }
    } else {
      setEmailError("")
    }
  }, [password, confirmPassword, email])

  // Check if form is valid (passwords match, email valid, password length >= 6)
  const isFormValid = 
    password.length >= 6 &&
    password === confirmPassword &&
    isValidEmail(email) &&
    email.length > 0 &&
    confirmPassword.length > 0

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

  // Loading Spinner Component (light theme)
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-1">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
    </div>
  )

  // Redirect Spinner Component (light theme)
  const RedirectSpinner = () => (
    <div className="flex items-center justify-center py-1">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
    </div>
  )

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
        // Backend returns user and customToken (not passwordLoginIdToken)
        const { user, customToken, redirect } = response.data.data

        console.log("✅ Login successful!")
        console.log("👤 User:", user)
        console.log("🔑 customToken exists:", !!customToken)
        console.log("🔑 customToken type:", typeof customToken)
        console.log("🔑 customToken length:", customToken?.length)

        // Store user profile first
        try { localStorage.setItem("user", JSON.stringify(user)) } catch {}

        // Track that email/password was used (for "Last Used" tag)
        try {
          localStorage.setItem('lastAuthMethod', 'email')
          setLastAuthMethod('email') // Update state immediately
        } catch {}

        // CRITICAL: Sign into Firebase with customToken, then create session cookie
        // The login endpoint returns customToken, not passwordLoginIdToken
        // We must sign into Firebase to get a valid ID token for session creation
        if (customToken && typeof customToken === 'string') {
          try {
            console.log("🔄 Signing into Firebase with customToken...")
            const userCredential = await signInWithCustomToken(auth, customToken)
            const idToken = await userCredential.user.getIdToken()
            
            console.log("✅ Signed into Firebase successfully")
            console.log("🔑 ID token obtained, length:", idToken.length)
            
            // Store ID token for Bearer token authentication
            try {
              localStorage.setItem("authToken", idToken)
              console.log("💾 ID token stored in localStorage")
            } catch (err) {
              console.error("❌ Failed to store token:", err)
            }

            // Create session cookie with the ID token
            console.log("🔄 Creating session cookie...")
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ idToken })
            })

            console.log("🔄 Session response status:", sessionResponse.status)
            
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json().catch(() => ({}))
              console.log("✅ Session cookie created successfully", sessionData)
              console.log("🍪 Cookies after session creation:", document.cookie)
            } else {
              const errorText = await sessionResponse.text().catch(() => 'Unknown error')
              console.error("❌ Failed to create session cookie:", sessionResponse.status, errorText)
            }
          } catch (firebaseError) {
            console.error("❌ Error signing into Firebase or creating session:", firebaseError)
            // Continue anyway - user can still use the app, but may need to retry
          }
        } else {
          console.warn("⚠️ Skipping Firebase sign-in and session creation - customToken is missing or invalid")
        }

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
        window.location.href = finalRedirectUrl

      } else {
        console.error("❌ Login failed:", response.data?.message)
        const errorMsg = response.data?.message || "Login failed. Please try again."
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      }

    } catch (error: any) {
      console.error("❌ Login error:", error)

      // Prefer detailed validation errors when present
      const validationList = error?.response?.data?.data
      let errorMessage = 'An error occurred'
      
      if (Array.isArray(validationList) && validationList.length > 0) {
        const detailedMessage = validationList
          .map((e: any) => e?.msg || e?.message)
          .filter(Boolean)
          .join('\n')
        errorMessage = detailedMessage || 'Please fix the highlighted fields and try again.'
        setError(errorMessage)
        toast.error(errorMessage, { duration: 4000 })
      } else {
        errorMessage = error.response?.data?.message || 'An error occurred'
        if (errorMessage.includes('already have an account with Google')) {
          errorMessage = "This email is registered with Google. Please use the Google sign-in button below."
          setError(errorMessage)
          toast.error(errorMessage, { duration: 4000 })
        } else if (error.response?.status === 401) {
          errorMessage = "Invalid credentials. Please check your email and password."
          setError(errorMessage)
          toast.error(errorMessage, { duration: 4000 })
        } else if (error.response?.status === 404) {
          errorMessage = "User not found. Please check your email."
          setError(errorMessage)
          toast.error(errorMessage, { duration: 4000 })
        } else if (error.response?.status === 400 && errorMessage === 'Validation failed') {
          errorMessage = 'Please check your input and try again.'
          setError(errorMessage)
          toast.error(errorMessage, { duration: 4000 })
        } else {
          setError(errorMessage)
          toast.error(errorMessage, { duration: 4000 })
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

    console.log("🔧 Axios configured:", !!axios)

    // Toast logic moved to global ToastMount.tsx
  }, [searchParams])


  // API handlers for form flow
  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("🚀 Starting OTP send process...")
    console.log("📧 Email:", email.trim())
    console.log("🔒 Password provided:", !!password)

    if (password !== confirmPassword) {
      console.log("❌ Password mismatch")
      const errorMsg = "Password doesn't match"
      setError(errorMsg)
      toast.error(errorMsg, { duration: 4000 })
      return
    }
    if (password.length < 6) {
      console.log("❌ Password too short")
      const errorMsg = "Password must be at least 6 characters"
      setError(errorMsg)
      toast.error(errorMsg, { duration: 4000 })
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
        const errorMsg = "Failed to send OTP. Please try again."
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      }
    } catch (error: any) {
      console.error("❌ OTP sending error details:")
      console.error("Error object:", error)
      console.error("Error message:", error.message)
      console.error("Error response:", error.response)
      console.error("Error status:", error.response?.status)
      console.error("Error data:", error.response?.data)

      // Extract error message from response
      let errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP. Please try again.'
      
      // Handle validation errors array
      if (error.response?.data?.data && Array.isArray(error.response.data.data)) {
        const validationErrors = error.response.data.data
        errorMessage = validationErrors.map((err: any) => err.msg || err.message).join(', ') || errorMessage
      }

      // Specific error handling
      if (errorMessage.includes('already have an account with Google')) {
        const errorMsg = "This email is registered with Google. Please use the Google sign-in button below."
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      } else if (errorMessage.includes('Account already exists')) {
        const errorMsg = "Account already exists. Please use sign-in instead."
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      } else if (errorMessage.includes('Temporary') || errorMessage.includes('disposable')) {
        // Temporary/disposable email error
        setError(errorMessage)
        toast.error(errorMessage, { duration: 5000 })
      } else if (errorMessage.includes('Invalid email address') || errorMessage.includes('mail server')) {
        // MX record validation error
        setError(errorMessage)
        toast.error(errorMessage, { duration: 5000 })
      } else {
        // Handle other errors normally
        setError(errorMessage)
        toast.error(errorMessage, { duration: 4000 })
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
            console.log("🔄 Creating session with backend using ID token...")
            const backendBaseForSession = process.env.NEXT_PUBLIC_API_BASE_URL || ''
            // Create session directly with backend
            const sessionResponse = await fetch(`${backendBaseForSession}/api/auth/session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ idToken: actualIdToken })
            })

            if (sessionResponse.status === 200) {
              console.log("✅ Session created with ID token!")
              console.log("🍪 Cookies after session creation:", document.cookie)

              // Store user profile only; rely on httpOnly cookie for auth
              const createdUser = response.data?.data?.user || response.data?.user || response.data
              localStorage.setItem("user", JSON.stringify(createdUser))
              try { localStorage.setItem('authToken', actualIdToken) } catch {}
              
              // Track that email/password was used (for "Last Used" tag)
              try {
                localStorage.setItem('lastAuthMethod', 'email')
              } catch {}
              
              toast.success('OTP verified successfully! Please choose a username.', { duration: 3000 })
              setShowUsernameForm(true)
              setOtp("")
              setOtpSent(false)
              setError("")
            } else {
              console.error("❌ Session creation failed:", sessionResponse.status)
              const errorMsg = "Session creation failed. Please try again."
              setError(errorMsg)
              toast.error(errorMsg, { duration: 4000 })
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
        toast.error(errorMessages, { duration: 4000 })
      } else if (error.response?.data?.message) {
        console.log("📝 Setting error from response:", error.response.data.message)
        const errorMsg = error.response.data.message
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      } else if (error.response?.data?.error) {
        console.log("📝 Setting error from response.error:", error.response.data.error)
        const errorMsg = error.response.data.error
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      } else {
        console.log("📝 Setting generic error message")
        const errorMsg = "Invalid OTP or expired. Please try again."
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
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
        const successMsg = `OTP resent to ${email.trim()}`
        setError("")
        setSuccess(successMsg)
        toast.success(successMsg, { duration: 3000 })
      } else {
        console.log("❌ OTP not resent - checking response structure:")
        console.log("❌ response.data:", response.data)
        console.log("❌ response.data.data:", response.data?.data)
        console.log("❌ response.data.data.sent:", response.data?.data?.sent)
        const errorMsg = "Failed to resend OTP. Please try again."
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      }
    } catch (error: any) {
      console.error("❌ Resend OTP error details:")
      console.error("Resend error:", error)
      console.error("Resend error response:", error.response)
      console.error("Resend error data:", error.response?.data)

      const errorMessage = error.response?.data?.message || "Failed to resend OTP. Please try again."
      setError(errorMessage)
      toast.error(errorMessage, { duration: 4000 })
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

        // Track that Google was used (for "Last Used" tag)
        try {
          localStorage.setItem('lastAuthMethod', 'google')
          setLastAuthMethod('google') // Update state immediately
        } catch {}

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
          const backendBaseForSession = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '')
          // Use Next.js API route for session creation to avoid cross-domain cookie issues
          const resp = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken: finalIdToken })
          })
          try { if (resp?.ok) { localStorage.setItem('authToken', finalIdToken) } } catch {}

          console.log("✅ Session created, redirecting...")
          
          // Don't show toast here - it will be shown on HomePage after navigation for better UX
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

          setTimeout(() => {
            window.location.href = finalRedirectUrl
          }, 2000)
        }
      }

    } catch (error: any) {
      console.error("❌ Google sign-in failed:", error)

      const errorMessage = error.response?.data?.message || 'An error occurred'
      let displayMessage = errorMessage

      if (errorMessage.includes('already have an account with email/password')) {
        displayMessage = "This email is registered with email/password. Please use the regular sign-in form above."
        setError(displayMessage)
        toast.error(displayMessage, { duration: 4000 })
      } else if (error.code === 'auth/popup-closed-by-user') {
        displayMessage = "Google sign-in was cancelled."
        setError(displayMessage)
        toast.error(displayMessage, { duration: 3000 })
      } else if (error.code === 'auth/popup-blocked') {
        displayMessage = "Google sign-in popup was blocked. Please allow popups and try again."
        setError(displayMessage)
        toast.error(displayMessage, { duration: 4000 })
      } else if (error.code === 'auth/network-request-failed') {
        displayMessage = "Network error. Please check your connection and try again."
        setError(displayMessage)
        toast.error(displayMessage, { duration: 4000 })
      } else {
        setError(displayMessage)
        toast.error(displayMessage, { duration: 4000 })
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
      const errorMsg = "Please enter a username"
      setError(errorMsg)
      toast.error(errorMsg, { duration: 3000 })
      return
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_.-]{3,30}$/
    if (!usernameRegex.test(username.trim())) {
      const errorMsg = "Username must be 3-30 characters, lowercase letters, numbers, dots, underscores, and hyphens only"
      setError(errorMsg)
      toast.error(errorMsg, { duration: 4000 })
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

          const sessionResponse = await (axiosInstance || getApiClient()).post('/api/auth/session',
            { idToken: finalIdToken },
            { withCredentials: true }
          )

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
          
          // Track that email/password was used (for "Last Used" tag) - already set during OTP verification, but ensure it's set here too
          try {
            localStorage.setItem('lastAuthMethod', 'email')
          } catch {}
          
          toast.success('Account created successfully! Welcome to WildMind AI!', { duration: 3000 })
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
                console.log("🔄 Creating session with backend using ID token...")
            // Use Next.js API route for session creation to avoid cross-domain cookie issues
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ idToken: actualIdToken })
            })

                if (sessionResponse.status === 200) {
                  console.log("✅ Session created with ID token after username creation!")
                  console.log("🍪 Cookies after session creation:", document.cookie)

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
                  console.error("❌ Session creation failed:", sessionResponse.status)
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
            setPasswordError("")
            setEmailError("")
            setError("")

            // Show redeem code form
            setShowRedeemCodeForm(true)
            setSuccess("Account created successfully! You can now apply a redeem code to get additional credits or continue with the free plan.")
            toast.success('Account created successfully! Welcome to WildMind AI!', { duration: 3000 })
          }
        } else {
          console.log("❌ No user data found in localStorage")
          const errorMsg = "User data not found. Please try the sign-up process again."
          setError(errorMsg)
          toast.error(errorMsg, { duration: 4000 })
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

      let errorMsg = "Failed to set username. Please try again."

      if (error.response?.data?.message) {
        errorMsg = error.response.data.message
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      } else if (error.response?.status === 400) {
        errorMsg = "Username already taken. Please choose another."
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
      } else {
        setError(errorMsg)
        toast.error(errorMsg, { duration: 4000 })
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
          window.location.href = APP_ROUTES.HOME
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


  // Check which authentication method was last used (for "Last Used" tag)
  const [lastAuthMethod, setLastAuthMethod] = useState<'google' | 'email' | null>(null)
  useEffect(() => {
    // Check localStorage for previous authentication method
    const updateLastAuthMethod = () => {
      try {
        const lastAuth = localStorage.getItem('lastAuthMethod')
        if (lastAuth === 'google' || lastAuth === 'email') {
          setLastAuthMethod(lastAuth as 'google' | 'email')
        } else {
          setLastAuthMethod(null)
        }
      } catch {}
    }
    
    // Initial check
    updateLastAuthMethod()
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', updateLastAuthMethod)
    
    return () => {
      window.removeEventListener('storage', updateLastAuthMethod)
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 relative overflow-x-hidden">
      {(authLoading || isRedirecting) && (
        <LoadingScreen message={isRedirecting ? 'Redirecting…' : 'Signing you in…'} subMessage={isRedirecting ? 'Just a moment while we finish up' : undefined} />
      )}
      
      {/* Form Content - Centered (Krea Style) */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-6 md:px-12">
        <div className="w-full max-w-md space-y-6">
          {/* Welcome Section - Only show when not on OTP screen, username screen, login screen, or redeem code screen */}
          {!otpSent && !showUsernameForm && !showLoginForm && !showRedeemCodeForm && (
            <div className="text-center space-y-4 mb-8">
              {/* Logo - Just above Welcome text */}
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src="/core/logosquare.png"
                    alt="WildMind Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Silently handle error - don't log to console
                      const target = e.target as HTMLImageElement;
                      if (target) {
                        target.style.display = 'none';
                      }
                    }}
                  />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome to WildMind AI</h1>
              <p className="text-gray-400 text-base">Log in or sign up.</p>
            </div>
          )}

          {showUsernameForm ? (
            <div className="space-y-6">
              {/* Title (Dark) */}
              <div className="text-center space-y-4 mb-8">
                {/* Logo - Just above Username text */}
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img
                      src="/core/logosquare.png"
                      alt="WildMind Logo"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target) {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Verification Successful!</h1>
                <p className="text-gray-400 text-base">Last step, Make a Unique Username</p>
              </div>

              {/* Username Input (Krea Style - Dark) */}
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base"
                  required
                />
                {/* Capital letters validation (Dark) */}
                {hasCapitalLetters && (
                  <div className="mt-2 rounded-lg p-2 bg-red-900/30 border border-red-800">
                    <p className="text-red-300 text-xs">Capital letters are not allowed in usernames. Please use lowercase letters only.</p>
                  </div>
                )}

                {/* Live availability feedback - only show if no capital letters */}
                {!hasCapitalLetters && (
                  <div className="mt-2">
                    <UsernameAvailabilityFeedback
                      status={availability.status}
                      result={availability.result}
                      error={availability.error}
                      onSuggestion={setUsername}
                    />
                  </div>
                )}
              </div>

              {/* Continue Button (Krea Style - Dark) */}
              <button
                onClick={handleUsernameSubmit}
                disabled={!availability.isAvailable || hasCapitalLetters || isUsernameSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors flex items-center justify-center gap-2 ${
                  !availability.isAvailable || hasCapitalLetters || isUsernameSubmitting
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isUsernameSubmitting ? <LoadingSpinner /> : (
                  <>
                    Continue
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          ) : showRedeemCodeForm ? (
            <div className="space-y-6">
              {/* Title (Dark) */}
              <div className="text-center space-y-4 mb-8">
                {/* Logo - Just above Redeem Code text */}
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img
                      src="/core/logosquare.png"
                      alt="WildMind Logo"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target) {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Almost There!</h1>
                <p className="text-gray-400 text-base">Do you have a redeem code? Apply it now to get additional credits, or continue with the free plan.</p>
              </div>

              {/* Success Message (Dark) */}
              {success && (
                <div className="rounded-lg p-3 bg-green-900/30 border border-green-800">
                  <p className="text-green-300 text-sm leading-relaxed">{success}</p>
                </div>
              )}

              {/* Error Message (Dark) */}
              {error && (
                <div className="rounded-lg p-3 bg-red-900/30 border border-red-800">
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Redeem Code Input (Krea Style - Dark) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Redeem Code <span className="text-gray-500 font-normal">(Optional)</span>
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base uppercase"
                />

                {/* Validation feedback (Dark) */}
                {redeemCodeInfo && redeemCodeValidated && (
                  <div className="mt-2 text-sm text-green-300 flex items-center space-x-2">
                    <span>✓</span>
                    <span>
                      Valid {redeemCodeInfo.planName} - You'll get {redeemCodeInfo.creditsToGrant.toLocaleString()} credits!
                      {redeemCodeInfo.remainingTime && (
                        <span className="text-green-400 ml-1">(expires in {redeemCodeInfo.remainingTime})</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Help text (Dark) */}
                <div className="mt-1 text-xs text-gray-500">
                  Student codes start with "STU-" and Business codes start with "BUS-"
                </div>
              </div>

              {/* Buttons (Krea Style - Dark) */}
              <div className="space-y-3">
                {/* Validate/Apply Code Button */}
                {redeemCode && !redeemCodeValidated ? (
                  <button
                    onClick={handleRedeemCodeValidation}
                    disabled={processing || !redeemCode.trim()}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors ${
                      processing || !redeemCode.trim()
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {processing ? <LoadingSpinner /> : "Validate Code"}
                  </button>
                ) : redeemCodeValidated ? (
                  <button
                    onClick={handleRedeemCodeSubmit}
                    disabled={processing}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors ${
                      processing
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {processing ? <LoadingSpinner /> : "Apply Redeem Code"}
                  </button>
                ) : null}

                {/* Skip Button (Krea Style - Dark) */}
                <button
                  onClick={handleSkipRedeemCode}
                  disabled={processing}
                  className="w-full py-3 px-4 rounded-lg font-medium text-base bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-colors"
                >
                  Continue with Free Plan
                </button>

                {/* Info about free plan (Dark) */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Free plan includes 4,120 credits to get you started
                  </p>
                </div>
              </div>
            </div>
          ) : showLoginForm ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Title (Krea Style - Dark) */}
              <div className="text-center space-y-4 mb-8">
                {/* Logo - Just above Welcome text */}
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img
                      src="/core/logosquare.png"
                      alt="WildMind Logo"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target) {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome to WildMind AI</h1>
                <p className="text-gray-400 text-base">Log in or sign up.</p>
              </div>

              {/* Google Sign-in Button First (Krea Style - Dark) */}
              <div className="relative">
                {lastAuthMethod === 'google' && (
                  <div className="absolute -top-2 right-0 z-10">
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">Last Used</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
                >
                  <Image src={getImageUrl('core', 'google')} alt="Google" width={20} height={20} className="w-5 h-5" />
                  <span className="text-base">Continue with Google</span>
                </button>
              </div>

              {/* OR Separator (Krea Style - Dark) */}
              <div className="flex items-center gap-4">
                <div className="flex-grow h-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm font-medium">OR</span>
                <div className="flex-grow h-px bg-gray-700"></div>
              </div>

              {/* Email/Password Form - Show "Last Used" badge if email was last used */}
              {lastAuthMethod === 'email' && (
                <div className="relative -mb-2">
                  <div className="absolute -top-2 right-0 z-10">
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">Last Used</span>
                  </div>
                </div>
              )}

              {/* Error Message (Dark) */}
              {error && (
                <div className="rounded-lg p-3 bg-red-900/30 border border-red-800">
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success Message or Redirect Spinner (Dark) */}
              {isRedirecting ? (
                <RedirectSpinner />
              ) : success && (
                <div className="rounded-lg p-3 bg-green-900/30 border border-green-800">
                  <p className="text-green-300 text-sm leading-relaxed">{success}</p>
                </div>
              )}

              {/* Email Input (Krea Style - Dark with Icon) */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base"
                  required
                />
              </div>

              {/* Password Input (Krea Style - Dark with Icon and Eye Toggle) */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-300 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>


              {/* Continue with Email Button (Krea Style - Dark) */}
              <button
                type="submit"
                disabled={processing}
                className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors flex items-center justify-center gap-2 ${
                  processing
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {processing ? "Logging in..." : (
                  <>
                    Continue with Email
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Sign Up Link (Dark) */}
              <div className="text-center pt-4">
                <span className="text-gray-400 text-sm">Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="text-blue-400 underline cursor-pointer text-sm font-medium hover:text-blue-300"
                >
                  Sign Up
                </button>
              </div>
            </form>
          ) : otpSent ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Title (Krea Style - Dark) */}
              <div className="text-center space-y-4 mb-8">
                {/* Logo - Just above Verify text */}
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img
                      src="/core/logosquare.png"
                      alt="WildMind Logo"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target) {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Verify code</h1>
                <p className="text-gray-400 text-base">An authentication code has been sent to your email.</p>
              </div>

              {/* Code Input (Krea Style - Dark) */}
              <div>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setOtp(value)
                  }}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base text-center tracking-widest"
                  required
                  maxLength={6}
                />
              </div>

              {/* Error Message (Dark) */}
              {error && (
                <div className="rounded-lg p-3 bg-red-900/30 border border-red-800">
                  <p className="text-red-300 text-sm text-center leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success Message or Redirect Spinner (Dark) */}
              {isRedirecting ? (
                <RedirectSpinner />
              ) : success && (
                <div className="rounded-lg p-3 bg-green-900/30 border border-green-800">
                  <p className="text-green-300 text-sm text-center leading-relaxed">{success}</p>
                </div>
              )}

              {/* Verify Button (Krea Style - Dark) */}
              <button
                type="submit"
                disabled={processing || otp.length < 6}
                className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors flex items-center justify-center gap-2 ${
                  processing || otp.length < 6
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {processing ? "Verifying..." : (
                  <>
                    Continue with Email
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Resend Link (Dark) */}
              <div className="text-center">
                <span className="text-gray-400 text-sm">Not receive email? </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-blue-400 underline cursor-pointer text-sm font-medium hover:text-blue-300"
                >
                  Resend
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Google Sign-in Button First (Krea Style - Dark) */}
              <div className="relative">
                {lastAuthMethod === 'google' && (
                  <div className="absolute -top-2 right-0 z-10">
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">Last Used</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
                >
                  <Image src={getImageUrl('core', 'google')} alt="Google" width={20} height={20} className="w-5 h-5" />
                  <span className="text-base">Continue with Google</span>
                </button>
              </div>

              {/* OR Separator (Krea Style - Dark) */}
              <div className="flex items-center gap-4">
                <div className="flex-grow h-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm font-medium">OR</span>
                <div className="flex-grow h-px bg-gray-700"></div>
              </div>

              {/* Email/Password Form - Show "Last Used" badge if email was last used */}
              {lastAuthMethod === 'email' && (
                <div className="relative -mb-2">
                  <div className="absolute -top-2 right-0 z-10">
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">Last Used</span>
                  </div>
                </div>
              )}

              {/* Email Form (Krea Style - Dark) */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Email Input with Icon */}
                <div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      autoComplete="email"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-800 border ${
                        emailError ? 'border-red-500' : 'border-gray-700'
                      } placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base`}
                      required
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs text-red-400">{emailError}</p>
                  )}
                </div>

                {/* Password Fields with Icons and Eye Toggle */}
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-300 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className={`w-full pl-10 pr-12 py-3 bg-gray-800 border ${
                          passwordError ? 'border-red-500' : 'border-gray-700'
                        } placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-white text-base`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-300 focus:outline-none"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>
                    )}
                  </div>
                </div>

                {/* Terms Text (Dark) - Checkbox removed, text only */}
                <div className="text-xs text-center text-gray-400 leading-relaxed">
                  By signing up, you agree to our{" "}
                  <span className="text-blue-400 underline cursor-pointer hover:text-blue-300">Terms of Service</span> &{" "}
                  <span className="text-blue-400 underline cursor-pointer hover:text-blue-300">Privacy Policy</span>.
                </div>

                {/* Error Message (Dark) - Only show server/API errors */}
                {error && (
                  <div className="rounded-lg p-3 bg-red-900/30 border border-red-800">
                    <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Continue with Email Button (Krea Style - Dark) */}
                <button
                  type="submit"
                  disabled={processing || !isFormValid}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors flex items-center justify-center gap-2 ${
                    processing || !isFormValid
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {processing ? "Sending..." : (
                    <>
                      Continue with Email
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Already have an account link (Dark) */}
              <div className="text-center pt-4">
                <span className="text-gray-400 text-sm">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(true)}
                  className="text-blue-400 underline cursor-pointer text-sm font-medium hover:text-blue-300"
                >
                  Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer - Terms & Privacy (Krea Style - Dark) - Only show when not on OTP screen, username screen, or login screen */}
      {/* {!otpSent && !showUsernameForm && !showLoginForm && (
        <div className="absolute bottom-6 left-0 right-0 text-center px-6">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our{" "}
            <span className="text-blue-400 underline cursor-pointer hover:text-blue-300">Terms of Service</span> &{" "}
            <span className="text-blue-400 underline cursor-pointer hover:text-blue-300">Privacy Policy</span>.
          </p>
        </div>
      )} */}

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
      <div className="rounded-lg p-2 bg-amber-900/30 border border-amber-800">
        <p className="text-amber-300 text-xs">Use 3-30 chars: a-z 0-9 _ . -</p>
      </div>
    )
  }
  if (status === 'checking') {
    return (
      <div className="rounded-lg p-2 bg-gray-800 border border-gray-700 inline-flex items-center gap-2">
        <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-600 border-t-blue-500" />
        <span className="text-gray-400 text-xs">Checking…</span>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="rounded-lg p-2 bg-red-900/30 border border-red-800">
        <p className="text-red-300 text-xs">{error || 'Something went wrong'}</p>
      </div>
    )
  }
  if (status === 'available') {
    return (
      <div className="rounded-lg p-2 bg-green-900/30 border border-green-800">
        <p className="text-green-300 text-xs">Username "{result?.normalized}" is available</p>
      </div>
    )
  }
  if (status === 'taken') {
    return (
      <div className="space-y-2">
        <div className="rounded-lg p-2 bg-red-900/30 border border-red-800">
          <p className="text-red-300 text-xs">Username is already taken</p>
        </div>
        {result?.suggestions && result.suggestions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {result.suggestions.map((s: string) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="px-3 py-1 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-xs hover:bg-gray-700"
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

