"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import IconButton from "@mui/material/IconButton"
import axiosInstance from "@/lib/axiosInstance"
import { auth } from "@/lib/firebase"
import RightImageGallery from "@/app/view/signup/components/RightImageGallery"
import {
  EyeIcon,
  EyeOffIcon,
  ValidationPopup,
  textFieldSx,
} from "@/app/view/signup/components/shared"

const passwordRequirements = [
  { label: "Password must be 8-14 character", test: (v: string) => v.length >= 8 && v.length <= 14 },
  { label: "At least 1 uppercase letter (A-Z)", test: (v: string) => /[A-Z]/.test(v) },
  { label: "At least 1 lowercase letter (a-z)", test: (v: string) => /[a-z]/.test(v) },
  { label: "At least 1 number (0-9)", test: (v: string) => /[0-9]/.test(v) },
  { label: "At least 1 special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams?.get("oobCode")
  const mode = searchParams?.get("mode")
  const expiresAtParam = searchParams?.get("expiresAt")
  const signature = searchParams?.get("sig")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [processing, setProcessing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [mounted, setMounted] = useState(false)

  const isPasswordValid = passwordRequirements.every((req) => req.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const isValid = isPasswordValid && passwordsMatch

  const redirectForCurrentAuthState = () => {
    if (typeof window === "undefined") {
      return
    }

    let isAuthenticated = false

    try {
      const hasSessionCookie =
        document.cookie.includes("app_session=") ||
        document.cookie.includes("auth_hint=")

      const hasStoredUser = Boolean(localStorage.getItem("user") || localStorage.getItem("authToken"))
      const hasFirebaseUser = Boolean(auth.currentUser)

      isAuthenticated = hasSessionCookie || hasStoredUser || hasFirebaseUser
    } catch {
      isAuthenticated = Boolean(auth.currentUser)
    }

    router.replace(isAuthenticated ? "/view/HomePage" : "/view/signup?showLogin=true")
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const expiresAt = Number(expiresAtParam)
    if (mode !== "resetPassword" || !oobCode || !signature || !Number.isFinite(expiresAt)) {
      toast.error("Invalid or expired reset link")
      redirectForCurrentAuthState()
      return
    }

    if (Date.now() > expiresAt) {
      toast.error("This password reset link has expired. Please request a new one.")
      redirectForCurrentAuthState()
    }
  }, [mounted, mode, oobCode, expiresAtParam, signature, router])

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const expiresAt = Number(expiresAtParam)

    if (!oobCode || mode !== "resetPassword" || !signature || !Number.isFinite(expiresAt)) {
      const invalidMsg = "Invalid reset link"
      setErrorMessage(invalidMsg)
      return
    }

    if (Date.now() > expiresAt) {
      const expiredMsg = "This password reset link has expired. Please request a new one."
      setErrorMessage(expiredMsg)
      return
    }

    if (!isPasswordValid) {
      const invalidMsg = "Password does not meet requirements"
      setErrorMessage(invalidMsg)
      return
    }

    if (!passwordsMatch) {
      const invalidMsg = "Passwords do not match"
      setErrorMessage(invalidMsg)
      return
    }

    setProcessing(true)
    setErrorMessage("")

    try {
      await axiosInstance.post(
        "/api/auth/reset-password/complete",
        { oobCode, newPassword, expiresAt, signature },
        {
          withCredentials: true,
          skipGlobalErrorToast: true,
        },
      )
      toast.success("Password reset successfully! You can now sign in.", {
        duration: 4000,
      })
      router.replace("/view/signup?showLogin=true")
    } catch (error: any) {
      console.error("Password reset error:", error)

      let nextError = "Failed to reset password. Please try again."

      if (error?.response?.data?.message) {
        nextError = error.response.data.message
      } else if (error?.code === "auth/expired-action-code") {
        nextError = "This password reset link has expired. Please request a new one."
      } else if (error?.code === "auth/invalid-action-code") {
        nextError = "This password reset link is invalid or has already been used."
      } else if (error?.code === "auth/weak-password") {
        nextError = "Password is too weak. Please choose a stronger password."
      } else if (typeof error?.message === "string" && error.message.trim()) {
        nextError = error.message
      }

      setErrorMessage(nextError)

      const normalizedError = nextError.toLowerCase()
      if (
        normalizedError.includes("invalid or has already been used") ||
        normalizedError.includes("invalid reset link") ||
        normalizedError.includes("expired reset link") ||
        normalizedError.includes("password reset link has expired")
      ) {
        window.setTimeout(() => {
          redirectForCurrentAuthState()
        }, 1200)
      }
    } finally {
      setProcessing(false)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-[#1C1C20]" />
  }

  return (
    <main className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-[#1C1C20] w-full">
      <div className="w-full lg:w-[50%] min-h-screen lg:h-full lg:min-h-0 lg:overflow-hidden relative z-20 bg-[#1C1C20] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-start pt-12 md:pt-10 lg:pt-12 xl:pt-14 2xl:pt-36 p-12 min-h-0 lg:overflow-y-auto">
          <div className="w-full max-w-[90%] sm:max-w-[340px] md:max-w-[180px] lg:max-w-[220px] xl:max-w-[260px] 2xl:max-w-[360px] mx-auto flex flex-col items-center">
            <div className="text-center w-full mb-4 sm:mb-4 lg:mb-4 xl:mb-4 2xl:mb-8">
              <p className="text-white text-md">Welcome to</p>
              <Link
                href="/view/signup?showLogin=true"
                className="flex justify-center items-center gap-1 mt-0 sm:mb-2 lg:mb-2 xl:mb-2 2xl:mb-4 cursor-pointer hover:opacity-90 transition-opacity no-underline"
                aria-label="Go to sign in page"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src="https://idr01.zata.ai/devstoragev1/public/core/logosquare.avif"
                    alt="WildMind Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide whitespace-nowrap">WildMind AI</h1>
              </Link>
              <p className="text-white text-[34px] font-bold leading-tight font-satoshi mt-6 sm:mt-6 lg:mt-6 xl:mt-6 2xl:mt-8">
                Reset Your Password
              </p>
              <p className="text-[#858585] text-sm mt-3 sm:mt-3 lg:mt-3 xl:mt-3 2xl:mt-4">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-3">
              <div className="relative">
                <TextField
                  label="New Password"
                  variant="outlined"
                  fullWidth
                  size="small"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  inputProps={{ maxLength: 14 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: "#858585" }}>
                          {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />
                {isPasswordFocused && (
                  <ValidationPopup requirements={passwordRequirements} value={newPassword} />
                )}
              </div>

              <TextField
                label="Confirm Password"
                variant="outlined"
                fullWidth
                size="small"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                inputProps={{ maxLength: 14 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} sx={{ color: "#858585" }}>
                        {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />

              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-center text-[12px] text-[#b6bfd1]">
                Choose a fresh password that is different from your last 3 passwords.
              </div>

              {errorMessage ? (
                <div className="rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-center text-[12px] text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              {!errorMessage && confirmPassword.length > 0 && !passwordsMatch ? (
                <div className="rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-center text-[12px] text-red-300">
                  Passwords do not match
                </div>
              ) : null}

              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={processing || !isValid}
                  className={`w-3/4 py-2.5 rounded-xl font-semibold transition-all ${
                    processing || !isValid
                      ? "bg-[#4182CF]/47 text-white/50 cursor-not-allowed"
                      : "bg-[#4182CF] hover:bg-[#4B8EDF] text-white"
                  }`}
                >
                  {processing ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 lg:h-full lg:min-h-0 min-h-screen relative bg-transparent w-[50%] z-10">
        <RightImageGallery />
      </div>
    </main>
  )
}
