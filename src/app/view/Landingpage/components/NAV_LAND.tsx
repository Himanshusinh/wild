"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { User, X, ChevronDown, ChevronUp, LogOut } from "lucide-react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"

import { APP_ROUTES, NAV_ROUTES, FEATURE_ROUTES, IMAGEGENERATION, BRANDINGKIT, VIDEOGENERATION, MUSICGENERATION } from "@/routes/routes"
import { getImageUrl } from "@/routes/imageroute"
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react"

interface NAV_LANDProps {
  onGetStarted: () => void;
}

// ============================================================================
// FEATURE CATEGORIES DATA - Edit these arrays to add/remove features
// ============================================================================

interface FeatureItem {
  title: string
  href: string
  coming?: boolean
}

// Image Generation Features
const imageGenerationFeatures: FeatureItem[] = [
  { title: "Text to Image", href: IMAGEGENERATION.TEXT_TO_IMAGE },
  { title: "Image to Image", href: IMAGEGENERATION.TEXT_TO_IMAGE },
]

// Branding Kit Features
const brandingKitFeatures: FeatureItem[] = [
  // { title: "Logo Generation", href: BRANDINGKIT.LOGO_GENERATION },
  // { title: "Mockup Generation", href: BRANDINGKIT.MOCKUP_GENERATION },
  // { title: "Product with Model Poses", href: BRANDINGKIT.PRODUCT_WITH_MODEL_POSE },
  // { title: "Product Generation", href: BRANDINGKIT.PRODUCT_GENERATION },
  // { title: "Add Music in Image", href: '#', coming: true },
  // { title: "Add Music in Video", href: '#', coming: true },
]

// Video Generation Features
const videoGenerationFeatures: FeatureItem[] = [
  { title: "Text to Video", href: VIDEOGENERATION.TEXT_TO_VIDEO },
  { title: "Image to Video", href: VIDEOGENERATION.TEXT_TO_VIDEO },
  { title: "Lipsync", href: `${VIDEOGENERATION.TEXT_TO_VIDEO}?feature=lipsync` },
  { title: "Animation", href: `${VIDEOGENERATION.TEXT_TO_VIDEO}?feature=animation` },
]

// Audio Generation Features
const audioGenerationFeatures: FeatureItem[] = [
  { title: "Text to Music", href: MUSICGENERATION.TEXT_TO_MUSIC },
  { title: "Voice (TTS)", href: `${MUSICGENERATION.TEXT_TO_MUSIC}?feature=tts` },
  { title: "Dialogue", href: `${MUSICGENERATION.TEXT_TO_MUSIC}?feature=dialogue` },
  { title: "SFX", href: `${MUSICGENERATION.TEXT_TO_MUSIC}?feature=sfx` },
  { title: "Voice Cloning", href: `${MUSICGENERATION.TEXT_TO_MUSIC}?feature=voice-cloning` },
]

const ImageEdit: FeatureItem[] = [
  { title: "Upscale", href: '/view/EditImage?feature=upscale', },
  { title: "Remove BG", href: '/view/EditImage?feature=remove-bg', },
  { title: "Erase/Replace", href: '/view/EditImage?feature=erase-replace', },
  { title: "Resize", href: '/view/EditImage?feature=resize', },
  { title: "Vectorize", href: '/view/EditImage?feature=vectorize', },
  { title: "Chat to Edit", href: NAV_ROUTES.LIVE_CHAT, },
  { title: "Editor", href: process.env.NEXT_PUBLIC_CANVAS_URL || 'http://localhost:3001' },
]

const VideoEdit: FeatureItem[] = [
  { title: "Upscale", href: '/view/EditVideo?feature=upscale', coming: true },
  { title: "Remove BG", href: '/view/EditVideo?feature=remove-bg', coming: true },
]
const WildMindPro: FeatureItem[] = [
  { title: "Canvas", href: '/canvas-projects' },
  { title: "Video Editor", href: '/view/EditVideo?feature=video-editor' },
]

// ============================================================================
// INLINE FEATURE COMPONENTS - Used in desktop dropdown
// ============================================================================

const ImageGenerationSection = () => (
  <div className="group">
    <h3 className="text-regular font-semibold text-white md:text-sm cursor-pointer hover:text-blue-400 transition-colors pb-2">
      Image Generation
    </h3>
    <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 pt-1">
        {imageGenerationFeatures.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="text-white/80 hover:text-blue-400 transition-all duration-200 text-sm py-1 px-2 rounded hover:bg-white/5"
          >
            {feature.title}
            {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
          </Link>
        ))}
      </div>
    </div>
  </div>
)

const BrandingKitSection = () => (
  <div className="group">
    <h3 className="text-regular font-semibold text-white md:text-sm cursor-pointer hover:text-blue-400 transition-colors pb-2">
      Branding Kit
    </h3>
    <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 pt-1">
        {brandingKitFeatures.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="text-white/80 hover:text-blue-400 transition-all duration-200 text-sm py-1 px-2 rounded hover:bg-white/5"
          >
            {feature.title}
            {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
          </Link>
        ))}
      </div>
    </div>
  </div>
)

const VideoGenerationSection = () => (
  <div className="group">
    <h3 className="text-regular font-semibold text-white md:text-sm cursor-pointer hover:text-blue-400 transition-colors pb-2">
      Video Generation
    </h3>
    <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 pt-1">
        {videoGenerationFeatures.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="text-white/80 hover:text-blue-400 transition-all duration-200 text-sm py-1 px-2 rounded hover:bg-white/5"
          >
            {feature.title}
            {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
          </Link>
        ))}
      </div>
    </div>
  </div>
)

const AudioGenerationSection = () => (
  <div className="group">
    <h3 className="text-regular font-semibold text-white md:text-sm cursor-pointer hover:text-blue-400 transition-colors pb-2">
      Audio Generation
    </h3>
    <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 pt-1">
        {audioGenerationFeatures.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="text-white/80 hover:text-blue-400 transition-all duration-200 text-sm py-1 px-2 rounded hover:bg-white/5"
          >
            {feature.title}
            {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
          </Link>
        ))}
      </div>
    </div>
  </div>
)

const ImageEditSection = () => (
  <div className="group">
    <h3 className="text-regular font-semibold text-white md:text-sm cursor-pointer hover:text-blue-400 transition-colors pb-2">
      Image Edit
    </h3>
    <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 pt-1">
        {ImageEdit.map((feature, index) => {
          const className = "text-white/80 hover:text-blue-400 transition-all duration-200 text-sm py-1 px-2 rounded hover:bg-white/5";
          const isExternal = /^https?:\/\//.test(feature.href);
          return isExternal ? (
            <a key={index} href={feature.href} target="_blank" rel="noopener noreferrer" className={className}>
              {feature.title}
              {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
            </a>
          ) : (
            <Link key={index} href={feature.href} className={className}>
              {feature.title}
              {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
            </Link>
          );
        })}
      </div>
    </div>
  </div>
)

const VideoEditSection = () => (
  <div className="group">
    <h3 className="text-regular font-semibold text-white md:text-sm cursor-pointer hover:text-blue-400 transition-colors pb-2">
      Video Edit
    </h3>
    <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 pt-1">
        {VideoEdit.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="text-white/80 hover:text-blue-400 transition-all duration-200 text-sm py-1 px-2 rounded hover:bg-white/5"
          >
            {feature.title}
            {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
          </Link>
        ))}
      </div>
    </div>
  </div>
)

const WildMindProSection = () => (
  <div className="group">
    <h3 className="text-regular font-semibold text-white md:text-sm cursor-pointer hover:text-blue-400 transition-colors pb-2">
      WildMind Pro
    </h3>
    <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 pt-1">
        {WildMindPro.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="text-white/80 hover:text-blue-400 transition-all duration-200 text-sm py-1 px-2 rounded hover:bg-white/5"
          >
            {feature.title}
            {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
          </Link>
        ))}
      </div>
    </div>
  </div>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const NAV_LAND = ({ onGetStarted }: NAV_LANDProps) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [scrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userSlug, setUserSlug] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const router = useRouter()

  // Scroll detection for resizable functionality
  const { scrollY } = useScroll({
    target: headerRef,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });



  useEffect(() => {
    // Handle clicks outside the menu to close it
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown)
  }

  const handleGetStarted = () => {
    // if (isLoggedIn && userSlug) {
    //   router.push(`/view/home/${userSlug}`)
    // } else {
    //   router.push(APP_ROUTES.SIGNUP)
    // }
    onGetStarted()
  }

  // Ensure desktop dropdown never shows while hamburger is open
  useEffect(() => {
    if (isMobileMenuOpen && activeDropdown) {
      setActiveDropdown(null)
    }
  }, [isMobileMenuOpen])

  const handleLogout = async () => {
    try { await signOut(auth) } catch { }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; ${expired}; SameSite=Lax`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`
      } catch { }
    } catch { }
    localStorage.removeItem('otpUser')
    localStorage.removeItem('username')
    localStorage.removeItem('slug')
    setUserEmail('')
    setUsername('')
    setIsLoggedIn(false)
    setUserSlug('')
    setIsUserDropdownOpen(false)
    if (typeof window !== 'undefined') {
      try {
        history.pushState(null, document.title, location.href)
        window.addEventListener('popstate', () => {
          history.pushState(null, document.title, location.href)
        })
      } catch { }
      window.location.replace('/view/Landingpage?toast=LOGOUT_SUCCESS')
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <motion.header
        ref={headerRef}
        animate={{
          backdropFilter: visible ? "blur(10px)" : "blur(10px)",
          boxShadow: visible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
            : "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset",
          width: visible ? "40%" : "45vw",
          y: visible ? 20 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        style={{
          minWidth: visible ? "40%" : "40vw",
        }}
        className={`fixed top-5 z-[1000] items-center justify-between p-0.5 rounded-[50px] 
         border-[1px] border-white/20 text-white text-sm
         ${scrolled ? "backdrop-blur-3xl bg-black/30 shadow-lg md:flex" : "backdrop-blur-3xl bg-black/10 shadow-lg md:flex"
          } transition-all duration-300 hidden `}
      >
        {/* Logo */}
        <div className="flex w-10 h-10 pl-2 ml-3 cursor-pointer" onClick={() => { try { console.log('[NAV_LAND] desktop logo clicked -> /view/Landingpage') } catch { }; router.push('/view/Landingpage') }}>
          {(() => {
            const logoUrl = getImageUrl("core", "logo");
            return logoUrl ? (
              <Image src={logoUrl} width={25} height={15} alt="logo" />
            ) : null;
          })()}
        </div>

        {/* Features Dropdown */}
        <div
          className="relative"
        >
          <span
            className="cursor-pointer px-3 py-1 flex items-center gap-1 hover:bg-gradient-to-l hover:bg-clip-text font-poppins bg-transparent hover:text-[#dbdbdb]"
            onClick={() => toggleDropdown("features")}
          >
            Features
            <Image
              width={12}
              height={12}
              src={activeDropdown === "features" ? getImageUrl("core", "arrowup") : getImageUrl("core", "arrowdown")}
              alt="dropdown-arrow"
              className="ml-1"
            />
          </span>
        </div>


        {/* Other Links */}
        <div>
          <span
            className="px-3 py-1 hover:bg-gradient-to-l hover:bg-clip-text cursor-pointer hover:text-[#dbdbdb]"
            onClick={() => router.push(NAV_ROUTES.PRICING)}
          >
            Pricing
          </span>
        </div>
        <div>
          <span
            className="px-3 py-1 hover:bg-gradient-to-l hover:bg-clip-text cursor-pointer hover:text-[#dbdbdb] flex-nowrap"
            onClick={() => router.push(NAV_ROUTES.ART_STATION)}
          >
            Art Station
          </span>
        </div>

        {/* Get Started Button */}
        <div>
          <button
            className="md:block md:flex-nowrap  
                       px-4 py-1.5 mr-2 rounded-full  button bg-[#1C303D] text-white text-sm font-regular relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>

      </motion.header>

      {/* Features Dropdown (desktop-only) - prevent showing when hamburger is open */}
      <AnimatePresence>
        {activeDropdown === "features" && !isMobileMenuOpen && (
          <motion.div
            key="features-dropdown-desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="hidden md:block fixed left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-xl bg-black/10 shadow-lg border border-white/20 rounded-3xl px-10 py-8 md:px-6 md:py-6 transition-all duration-300"
            style={{
              width: visible ? "40%" : "45vw",
              minWidth: visible ? "40%" : "40vw",
              top: visible ? "6rem" : "4.7rem",
            }}
          >
            <div className="grid grid-cols-3 gap-6 font-poppins">
              <ImageGenerationSection />
              <VideoGenerationSection />
              <AudioGenerationSection />
              <ImageEditSection />
              <VideoEditSection />
              <WildMindProSection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <motion.div
        className="fixed top-0 left-0 w-full z-[1000] md:hidden bg-transparent shadow-none"
      >
        <div className="flex items-center justify-between px-5 py-2 bg-transparent">
          {/* Left: Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => { try { console.log('[NAV_LAND] mobile brand clicked -> /view/Landingpage') } catch { }; router.push('/view/Landingpage') }}>
            {(() => {
              const logoUrl = getImageUrl("core", "logo");
              return logoUrl ? (
                <Image src={logoUrl} width={32} height={20} alt="logo" />
              ) : null;
            })()}
          </div>

          {/* Right: Hamburger */}
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {isUserDropdownOpen && (
            <motion.div
              key="user-dropdown-mobile"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-4 top-16 w-[180px] bg-black/90 backdrop-blur-xl rounded-md shadow-lg z-30"
            >
              <div className="py-2 flex flex-col">
                <div className="px-4 py-2 text-white flex flex-col items-start">
                  <span className="text-sm font-semibold">{username || "Guest"}</span>
                  <span className="text-xs text-gray-400">{userEmail || "Not signed in"}</span>
                </div>
                <button onClick={handleLogout} className="px-4 py-2 text-white hover:text-blue-400 flex items-center">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Sidebar */}
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={() => setIsMobileMenuOpen(false)}></div>

            {/* Sidebar */}
            <div
              ref={menuRef}
              className="fixed inset-y-0 right-0 w-[70%] bg-black/70 backdrop-blur-xl border-l border-white/20 z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right h-full overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-end items-center p-4 border-b border-white/10 bg-black/60 backdrop-blur-sm">
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 flex flex-col space-y-4 bg-black/95 backdrop-blur-sm">
                {/* Features Dropdown */}
                <div className="border-b border-gray-800 pb-3">
                  <div
                    className="flex justify-between items-center py-2 cursor-pointer"
                    onClick={() => toggleDropdown("features")}
                  >
                    <span className="text-white text-lg">Features</span>
                    {activeDropdown === "features" ? (
                      <ChevronUp className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <AnimatePresence>
                    {activeDropdown === "features" && (
                      <motion.div
                        key="features-dropdown-mobile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="mt-2 ml-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm px-2 py-2"
                      >
                        {/* Scrollable container to fit on smaller screens */}
                        <div className="grid grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
                          {/* Image Generation */}
                          <div className="space-y-2">
                            <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Image Generation</h4>
                            <div className="space-y-1 pl-2">
                              {imageGenerationFeatures.map((feature, index) => (
                                <div
                                  key={index}
                                  className={`py-1.5 text-[14px] ${feature.coming ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:text-white cursor-pointer'}`}
                                  onClick={() => {
                                    if (!feature.coming) {
                                      router.push(feature.href)
                                      setIsMobileMenuOpen(false)
                                    }
                                  }}
                                >
                                  {feature.title} {feature.coming && '(Soon)'}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Branding Kit */}
                          <div className="space-y-2">
                            <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Branding Kit</h4>
                            <div className="space-y-1 pl-2">
                              {brandingKitFeatures.map((feature, index) => (
                                <div
                                  key={index}
                                  className={`py-1.5 text-[14px] ${feature.coming ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:text-white cursor-pointer'}`}
                                  onClick={() => {
                                    if (!feature.coming) {
                                      router.push(feature.href)
                                      setIsMobileMenuOpen(false)
                                    }
                                  }}
                                >
                                  {feature.title} {feature.coming && '(Soon)'}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Video Generation */}
                          <div className="space-y-2">
                            <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Video Generation</h4>
                            <div className="space-y-1 pl-2">
                              {videoGenerationFeatures.map((feature, index) => (
                                <div
                                  key={index}
                                  className={`py-1.5 text-[14px] ${feature.coming ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:text-white cursor-pointer'}`}
                                  onClick={() => {
                                    if (!feature.coming) {
                                      router.push(feature.href)
                                      setIsMobileMenuOpen(false)
                                    }
                                  }}
                                >
                                  {feature.title} {feature.coming && '(Soon)'}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Audio Generation */}
                          <div className="space-y-2">
                            <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Audio Generation</h4>
                            <div className="space-y-1 pl-2">
                              {audioGenerationFeatures.map((feature, index) => (
                                <div
                                  key={index}
                                  className={`py-1.5 text-[14px] ${feature.coming ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:text-white cursor-pointer'}`}
                                  onClick={() => {
                                    if (!feature.coming) {
                                      router.push(feature.href)
                                      setIsMobileMenuOpen(false)
                                    }
                                  }}
                                >
                                  {feature.title} {feature.coming && '(Soon)'}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Image Edit */}
                          <div className="space-y-2">
                            <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Image Edit</h4>
                            <div className="space-y-1 pl-2">
                              {ImageEdit.map((feature, index) => (
                                <div
                                  key={index}
                                  className={`py-1.5 text-[14px] ${feature.coming ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:text-white cursor-pointer'}`}
                                  onClick={() => {
                                    if (!feature.coming) {
                                      router.push(feature.href)
                                      setIsMobileMenuOpen(false)
                                    }
                                  }}
                                >
                                  {feature.title} {feature.coming && '(Soon)'}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Video Edit */}
                          <div className="space-y-2">
                            <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Video Edit</h4>
                            <div className="space-y-1 pl-2">
                              {VideoEdit.map((feature, index) => (
                                <div
                                  key={index}
                                  className={`py-1.5 text-[14px] ${feature.coming ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:text-white cursor-pointer'}`}
                                  onClick={() => {
                                    if (!feature.coming) {
                                      router.push(feature.href)
                                      setIsMobileMenuOpen(false)
                                    }
                                  }}
                                >
                                  {feature.title} {feature.coming && '(Soon)'}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* WildMind Pro */}
                          <div className="space-y-2">
                            <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">WildMind Pro</h4>
                            <div className="space-y-1 pl-2">
                              {WildMindPro.map((feature, index) => (
                                <div
                                  key={index}
                                  className={`py-1.5 text-[14px] ${feature.coming ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:text-white cursor-pointer'}`}
                                  onClick={() => {
                                    if (!feature.coming) {
                                      router.push(feature.href)
                                      setIsMobileMenuOpen(false)
                                    }
                                  }}
                                >
                                  {feature.title} {feature.coming && '(Soon)'}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Commented out sections for future use */}
                          {/* <div className="space-y-3">
                          <h4 className="text-white font-semibold text-sm">Filming Tools</h4>
                          <div className="space-y-2 pl-4">
                            <div className="py-1 text-gray-300 hover:text-white cursor-pointer">
                              Video Editing
                            </div>
                            <div className="py-1 text-gray-300 hover:text-white cursor-pointer">
                              Background Removal
                            </div>
                          </div>
                        </div> */}

                          {/* <div className="space-y-3">
                          <h4 className="text-white font-semibold text-sm">3D Design</h4>
                          <div className="space-y-2 pl-4">
                            <div className="py-1 text-gray-300 hover:text-white cursor-pointer">
                              3D Model Generation
                            </div>
                            <div className="py-1 text-gray-300 hover:text-white cursor-pointer">
                              Texture Generation
                            </div>
                          </div>
                        </div> */}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Templates */}
                <div
                  className="py-2 text-lg text-white border-b border-gray-800 pb-3 cursor-pointer"
                  onClick={() => {
                    router.push(NAV_ROUTES.TEMPLATES)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Templates
                </div>

                {/* Pricing */}
                <div
                  className="py-2 text-lg text-white border-b border-gray-800 pb-3 cursor-pointer"
                  onClick={() => {
                    router.push(NAV_ROUTES.PRICING)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Pricing
                </div>

                {/* Art Station */}
                <div
                  className="py-2 text-lg text-white border-b border-gray-800 pb-3 cursor-pointer"
                  onClick={() => {
                    router.push(NAV_ROUTES.ART_STATION)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Art Station
                </div>

                {/* Removed in favor of floating mobile button */}

              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
  )
}

export default NAV_LAND

