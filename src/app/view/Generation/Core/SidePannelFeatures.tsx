"use client";
import React from 'react'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ViewType, GenerationType } from '@/types/generation';
import { usePathname, useRouter } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { imageRoutes } from '../../HomePage/routes';
import { ensureSessionReady } from '@/lib/axiosInstance';
import { APP_ROUTES, NAV_ROUTES } from '@/routes/routes';
import { setCurrentView } from '@/store/slices/uiSlice';

interface SidePannelFeaturesProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onGenerationTypeChange?: (type: GenerationType) => void;
  onWildmindSkitClick?: () => void;
}

const SidePannelFeatures = ({
  currentView = 'generation',
  onViewChange = () => { },
  onGenerationTypeChange = () => { },
  onWildmindSkitClick = () => { }
}: SidePannelFeaturesProps) => {


  const dispatch = useAppDispatch();
  const theme = useAppSelector((state: any) => state?.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
  const pathname = usePathname();
  const router = useRouter();
  const [showBrandingDropdown, setShowBrandingDropdown] = React.useState(false);
  const [showVideoEditDropdown, setShowVideoEditDropdown] = React.useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = React.useState(false);
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const videoEditRef = React.useRef<HTMLDivElement>(null);
  const brandingDropdownRef = React.useRef<HTMLDivElement>(null);
  const videoEditDropdownRef = React.useRef<HTMLDivElement>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);



  const navigateForType = async (type: GenerationType) => {
    try {
      const sessionReady = await ensureSessionReady(600)
      // Always proceed with navigation - middleware will handle auth with Bearer token if session cookie is missing
    } catch (error) {
      // Silent fail
    }

    // Always proceed with navigation - middleware will handle auth with Bearer token if session cookie is missing
    switch (type) {
      case 'text-to-image':
        router.push('/text-to-image');
        return;
      case 'text-to-video':
        router.push('/text-to-video');
        return;
      case 'text-to-music':
        router.push('/text-to-music');
        return;
      case 'edit-image':
        router.push('/edit-image');
        return;
      default:
        return;
    }
  };

  const handleGenerationTypeChange = async (type: GenerationType) => {
    try {
      if (onGenerationTypeChange && typeof onGenerationTypeChange === 'function') {
        onGenerationTypeChange(type);
      }
    } catch (error) {
      console.error('Error in handleGenerationTypeChange:', error);
    }
    setShowBrandingDropdown(false);
    await navigateForType(type);
  };

  const handleImageGenerationClick = () => {
    handleGenerationTypeChange('text-to-image');
  };

  const toggleBrandingDropdown = () => {
    setShowBrandingDropdown(!showBrandingDropdown);
    // Close video edit dropdown when opening branding dropdown
    setShowVideoEditDropdown(false);
  };

  const toggleVideoEditDropdown = () => {
    setShowVideoEditDropdown(!showVideoEditDropdown);
    // Close branding dropdown when opening video edit dropdown
    setShowBrandingDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdowns if clicking outside the sidebar entirely
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setShowBrandingDropdown(false);
        setShowVideoEditDropdown(false);
        return;
      }

      // Handle branding dropdown
      if (
        showBrandingDropdown &&
        brandingRef.current &&
        !brandingRef.current.contains(event.target as Node) &&
        !(brandingDropdownRef.current && brandingDropdownRef.current.contains(event.target as Node))
      ) {
        setShowBrandingDropdown(false);
      }

      // Handle video edit dropdown
      if (
        showVideoEditDropdown &&
        videoEditRef.current &&
        !videoEditRef.current.contains(event.target as Node) &&
        !(videoEditDropdownRef.current && videoEditDropdownRef.current.contains(event.target as Node))
      ) {
        setShowVideoEditDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrandingDropdown, showVideoEditDropdown]);

  // Close dropdowns when sidebar is not hovered (collapsed)
  React.useEffect(() => {
    if (!isSidebarHovered) {
      // Add a small delay to prevent dropdowns from closing too quickly
      const timer = setTimeout(() => {
        setShowBrandingDropdown(false);
        setShowVideoEditDropdown(false);
      }, 150); // 150ms delay

      return () => clearTimeout(timer);
    }
  }, [isSidebarHovered]);

  const isBrandingActive = pathname?.includes('/logo') ||
    pathname?.includes('/sticker-generation') ||
    pathname?.includes('/mockup-generation') ||
    pathname?.includes('/product-generation');

  const isVideoEditActive = pathname?.includes('/video-edit');

  return (
    <>
      {/* Mobile header: hamburger then logo */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div
          onClick={() => { try { console.log('[SidePanel Mobile] logo -> /view/Landingpage') } catch { }; try { dispatch(setCurrentView('landing')); } catch { }; try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); } }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Image src={imageRoutes.core.logo} alt="Wild Mind Logo" width={26} height={26} />
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <div
        ref={sidebarRef}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`fixed top-0 bottom-0 left-0 flex flex-col gap-3 md:py-6 py-0 md:px-3 group transition-all text-white duration-200 backdrop-blur-lg z-50 shadow-2xl md:w-[68px] hover:w-60
        ${isMobileMenuOpen ? 'w-[75%] bg-black/80 border-r border-white/20 rounded-r-3xl' : 'w-0 md:w-[68px]'}
        ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}
        style={{}}
      >
      {/* Logo at the top */}
      <div className="flex items-center gap-4 md:p-2 px-3 py-1 md:mb-4 mb-0  -ml-1">
        <div
          onClick={() => {
            try { console.log('[SidePanel] logo clicked -> /view/Landingpage') } catch { }
            try { dispatch(setCurrentView('landing')); } catch { }
            // Force hard navigation to avoid race conditions
            try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); }
          }}
          className="md:w-[34px] md:h-[34px] w-[25px] h-[25px] flex-none cursor-pointer">
          <Image
            src={imageRoutes.core.logo}
            alt="Wild Mind Logo"
            width={32}
            height={32}
            className="w-full h-full"
          />
        </div>
        <span
          onClick={() => { try { console.log('[SidePanel] brand clicked -> /view/Landingpage') } catch { }; try { dispatch(setCurrentView('landing')); } catch { }; try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); } }}
          className='text-white text-2xl mt-1 font-medium overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap cursor-pointer'>
          WildMind Ai
        </span>
      </div>

      <div>
        <div
          onClick={async () => {
            try {
              await ensureSessionReady(600)
            } catch (error) {
              // Silent fail
            }
            router.push(APP_ROUTES.HOME)
          }}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item`}
        >
          <Image src={imageRoutes.icons.home} alt="Home" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Home</span>
        </div>
      </div>

      <div className="relative">
        <div
          onClick={handleImageGenerationClick}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/text-to-image')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.imageGeneration} alt="Image Generation" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('edit-image')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/edit-image')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.editImage} alt="Image Edit " width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Edit</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('text-to-video')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/text-to-video')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.videoGeneration} alt="Video Generation" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Video Generation</span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={videoEditRef}
          onClick={toggleVideoEditDropdown}
          className={`flex items-center gap-4 p-2 z-0 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${isVideoEditActive ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.videoEdit} alt="Video Edit" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Video Edit</span>
        </div>

        {showVideoEditDropdown && (
          <div
            ref={videoEditDropdownRef}
            className='absolute left-full top-0 ml-4 bg-black/70 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl p-2 space-y-1 z-100 min-w-[200px]'
          >
            <div className='px-3 py-2 bg-white/10 border border-white/10 rounded-xl shadow-md z-10'>
              <span className='text-xs text-white/90 uppercase tracking-wider'>Video Edit</span>
            </div>

            <div
              onClick={() => router.push('/video-edit')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'video-edit' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Video Edit</span>
            </div>

            <div
              onClick={() => router.push('/video-edit')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'video-edit' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Video Edit</span>
            </div>

            <div
              onClick={() => router.push('/video-edit')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'video-edit' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Video Edit</span>
            </div>
          </div>)}

      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('text-to-music')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/text-to-music')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.musicGeneration} alt="Music Generation" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Music Generation</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => router.push(NAV_ROUTES.LIVE_CHAT)}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/live-chat')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.canvas} alt="Live Chat" width={28} height={28} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Live Canvas</span>
        </div>
      </div>

      

      {/* Wildmind Skit */}
      {/* <div>
        <div
          onClick={() => {
            try {
              if (onViewChange && typeof onViewChange === 'function') {
                onViewChange('workflows');
              }
            } catch (error) {
              console.error('Error in workflows click handler:', error);
            }
            router.push('/view/workflows');
          }}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/workflows')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.wildmindskit} alt="Wildmind Skit" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Wild Magic</span>
        </div>
      </div> */}


      <div className="relative">
        <div
          ref={brandingRef}
          onClick={toggleBrandingDropdown}
          className={`flex items-center gap-4 p-2 z-0 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${isBrandingActive ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.core.brandingKit} alt="Branding Kit" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Branding Kit</span>
        </div>

        {showBrandingDropdown && (
          <div
            ref={brandingDropdownRef}
            className='absolute left-full top-0 ml-4 bg-black/70 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl p-2 space-y-1 z-100 min-w-[200px]'
          >
            <div className='px-3 py-2 bg-white/10 border border-white/10 rounded-xl shadow-md z-10'>
              <span className='text-xs text-white/90 uppercase tracking-wider'>Branding Kit</span>
            </div>

            <div
              onClick={() => router.push('/logo-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'logo' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Logo Generation</span>
            </div>

            <div
              onClick={() => router.push('/sticker-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'sticker-generation' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Sticker Generation</span>
            </div>

            {/* <div
                        onClick={() => handleGenerationTypeChange('mockup-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${
                            currentGenerationType === 'mockup-generation' ? 'bg-white/15' : ''
                        }`}
                    >
                        <span className='text-sm text-white'>Mockup Generation</span>
                    </div> */}

            <div
              onClick={() => router.push('/product-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'product-generation' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Product Generation</span>
            </div>
          </div>)}

      </div>

      {/* Art Station */}
      <div>
        <div
          onClick={() => router.push('/view/ArtStation')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/ArtStation')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.artStation} alt="Art Station" width={28} height={28} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Art Station</span>
        </div>
      </div>

      {/* <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item'>
                <Image src="/icons/templateswhite.svg" alt="Templates" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Templates</span>
            </div>
        </div>  */}

      <div>
        <div
          onClick={() => router.push(NAV_ROUTES.PRICING)}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/pricing')) ? 'bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.pricing} alt="Pricing" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Pricing</span>
        </div>
      </div>

      

      <div>
        <div
          onClick={() => {
            try {
              if (onViewChange && typeof onViewChange === 'function') {
                onViewChange('history');
              }
            } catch (error) {
              console.error('Error in history click handler:', error);
            }
            router.push('/history');
          }}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname === '/history' || pathname?.startsWith('/history')) ? 'bg-white/10' : ''}`}
        >
          <Image src={imageRoutes.icons.history} alt="History" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>History</span>
        </div>
      </div>

      {/* Bookmarks - Commented out for now */}
      {/* <div>
            <div
                onClick={() => {
                  try {
                    if (onViewChange && typeof onViewChange === 'function') {
                      onViewChange('bookmarks');
                    }
                  } catch (error) {
                    console.error('Error in bookmarks click handler:', error);
                  }
                }}
                  className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${ (pathname === '/bookmarks' || pathname?.startsWith('/bookmarks')) ? 'bg-white/10' : '' }`}
            >
                <Image
                    src="/icons/Bookmarkwhite.svg"
                    alt="Bookmarks"
                    width={30}
                    height={30}
                />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Bookmarks</span>
            </div>
        </div> */}


    </div>
    </>
  )
}

export default SidePannelFeatures