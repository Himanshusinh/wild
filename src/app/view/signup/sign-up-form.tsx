"use client"

import { useState, type FormEvent, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import axiosInstance, { getApiClient } from '@/lib/axiosInstance'
import Image from "next/image"
import { useUsernameAvailability } from "./useUsernameAvailability"
import { getImageUrl } from "@/routes/imageroute"
import { signInWithCustomToken, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { APP_ROUTES, LEGAL_ROUTES } from '../../../routes/routes'
import toast from 'react-hot-toast'
import LoadingScreen from '@/components/ui/LoadingScreen'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import TurnstileCaptcha from '@/components/TurnstileCaptcha'
import { setCookie, clearCookie, LoadingSpinner, textFieldSx, ValidationPopup, OtpInput, EyeIcon, EyeOffIcon } from "./components/shared"
import { SignInForm as SignInFormComponent } from "./components/SignInForm"
import { SignUpForm } from "./components/SignUpForm"
import { RedeemCodeForm } from "./components/RedeemCodeForm"
import { UsernameForm } from "./components/UsernameForm"
import { ForgotPasswordModal } from "./components/ForgotPasswordModal"

export function UsernameAvailabilityFeedback({ status, result, error, onSuggestion }: { status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'; result: any; error: string | null; onSuggestion: (v: string) => void }) {
  if (status === 'idle') return null;
  if (status === 'invalid') return <div className="p-2 mt-0 mb-1 bg-amber-900/10 border border-amber-800 rounded-lg"><p className="text-amber-300 text-[10px]">Use 3-30 chars: a-z 0-9 _ . -</p></div>;
  if (status === 'checking') return <div className="p-2 mt-0 mb-1 text-gray-400 text-[10px] animate-pulse">Checking availability...</div>;
  if (status === 'error') return <div className="p-2 mt-0 mb-1 bg-red-900/10 border border-red-800 rounded-lg"><p className="text-red-300 text-[10px]">{error || 'Something went wrong'}</p></div>;
  if (status === 'available') return null;
  if (status === 'taken') {
    return (
      <div className="space-y-2 mt-0 mb-1">
        <div className="p-2 bg-red-900/10 border border-red-800 rounded-lg">
          <p className="text-red-300 text-[10px]">Username taken. Suggestions:</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {result?.suggestions?.map((s: string) => (
            <button key={s} type="button" onClick={() => onSuggestion(s)} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] hover:bg-gray-700">{s}</button>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function SignInForm() {
  const searchParams = useSearchParams()
  const rawReturnUrl = searchParams?.get('returnUrl') || searchParams?.get('next') || null
  const returnUrl = (() => {
    // Prevent open-redirect: only allow same-origin paths.
    if (!rawReturnUrl) return null
    try {
      const trimmed = String(rawReturnUrl).trim()
      if (!trimmed.startsWith('/')) return null
      return trimmed
    } catch {
      return null
    }
  })()
  const showLoginParam = searchParams?.get('showLogin')

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
  const [showLoginForm, setShowLoginForm] = useState(showLoginParam === 'true') // Login flow toggle initialized from URL
  const [rememberMe, setRememberMe] = useState(false) // Remember me checkbox
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false) // Forgot password modal
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("") // Email for forgot password
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false) // Track if email was sent
  const [forgotPasswordError, setForgotPasswordError] = useState("") // Isolated error for forgot password modal
  const [isGoogleOnlyUser, setIsGoogleOnlyUser] = useState(false) // True when user signed up via Google
  const [resendCooldown, setResendCooldown] = useState(0) // Seconds remaining before resend is allowed
  const [isUsernameSubmitting, setIsUsernameSubmitting] = useState(false)
  const [authLoading, setAuthLoading] = useState(false) // full-screen overlay during sign-ins
  const [showPassword, setShowPassword] = useState(false) // Password visibility toggle
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // Confirm Password visibility toggle
  const [mounted, setMounted] = useState(false) // Component mount state for SSR


  // Captcha states
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [captchaError, setCaptchaError] = useState(false)

  // Focus and Validation Popup states
  const [isUsernameFocused, setIsUsernameFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
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

  // Check if form is valid (passwords match, email valid, password length >= 6, valid username)
  // Validation requirement tests
  const usernameRequirements = [
    { label: "Username must be 6-14 character", test: (v: string) => v.length >= 6 && v.length <= 14, required: true },
    { label: "Can use Digit", test: (v: string) => /[0-9]/.test(v), required: false },
    { label: "Can use Alphabet", test: (v: string) => /[a-zA-Z]/.test(v), required: false },
    { label: "Can use Special Character (only _ and .)", test: (v: string) => /[._]/.test(v), required: false },
    { label: "At least 1 special character", test: (v: string) => /[._]/.test(v), required: true },
  ]

  const passwordRequirements = [
    { label: "Password must be 8-14 character", test: (v: string) => v.length >= 8 && v.length <= 14 },
    { label: "At least 1 uppercase letter (A-Z)", test: (v: string) => /[A-Z]/.test(v) },
    { label: "At least 1 lowercase letter (a-z)", test: (v: string) => /[a-z]/.test(v) },
    { label: "At least 1 number (0-9)", test: (v: string) => /[0-9]/.test(v) },
    { label: "At least 1 special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  ]

  const isUsernameValid = usernameRequirements
    .filter(req => req.required !== false)
    .every(req => req.test(username)) && /^[a-zA-Z0-9_.]*$/.test(username)
  const isPasswordValid = passwordRequirements.every(req => req.test(password))

  const isFormValid =
    isPasswordValid &&
    password === confirmPassword &&
    isValidEmail(email) &&
    email.length > 0 &&
    confirmPassword.length > 0 &&
    isUsernameValid &&
    availability.isAvailable

  const switchToGoogleSignIn = () => {
    setShowLoginForm(false) // Ensure we're in sign-up mode for Google
    setError("")
    // Don't reset captcha - keep token valid
    // Trigger Google sign-in
    setTimeout(() => {
      handleGoogleLogin()
    }, 100)
  }

  const switchToEmailSignIn = () => {
    setShowLoginForm(true) // Switch to login mode
    setError("")
    // Don't reset captcha - keep token valid across form switch
  }

  // Handle login form submission
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    console.log("🔐 Starting login process...")
    console.log("📧 Email:", email.trim())
    console.log("🔒 Password provided:", password ? "***" : "empty")

    if (!email.trim() || !password) {
      setError("Please enter both email and password")
      return
    }

    // Verify captcha token is present
    if (!captchaToken) {
      setCaptchaError(true)
      const errorMsg = "Please complete the captcha verification"
      setError(errorMsg)
      toast.error(errorMsg, { duration: 4000 })
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
        password: password,
        captchaToken: captchaToken
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
        try { localStorage.setItem("user", JSON.stringify(user)) } catch { }

        // Track that email/password was used (for "Last Used" tag)
        try {
          localStorage.setItem('lastAuthMethod', 'email')
          setLastAuthMethod('email') // Update state immediately
        } catch { }

        // CRITICAL: Sign into Firebase with customToken, then create session cookie
        // The login endpoint returns customToken, not passwordLoginIdToken
        // We must sign into Firebase to get a valid ID token for session creation
        if (customToken && typeof customToken === 'string') {
          try {
            console.log("🔄 Signing into Firebase with customToken...")

            // CRITICAL: Store token in a way that can be accessed across subdomains
            // We'll store it in localStorage on www, and also try to set a non-httpOnly cookie
            // as a fallback for cross-subdomain access (though httpOnly cookie is primary)
            const userCredential = await signInWithCustomToken(auth, customToken)
            const idToken = await userCredential.user.getIdToken()

            console.log("✅ Signed into Firebase successfully")
            console.log("🔑 ID token obtained, length:", idToken.length)

            // Store ID token for Bearer token authentication
            try {
              localStorage.setItem("authToken", idToken)
              console.log("💾 ID token stored in localStorage")

              // CRITICAL: Also store in a way that can be accessed across subdomains
              // Store in user object for easier access
              try {
                const userWithToken = { ...user, idToken };
                localStorage.setItem("user", JSON.stringify(userWithToken));
              } catch { }

              // Also store as idToken directly for wildmindcanvas to find
              try {
                localStorage.setItem("idToken", idToken);
              } catch { }
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
        try { localStorage.setItem('toastMessage', 'LOGIN_SUCCESS') } catch { }
        setIsRedirecting(true)
        setEmail("")
        setPassword("")

        // Set a short-lived hint cookie to prevent race-condition redirects in middleware
        try { document.cookie = 'auth_hint=1; Max-Age=120; Path=/; SameSite=Lax' } catch { }

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


  // Captcha handlers
  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
    setCaptchaError(false)
  }

  const handleCaptchaError = () => {
    setCaptchaToken('')
    setCaptchaError(true)
  }

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    // console.log("🚀 Starting OTP send process...")
    // console.log("📧 Email:", email.trim())
    // console.log("🔒 Password provided:", !!password)

    // Explicit validation feedback
    if (!username.trim()) {
      toast.error("Please enter a username")
      return
    }
    if (!isUsernameValid) {
      toast.error("Username format is invalid")
      return
    }
    if (!availability.isAvailable) {
      toast.error("Username is already taken")
      return
    }
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address")
      return
    }
    if (!isPasswordValid) {
      toast.error("Password does not meet requirements")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (!captchaToken) {
      setCaptchaError(true)
      toast.error("Please complete the captcha verification")
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
      // console.log("📤 Sending request to:", "http://localhost:5000/api/auth/email/start")
      // console.log("📤 Request data:", requestData)

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
        setResendCooldown(60) // Start 60s timer
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
  const handleVerifyOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault()
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

        // Try to set username for the newly created email user
        if (username.trim()) {
          try {
            console.log("👤 Setting username for newly verified email user...");
            const usernameResponse = await axiosInstance.post("/api/auth/email/username", {
              username: username.trim(),
              email: email.trim()
            }, { withCredentials: true });

            console.log("✅ Username set successfully!");
          } catch (usernameError) {
            console.error("❌ Failed to set username after verification:", usernameError);
            // Non-fatal, user account was already created. Just proceed to session.
          }
        }

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
              try { localStorage.setItem('authToken', actualIdToken) } catch { }

              // Track that email/password was used (for "Last Used" tag)
              try {
                localStorage.setItem('lastAuthMethod', 'email')
              } catch { }

              // Show redeem code form instead of direct redirection
              setShowRedeemCodeForm(true)
              setSuccess("Account created successfully! You can now apply a redeem code to get additional credits or continue with the free plan.")
              toast.success('Account created successfully! Welcome to WildMind AI!', { duration: 3000 })

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

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Handle forgot password
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    console.log("🔐 Starting forgot password process...")
    console.log("📧 Email:", forgotPasswordEmail.trim())

    if (!forgotPasswordEmail.trim() || !isValidEmail(forgotPasswordEmail.trim())) {
      toast.error("Please enter a valid email address", { duration: 3000 })
      return
    }

    setProcessing(true)
    setForgotPasswordError("")
    setIsGoogleOnlyUser(false)

    try {
      const response = await axiosInstance.post("/api/auth/forgot-password", {
        email: forgotPasswordEmail.trim()
      })

      console.log("📥 Forgot password response:", response.data)

      if (response.data?.responseStatus === 'success') {
        // Success - email sent — start 60-second resend cooldown
        setForgotPasswordSent(true)
        setResendCooldown(60)
        toast.success(response.data?.message || "Password reset link has been sent to your email.", { duration: 5000 })
      } else {
        const reason = response.data?.data?.reason
        const errorMessage = response.data?.message || "Failed to send password reset email. Please try again."

        if (reason === 'GOOGLE_ONLY_USER') {
          setIsGoogleOnlyUser(true)
        } else if (reason === 'USER_NOT_FOUND') {
          setForgotPasswordError("No account found with this email address.")
        } else if (reason === 'TOO_MANY_REQUESTS') {
          const retryAfter = response.data?.data?.retryAfterSeconds || 60
          setResendCooldown(retryAfter)
          setForgotPasswordSent(true) // Show the success/cooldown panel
        } else {
          setForgotPasswordError(errorMessage)
        }
      }
    } catch (error: any) {
      console.error("❌ Forgot password error:", error)
      const reason = error.response?.data?.data?.reason
      const errorMessage = error.response?.data?.message || "Failed to send password reset email. Please try again."

      if (reason === 'GOOGLE_ONLY_USER') {
        setIsGoogleOnlyUser(true)
      } else if (reason === 'USER_NOT_FOUND') {
        setForgotPasswordError("No account found with this email address.")
      } else {
        setForgotPasswordError(errorMessage)
      }
    } finally {
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
      } catch { }

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
          try { if (resp?.ok) { localStorage.setItem('authToken', finalIdToken) } } catch { }

          console.log("✅ Session created, redirecting...")

          // Don't show toast here - it will be shown on HomePage after navigation for better UX
          // Defer toast to Home page: mark a flag so Home shows a success message after redirect
          try { localStorage.setItem('toastMessage', 'LOGIN_SUCCESS') } catch { }

          // Store user profile only; rely on httpOnly cookie for auth
          localStorage.setItem("user", JSON.stringify(userData))
          try { localStorage.setItem('authToken', finalIdToken) } catch { }
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
          } catch { }

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

        // Redirect to home or returnUrl after successful redeem
        setTimeout(() => {
          setIsRedirecting(true)
          setShowRedeemCodeForm(false)

          let finalUrl = returnUrl || APP_ROUTES.HOME
          if (!finalUrl.includes('toast=')) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'toast=LOGIN_SUCCESS'
          }
          window.location.href = finalUrl
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
      let finalUrl = returnUrl || APP_ROUTES.HOME
      if (!finalUrl.includes('toast=')) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'toast=LOGIN_SUCCESS'
      }
      window.location.href = finalUrl
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
      } catch { }
    }

    // Initial check
    updateLastAuthMethod()

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', updateLastAuthMethod)

    return () => {
      window.removeEventListener('storage', updateLastAuthMethod)
    }
  }, [])

  // Handle resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle showLogin query parameter
  useEffect(() => {
    if (showLoginParam === 'true') {
      setShowLoginForm(true)
    }
  }, [showLoginParam])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-full h-full min-h-screen bg-[#1C1C20] relative overflow-x-hidden"></div>
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-[#1C1C20] relative overflow-x-hidden">
      {(authLoading || isRedirecting) && (
        <LoadingScreen message={isRedirecting ? 'Redirecting…' : 'Signing you in…'} subMessage={isRedirecting ? 'Just a moment while we finish up' : undefined} />
      )}

      {/* Form Content - Stabilized Layout */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12 md:pt-40 p-6 md:p-12">
        <div className="w-full max-w-[90%] sm:max-w-[340px] md:max-w-[180px] lg:max-w-[220px] xl:max-w-[260px] 2xl:max-w-[360px] mx-auto flex flex-col items-center">

          {/* Constant Shared Header - Static for both Sign In and Sign Up */}
          <div className="text-center w-full mb-8">
            <p className="text-white text-md">Welcome to</p>
            <div className="flex justify-center items-center gap-1 mt-0 mb-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src="/core/logosquare.png"
                  alt="WildMind Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target) target.style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide whitespace-nowrap">WildMind AI </h1>
            </div>

            {/* Form Toggle Switcher */}
            {!showUsernameForm && !showRedeemCodeForm && !otpSent && (
              <div className="flex justify-center gap-6">
                <span
                  className={`pb-0 font-medium cursor-pointer transition-colors text-sm ${showLoginForm ? 'text-[#4182CF] border-b-2 border-[#4182CF]' : 'text-gray-500 hover:text-gray-300'}`}
                  onClick={() => setShowLoginForm(true)}
                >
                  Sign In
                </span>
                <span
                  className={`pb-0 font-medium cursor-pointer transition-colors text-sm ${!showLoginForm ? 'text-[#4182CF] border-b-2 border-[#4182CF]' : 'text-gray-500 hover:text-gray-300'}`}
                  onClick={() => setShowLoginForm(false)}
                >
                  Sign up
                </span>
              </div>
            )}
          </div>

          {/* Conditional Form Body */}
          <div className="w-full">
            {showUsernameForm ? (
              <UsernameForm
                username={username} setUsername={setUsername}
                isUsernameFocused={isUsernameFocused} setIsUsernameFocused={setIsUsernameFocused}
                usernameRequirements={usernameRequirements} hasCapitalLetters={hasCapitalLetters}
                availability={availability} isUsernameSubmitting={isUsernameSubmitting}
                handleUsernameSubmit={handleUsernameSubmit}
                UsernameFeedbackComponent={UsernameAvailabilityFeedback}
              />
            ) : showRedeemCodeForm ? (
              <RedeemCodeForm
                redeemCode={redeemCode} setRedeemCode={setRedeemCode}
                redeemCodeValidated={redeemCodeValidated} setRedeemCodeValidated={setRedeemCodeValidated}
                error={error} success={success} processing={processing}
                handleRedeemCodeValidation={handleRedeemCodeValidation}
                handleRedeemCodeSubmit={handleRedeemCodeSubmit}
                handleSkipRedeemCode={handleSkipRedeemCode}
              />
            ) : showLoginForm ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-2">

                <TextField
                  label="Email/Username"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  sx={textFieldSx}
                />

                <TextField
                  label="Password"
                  variant="outlined"
                  fullWidth
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: '#858585' }}>
                          {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />

                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[#4182CF] text-xs font-normal hover:text-blue-400">
                    Forgot Password?
                  </button>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    disabled={processing || !email || !password}
                    className={`w-3/4 py-2.5 rounded-xl font-semibold transition-all ${processing || !email || !password
                      ? "bg-[#4182CF]/47 text-white/50 cursor-not-allowed"
                      : "bg-[#4182CF] hover:bg-[#4B8EDF] text-white"
                      }`}
                  >
                    {processing ? "Signing in..." : "Sign In"}
                  </button>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-grow h-px bg-[#2D3035]"></div>
                  <span className="text-gray-500 text-xs font-medium">OR</span>
                  <div className="flex-grow h-px bg-[#2D3035]"></div>
                </div>

                <div className="relative">
                  {lastAuthMethod === 'google' && (
                    <div className="absolute -top-2 right-0 z-10">
                      <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-medium px-2 py-0.5 rounded-full">Last Used</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    className="w-full bg-[#24242A] hover:bg-[#2D3035] text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                  >
                    <img src={getImageUrl('core', 'google')} alt="Google" width={18} height={18} className="w-4 h-4" />
                    <span className="text-sm font-semibold">Continue with Google</span>
                  </button>
                </div>

                <TurnstileCaptcha
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  theme="dark"
                />
              </form>
            ) : (
              <SignUpForm
                username={username} setUsername={setUsername}
                isUsernameFocused={isUsernameFocused} setIsUsernameFocused={setIsUsernameFocused}
                usernameRequirements={usernameRequirements} hasCapitalLetters={hasCapitalLetters} availability={availability}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                showPassword={showPassword} setShowPassword={setShowPassword}
                isPasswordFocused={isPasswordFocused} setIsPasswordFocused={setIsPasswordFocused} passwordRequirements={passwordRequirements}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                otpSent={otpSent} otp={otp} setOtp={setOtp} processing={processing} resendCooldown={resendCooldown}
                handleSendOtp={handleSendOtp} handleVerifyOtp={handleVerifyOtp}
                handleGoogleLogin={handleGoogleLogin} handleCaptchaVerify={handleCaptchaVerify} handleCaptchaError={handleCaptchaError}
                UsernameFeedbackComponent={UsernameAvailabilityFeedback}
              />
            )}
          </div>
        </div >
      </div >
      <ForgotPasswordModal
        showForgotPassword={showForgotPassword} setShowForgotPassword={setShowForgotPassword}
        forgotPasswordSent={forgotPasswordSent} setForgotPasswordSent={setForgotPasswordSent}
        forgotPasswordEmail={forgotPasswordEmail} setForgotPasswordEmail={setForgotPasswordEmail}
        forgotPasswordError={forgotPasswordError} processing={processing}
        handleForgotPassword={handleForgotPassword}
      />
    </div >
  );
}

