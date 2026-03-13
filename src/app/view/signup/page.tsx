"use client"

import SignInForm from "./sign-up-form"
import RightImageGallery from "./components/RightImageGallery"

export default function SignUp() {
  return (
    <main className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-[#1C1C20] w-full">
      {/* Left Side - Form - Full width on mobile/tablet, 50% on desktop; fixed height on desktop to prevent layout shift */}
      <div className="w-full lg:w-[50%] min-h-screen lg:h-full lg:min-h-0 lg:overflow-hidden relative z-20 bg-[#1C1C20] flex flex-col">
        <SignInForm />
      </div>

      {/* Right Side - 3-column scrolling image gallery (desktop only) */}
      <div className="hidden lg:flex flex-1 lg:h-full lg:min-h-0 min-h-screen relative bg-transparent w-[50%] z-10">
        <RightImageGallery />
      </div>
    </main>
  )
}
