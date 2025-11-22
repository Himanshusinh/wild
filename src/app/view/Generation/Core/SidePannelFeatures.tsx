"use client";
import React from 'react'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ViewType, GenerationType } from '@/types/generation';
import { usePathname, useRouter } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { imageRoutes } from '../../HomePage/routes';
import { ensureSessionReady } from '@/lib/axiosInstance';
import { useCredits } from '@/hooks/useCredits';
import { getMeCached } from '@/lib/me';
import { APP_ROUTES, NAV_ROUTES } from '@/routes/routes';
import { setCurrentView } from '@/store/slices/uiSlice';

interface SidePannelFeaturesProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onGenerationTypeChange?: (type: GenerationType) => void;
  onWildmindSkitClick?: () => void;
  showMobileHeader?: boolean;
}

const SidePannelFeatures = ({
  currentView = 'generation',
  onViewChange = () => { },
  onGenerationTypeChange = () => { },
  onWildmindSkitClick = () => { },
  showMobileHeader = true
}: SidePannelFeaturesProps) => {


  const dispatch = useAppDispatch();
  const theme = useAppSelector((state: any) => state?.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
  const pathname = usePathname();
  const router = useRouter();
  const [showBrandingDropdown, setShowBrandingDropdown] = React.useState(false);
  const brandingClickCount = React.useRef(0);
  const [showVideoEditDropdown, setShowVideoEditDropdown] = React.useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = React.useState(false);
  // Track hover on floating desktop panels so moving from the sidebar
  // into the panel doesn't immediately close the dropdowns
  const [isPanelHovered, setIsPanelHovered] = React.useState(false);
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const brandingDropdownRef = React.useRef<HTMLDivElement>(null);
  const videoEditRef = React.useRef<HTMLDivElement>(null);
  const videoEditDropdownRef = React.useRef<HTMLDivElement>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<any>(null);
  const [avatarFailed, setAvatarFailed] = React.useState(false);

  // Credits (shared with top nav)
  const { creditBalance, refreshCredits, loading: creditsLoading, error: creditsError } = useCredits();

  React.useEffect(() => {
    (async () => {
      try {
        const me = await getMeCached();
        setUserData(me || null);
        await refreshCredits();
      } catch {}
    })();
  }, []);



  // Helper function to get URL for a generation type
  const getUrlForType = (type: GenerationType): string => {
    switch (type) {
      case 'text-to-image':
        return '/text-to-image';
      case 'text-to-video':
        return '/text-to-video';
      case 'text-to-music':
        return '/text-to-music';
      case 'edit-image':
        return '/edit-image';
      case 'edit-video':
        return '/edit-video';
      default:
        return '/';
    }
  };

  // Helper function to handle clicks with middle-click and Ctrl+click support
  const handleClickWithNewTab = (
    e: React.MouseEvent,
    url: string,
    onClickHandler?: () => void | Promise<void>
  ) => {
    // Check for middle-click (button === 1) or Ctrl+click (metaKey for Mac, ctrlKey for Windows/Linux)
    const isMiddleClick = e.button === 1;
    const isCtrlClick = e.ctrlKey || e.metaKey;

    if (isMiddleClick || isCtrlClick) {
      e.preventDefault();
      e.stopPropagation();
      // Open in new tab
      window.open(url, '_blank');
      return;
    }

    // Normal click - execute the handler
    if (onClickHandler && e.button === 0) {
      onClickHandler();
    }
  };

  // Prevent default middle-click scroll behavior on sidebar items
  React.useEffect(() => {
    const handleAuxClick = (e: MouseEvent) => {
      // Middle-click (button 1) on sidebar items
      if (e.button === 1 && sidebarRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    document.addEventListener('auxclick', handleAuxClick);
    return () => document.removeEventListener('auxclick', handleAuxClick);
  }, []);

  const navigateForType = async (type: GenerationType) => {
    try {
      const sessionReady = await ensureSessionReady(600)
      // Always proceed with navigation - middleware will handle auth with Bearer token if session cookie is missing
    } catch (error) {
      // Silent fail
    }

    // Always proceed with navigation - middleware will handle auth with Bearer token if session cookie is missing
    const url = getUrlForType(type);
    router.push(url);
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
    if (!showBrandingDropdown) {
      setShowBrandingDropdown(true);
      brandingClickCount.current = 1;
      setShowVideoEditDropdown(false);
      return;
    }
    brandingClickCount.current += 1;
    if (brandingClickCount.current >= 2) {
      setShowBrandingDropdown(false);
      brandingClickCount.current = 0;
    }
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
        brandingClickCount.current = 0;
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
  }, [showBrandingDropdown]);

  // Close dropdowns when neither the sidebar nor a floating panel is hovered (desktop only).
  React.useEffect(() => {
    if (!isSidebarHovered && !isPanelHovered && !isMobileMenuOpen) {
      const timer = setTimeout(() => {
        setShowBrandingDropdown(false);
        setShowVideoEditDropdown(false);
      }, 150); // 150ms delay

      return () => clearTimeout(timer);
    }
  }, [isSidebarHovered, isPanelHovered, isMobileMenuOpen]);

  const isBrandingActive = pathname?.includes('/logo') ||
    pathname?.includes('/sticker-generation') ||
    pathname?.includes('/mockup-generation') ||
    pathname?.includes('/product-generation');

  const isVideoEditActive = pathname === '/edit-video' || pathname?.startsWith('/edit-video') || pathname?.includes('/EditVideo') || pathname?.includes('edit-video') || pathname?.includes('/video-edit');

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
      className='fixed top-0 bottom-0 left-0 flex flex-col gap-3 md:py-6 py-0 md:px-3 bg-transparent backdrop-blur-3xl   group transition-all text-white duration-200  backdrop-blur-lg md:w-[68px] w-[50px] hover:w-60 z-40  shadow-2xl'
      style={{
        // borderTopLeftRadius: '16px',
        // borderBottomLeftRadius: '16px',
        // borderTopRightRadius: '16px',
        // borderBottomRightRadius: '16px'
      }}
    >
      {/* Logo at the top */}
      <div className="flex items-center gap-4 md:p-2 px-3 py-1 md:mb-4 mb-0  -ml-1">
        <div
          onMouseDown={(e) => handleClickWithNewTab(e, '/view/Landingpage', () => {
            try { console.log('[SidePanel] logo clicked -> /view/Landingpage') } catch { }
            try { dispatch(setCurrentView('landing')); } catch { }
            // Force hard navigation to avoid race conditions
            try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); }
          })}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              try { console.log('[SidePanel] logo clicked -> /view/Landingpage') } catch { }
              try { dispatch(setCurrentView('landing')); } catch { }
              try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); }
            }
          }}
          className="md:w-[34px] md:h-[34px] w-[25px] h-[25px] flex-none cursor-pointer relative z-[2001]">
          <Image
            src="/icons/wildmind_icon_darkbg.svg"
            
            // src={imageRoutes.core.logo}
            alt="Wild Mind Logo"
            width={32}
            height={32}
            className="w-full h-full"
          />
        </div>
        <span
          onClick={() => { try { console.log('[SidePanel] brand clicked -> /view/Landingpage') } catch { }; try { dispatch(setCurrentView('landing')); } catch { }; try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); } }}
          className='text-white md:w-[34px] md:h-[34px] w-[25px] h-[25px] text-3xl mt-1 font-medium overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap cursor-pointer'>
          <Image src="/icons/wildmind_text_whitebg (2).svg" alt="Wild Mind Logo" width={32} height={32} className="w-auto h-full" />
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
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/text-to-image')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.imageGeneration} alt="Image Generation" width={30} height={30} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Image Generation</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('edit-image')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/edit-image')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.editImage} alt="Image Edit " width={30} height={30} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Image Edit</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('text-to-video')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/text-to-video')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.videoGeneration} alt="Video Generation" width={30} height={30} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Video Generation</span>
        </div>
      </div>

      <div>
        <div
          onMouseDown={(e) => handleClickWithNewTab(e, '/edit-video', () => handleGenerationTypeChange('edit-video'))}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              handleGenerationTypeChange('edit-video');
            }
          }}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${isVideoEditActive ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.videoEdit} alt="Video Edit" width={30} height={30} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Video Edit</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('text-to-music')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/text-to-music')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.musicGeneration} alt="Music Generation" width={30} height={30} />
          <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Music Generation</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => router.push(NAV_ROUTES.LIVE_CHAT)}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/live-chat')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.canvas} alt="Live Chat" width={28} height={28} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Live Canvas</span>
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
          className={`flex items-center gap-4 p-2 z-0 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${isBrandingActive ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.core.brandingKit} alt="Branding Kit" width={30} height={30} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Branding Kit</span>
        </div>

          {/* Mobile: expand below item */}
          <div
            ref={brandingDropdownRef}
            className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${showBrandingDropdown ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className='mt-2 ml-12 mr-2 bg-transparent backdrop-blur-0 border border-white/20 rounded-2xl shadow-none p-2 space-y-1'>

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
            </div>

          </div>
        </div>

      {/* Art Station */}
      <div>
        <div
          onClick={() => router.push('/view/ArtStation')}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/ArtStation')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.artStation} alt="Art Station" width={28} height={28} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Art Station</span>
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
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/pricing')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.pricing} alt="Pricing" width={30} height={30} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>Pricing</span>
        </div>
      </div>

      <div>
        <div
          onMouseDown={(e) => handleClickWithNewTab(e, '/history', () => {
            try {
              if (onViewChange && typeof onViewChange === 'function') {
                onViewChange('history');
              }
            } catch (error) {
              console.error('Error in history click handler:', error);
            }
            router.push('/history');
          })}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              try {
                if (onViewChange && typeof onViewChange === 'function') {
                  onViewChange('history');
                }
              } catch (error) {
                console.error('Error in history click handler:', error);
              }
              router.push('/history');
            }
          }}
          className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${(pathname === '/history' || pathname?.startsWith('/history')) ? 'bg-white/10' : ''}`}
        >
          <Image src={imageRoutes.icons.history} alt="History" width={30} height={30} />
          <span className={`text-white overflow-hidden transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2 ${isMobileMenuOpen ? 'w-auto' : 'w-0 group-hover:w-auto'}`}>History</span>
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

      {/* Bottom: credits + profile */}
      <div className='mt-auto pb-3'>
        <div className='flex items-center gap-2 px-2'>
          
          <div
            onMouseDown={(e) => handleClickWithNewTab(e, NAV_ROUTES.ACCOUNT_MANAGEMENT, () => router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT);
              }
            }}
            className={`flex items-center gap-2 p-0 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item`}
            role='button'
            aria-label='Profile'
          >
            <div className='w-[30px] h-[30px] rounded-full overflow-hidden bg-white/10 flex items-center justify-center'>
              {userData?.photoURL && !avatarFailed ? (
                <img
                  src={userData.photoURL}
                  alt='profile'
                  referrerPolicy='no-referrer'
                  onError={() => setAvatarFailed(true)}
                  className='w-full h-full object-cover'
                />
              ) : (
                <Image src="/icons/person.svg" alt='profile' width={24} height={24} className='w-5 h-5' />
              )}
            </div>
            {/* <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Profile</span> */}
          </div>

          <button
            onClick={() => refreshCredits()}
            className='text-xs flex items-center gap-2 bg-white/15 border border-white/15 backdrop-blur-3xl rounded-full shadow-xl p-1 px-0 overflow-hidden w-0 opacity-0 pointer-events-none group-hover:w-auto group-hover:px-2 group-hover:opacity-100 group-hover:pointer-events-auto transition-all'
            title={`Credits: ${creditBalance ?? userData?.credits ?? 0}${creditsError ? ` (Error: ${creditsError})` : ''}`}
          >
            {creditsLoading ? '...' : (creditBalance ?? userData?.credits ?? 0)}
            <Image className='cursor-pointer w-4 h-4' src="/icons/coinswhite.svg" alt='credits' width={16} height={16} />
          </button>
        </div>
      </div>


    </div>
  );
}

export default SidePannelFeatures