"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { User, X, ChevronDown, ChevronUp, LogOut } from "lucide-react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"

import { APP_ROUTES, NAV_ROUTES, FEATURE_ROUTES, IMAGEGENERATION, BRANDINGKIT, VIDEOGENERATION, MUSICGENERATION } from "@/routes/routes"
import { getImageUrl } from "@/routes/imageroute"
import ImageGeneration from "../../core/feature-categories/ImageGeneration"
import BrandingKit from "../../core/feature-categories/BrandingKit"
import VideoGeneration from "../../core/feature-categories/VideoGeneration"
import AudioGeneration from "../../core/feature-categories/AudioGeneration"
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react"

interface NAV_LANDProps {
  onGetStarted: () => void;
}

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
    try { await signOut(auth) } catch {}
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`
        document.cookie = `app_session=; ${expired}; SameSite=Lax`
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`
      } catch {}
    } catch {}
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
      } catch {}
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
         ${
           scrolled ? "backdrop-blur-3xl bg-black/30 shadow-lg md:flex" : "backdrop-blur-3xl bg-black/10 shadow-lg md:flex"
         } transition-all duration-300 hidden `}
       >
        {/* Logo */}
        <div className="flex w-10 h-10 pl-2 ml-3 cursor-pointer" onClick={() => { try { console.log('[NAV_LAND] desktop logo clicked -> /view/Landingpage') } catch {}; router.push('/view/Landingpage') }}>
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

        <div>
          <span
            className="px-3 py-1 hover:bg-gradient-to-l hover:bg-clip-text cursor-pointer hover:text-[#dbdbdb]"
            onClick={() => router.push(NAV_ROUTES.TEMPLATES)}
          >
            Workflows
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
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 font-poppins">
              <div className="col-span-1 md:col-span1">
                <ImageGeneration />
              </div>
              <div className="col-span-1 md:col-span1">
                <BrandingKit />
              </div>
              <div className="col-span-1 md:col-span1">
                <VideoGeneration />
              </div>
              <div className="col-span-1 md:col-span1">
                <AudioGeneration />
              </div>
              {/* <div className="col-span-1"> */}
                {/* <FilmingTools /> */}
              {/* </div> */}
              {/* <div className="col-span-1"> */}
                {/* <ThreeDDesign /> */}
              {/* </div> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <motion.div 
        className="fixed top-0 left-0 w-full z-[1000] md:hidden bg-transparent shadow-none"
      >
        <div className="mt-2 mx-2 flex items-center justify-between px-6 py-3 bg-transparent">
          {/* Left: Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => { try { console.log('[NAV_LAND] mobile brand clicked -> /view/Landingpage') } catch {}; router.push('/view/Landingpage') }}>
          {(() => {
            const logoUrl = getImageUrl("core", "logo");
            return logoUrl ? (
              <Image src={logoUrl} width={32} height={20} alt="logo" />
            ) : null;
          })()}
          </div>

          {/* Right: Hamburger - only show when menu is closed */}
          {!isMobileMenuOpen && (
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
          )}
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
            {/* Overlay - transparent on mobile, unchanged on md+ */}
            <div className="fixed inset-0 bg-transparent md:bg-black/30 backdrop-blur-[2px] z-40" onClick={() => setIsMobileMenuOpen(false)}></div>

            {/* Sidebar */}
            <div
              ref={menuRef}
              className="fixed top-2 right-2 w-[68%] z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden"
            >
          <div className="flex justify-end items-center p-3 rounded-t-3xl">
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-0 md:mt-1 mx-2 md:mx-3 p-3 md:p-4 flex flex-col space-y-3 bg-transparent md:bg-black/90 rounded-2xl border border-white/15 overflow-y-auto custom-scrollbar max-h-[calc(90vh-4rem)] pb-4 md:pb-6">
                {/* Features Dropdown */}
                <div className="pb-2">
                  <div
                    className="flex justify-between items-center py-2 cursor-pointer"
                    onClick={() => toggleDropdown("features")}
                  >
                    <span className="text-white text-base">Features</span>
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
                      className="mt-2 -mx-4 rounded-none border border-white/10 bg-black/40 px-4 py-3"
                    >
                      {/* Expanded container: no inner scroll, show all items */}
                      <div className="grid grid-cols-1 gap-3 pr-1">
                        <div className="space-y-2">
                          <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Image Generation</h4>
                          <div className="space-y-1 pl-2">
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(IMAGEGENERATION.TEXT_TO_IMAGE)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Text to Image
                            </div>
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(IMAGEGENERATION.IMAGE_TO_IMAGE)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Image to Image
                            </div>
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(IMAGEGENERATION.STICKER_GENERATION)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              AI Sticker Generation
                            </div>
                            <div className="py-1.5 text-[14px] text-gray-500 cursor-not-allowed">
                              Live Portrait (Soon)
                            </div>
                            <div className="py-1.5 text-[14px] text-gray-500 cursor-not-allowed">
                              Inpaint (Soon)
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Branding Kit</h4>
                          <div className="space-y-1 pl-2">
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(BRANDINGKIT.LOGO_GENERATION)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Logo Generation
                            </div>
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(BRANDINGKIT.MOCKUP_GENERATION)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Mockups Generation
                            </div>
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(BRANDINGKIT.PRODUCT_WITH_MODEL_POSE)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Product with Model Poses
                            </div>
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(BRANDINGKIT.PRODUCT_GENERATION)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Product Generation
                            </div>
                            <div className="py-1.5 text-[14px] text-gray-500 cursor-not-allowed">
                              Add Music in Image (Soon)
                            </div>
                            <div className="py-1.5 text-[14px] text-gray-500 cursor-not-allowed">
                              Add Music in Video (Soon)
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Video Generation</h4>
                          <div className="space-y-1 pl-2">
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(VIDEOGENERATION.TEXT_TO_VIDEO)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Text to Video
                            </div>
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(VIDEOGENERATION.IMAGE_TO_VIDEO)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Image to Video
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-white/90 font-semibold text-[13px] tracking-wide">Audio Generation</h4>
                          <div className="space-y-1 pl-2">
                            <div
                              className="py-1.5 text-[14px] text-gray-200 hover:text-white cursor-pointer"
                              onClick={() => {
                                router.push(MUSICGENERATION.TEXT_TO_MUSIC)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              Text to Music
                            </div>
                            <div className="py-1 text-gray-500 cursor-not-allowed">
                              Voice Generation (Soon)
                            </div>
                          </div>
                        </div>

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
                  className="py-2 text-base text-white cursor-pointer"
                  onClick={() => {
                    router.push(NAV_ROUTES.TEMPLATES)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Templates
                </div>

                {/* Pricing */}
                <div
                  className="py-2 text-base text-white cursor-pointer"
                  onClick={() => {
                    router.push(NAV_ROUTES.PRICING)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Pricing
                </div>

                {/* Art Station */}
                <div
                  className="py-2 text-base text-white cursor-pointer"
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

