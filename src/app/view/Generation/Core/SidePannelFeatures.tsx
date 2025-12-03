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
  const [isSidebarHovered, setIsSidebarHovered] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const brandingDropdownRef = React.useRef<HTMLDivElement>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const touchStartXRef = React.useRef<number | null>(null);
  const userData = useAppSelector((state: any) => state?.auth?.user || null);
  const [avatarFailed, setAvatarFailed] = React.useState(false);

  // Credits (shared with top nav)
  const { creditBalance, refreshCredits, loading: creditsLoading, error: creditsError } = useCredits();

  // Preload critical sidebar icons for faster loading
  React.useEffect(() => {
    const criticalIcons = [
      imageRoutes.icons.home,
      imageRoutes.icons.imageGeneration,
      imageRoutes.icons.videoGeneration,
      imageRoutes.icons.musicGeneration,
    ];
    criticalIcons.forEach((iconUrl) => {
      if (iconUrl && !iconUrl.startsWith('/')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = iconUrl;
        link.setAttribute('fetchPriority', 'high');
        // Check if link already exists to avoid duplicates
        const existing = document.head.querySelector(`link[href="${iconUrl}"]`);
        if (!existing) {
          document.head.appendChild(link);
        }
      }
    });
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
    closeMobileSidebar();
    await navigateForType(type);
  };

  // Helper to close mobile sidebar
  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleImageGenerationClick = () => {
    handleGenerationTypeChange('text-to-image');
  };

  const toggleBrandingDropdown = () => {
    setShowBrandingDropdown(!showBrandingDropdown);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrandingDropdown]);

  // Close dropdowns when sidebar is not hovered (collapsed)
  React.useEffect(() => {
    if (!isSidebarHovered) {
      // Add a small delay to prevent dropdowns from closing too quickly
      const timer = setTimeout(() => {
        setShowBrandingDropdown(false);
      }, 150); // 150ms delay

      return () => clearTimeout(timer);
    }
  }, [isSidebarHovered]);

  // Close mobile sidebar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        // Check if click is on the hamburger button (it's outside the sidebar)
        const target = event.target as HTMLElement;
        if (!target.closest('[data-hamburger-button]')) {
          setIsMobileSidebarOpen(false);
        }
      }
    };

    if (isMobileSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when sidebar is open on mobile
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  const isBrandingActive = pathname?.includes('/logo') ||
    pathname?.includes('/sticker-generation') ||
    pathname?.includes('/mockup-generation') ||
    pathname?.includes('/product-generation');

  const isVideoEditActive = pathname === '/edit-video' || pathname?.startsWith('/edit-video') || pathname?.includes('/EditVideo') || pathname?.includes('edit-video') || pathname?.includes('/video-edit');

  // Label classes - smooth slide animation (no pop effect)
  const labelClasses =
    `text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isMobileSidebarOpen
      ? 'inline-block'
      : 'hidden'
    } md:inline-block ${isSidebarHovered
      ? 'md:max-w-[180px] md:opacity-100 md:translate-x-0'
      : 'md:max-w-0 md:opacity-0 md:-translate-x-full'
    }`;
  const taglineClasses =
    `text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isMobileSidebarOpen
      ? 'inline-block'
      : 'hidden'
    } md:inline-block ${isSidebarHovered
      ? 'md:max-w-[180px] md:opacity-100 md:translate-x-0'
      : 'md:max-w-0 md:opacity-0 md:-translate-x-full'
    }`;

  return (
    <>
      {/* Hamburger Menu Button - Mobile/Tablet Only.
          Hidden while the sidebar is open so the user closes it via swipe or tapping outside. */}
      {!isMobileSidebarOpen && (
        <button
          data-hamburger-button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-0 left-1 z-[60] md:hidden p-2 text-white rounded-lg transition"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile Overlay - Dark blurred background when sidebar is open */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Original sidebar - keeps original CSS styling */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 bottom-0 left-0 flex flex-col md:gap-3 gap-1 md:py-6 py-0 md:px-3 px-3  backdrop-blur-md group transition-transform duration-300 ease-in-out text-white  ${isMobileSidebarOpen
          ? 'w-60 translate-x-0 z-[56]'
          : '-translate-x-full md:translate-x-0 z-[50]'
          } ${isSidebarHovered ? 'md:w-60' : 'md:w-[68px]'
          }`}
        style={{
          // borderTopLeftRadius: '16px',
          // borderBottomLeftRadius: '16px',
          // borderTopRightRadius: '16px',
          // borderBottomRightRadius: '16px'
        }}
        onMouseEnter={(e) => {
          // Only keep expanded if already expanded - NEVER trigger expansion from full width
          // Only icon elements should trigger expansion
          if (!isSidebarHovered) {
            return;
          }
          // Sidebar is already expanded - keep it expanded when mouse moves to expanded content
        }}
        onMouseLeave={() => {
          // Collapse when mouse leaves the entire sidebar
          setIsSidebarHovered(false);
        }}
        onTouchStart={(e) => {
          if (!isMobileSidebarOpen) return;
          const touch = e.touches[0];
          touchStartXRef.current = touch.clientX;
        }}
        onTouchEnd={(e) => {
          if (!isMobileSidebarOpen || touchStartXRef.current === null) return;
          const touch = e.changedTouches[0];
          const deltaX = touch.clientX - touchStartXRef.current;
          // Detect a left-swipe with a small threshold
          if (deltaX < -50) {
            closeMobileSidebar();
          }
          touchStartXRef.current = null;
        }}
      >
        {/* Logo at the top */}
        <div className="flex items-center gap-2 md:p-2 px-3 py-0 mt-4 md:-mt-4 md:mb-0 mb-0 -ml-2 overflow-hidden">
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/view/Landingpage', () => {
              try { console.log('[SidePanel] logo clicked -> /view/Landingpage') } catch { }
              try { dispatch(setCurrentView('landing')); } catch { }
              // Force hard navigation to avoid race conditions
              try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); }
            })}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                try { console.log('[SidePanel] logo clicked -> /view/Landingpage') } catch { }
                try { dispatch(setCurrentView('landing')); } catch { }
                try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); }
              }
            }}
            className="md:w-[48px] md:h-[48px] w-[36px] h-[36px] flex-none cursor-pointer shrink-0">
            <Image
              src="/core/logosquare.png"
              alt="WildMind Icon"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
          <span
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/view/Landingpage', () => { try { console.log('[SidePanel] brand clicked -> /view/Landingpage') } catch { }; try { dispatch(setCurrentView('landing')); } catch { }; try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); } })}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                try { console.log('[SidePanel] brand clicked -> /view/Landingpage') } catch { }
                try { dispatch(setCurrentView('landing')); } catch { }
                try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); }
              }
            }}
            className={`${taglineClasses} mt-1 cursor-pointer shrink-0`}>
            <Image src="/icons/wildmind_text_whitebg (2).svg" alt="WildMind Logo" width={400} height={200} className="h-6 w-32" unoptimized />
          </span>
        </div>

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, APP_ROUTES.HOME, async () => {
              try {
                await ensureSessionReady(600)
              } catch (error) {
                // Silent fail
              }
              router.push(APP_ROUTES.HOME)
            })}
            onClick={(e) => {
              // Handle normal left-click (button 0)
              if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                closeMobileSidebar();
                (async () => {
                  try {
                    await ensureSessionReady(600)
                  } catch (error) {
                    // Silent fail
                  }
                  router.push(APP_ROUTES.HOME)
                })();
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item`}
          >
            <Image src={imageRoutes.icons.home} alt="Home" width={30} height={30} className="flex-none shrink-0 w-[24px] h-[24px]" priority unoptimized />
            <span className={labelClasses}>Home</span>
          </div>
        </div>

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/view/ArtStation', () => router.push('/view/ArtStation'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                router.push('/view/ArtStation');
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/ArtStation')) ? 'bg-white/20' : ''
              }`}
          >
            <Image src={imageRoutes.icons.artStation} alt="Art Station" width={30} height={30} className="flex-none w-[24px] h-[24px]" unoptimized />
            <span className={labelClasses}>Art Station</span>
          </div>
        </div>

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/canvas-projects', () => router.push('/canvas-projects'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                router.push('/canvas-projects');
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/canvas-projects')) ? 'bg-white/20' : ''
              }`}
          >
            <Image src={imageRoutes.icons.canvas} alt="WildCanvas" width={30} height={30} className="flex-none w-[24px] h-[24px]" unoptimized />
            <span className={labelClasses}>WildCanvas</span>
          </div>
        </div>

        <div className="relative">
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/text-to-image', handleImageGenerationClick)}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleImageGenerationClick();
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/text-to-image')) ? 'bg-white/20' : ''
              }`}
          >
            <Image src={imageRoutes.icons.imageGeneration} alt="Image Generation" width={30} height={30} className="flex-none w-[24px] h-[24px]" priority unoptimized />
            <span className={labelClasses}>Image Generation</span>
          </div>
        </div>

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/edit-image', () => handleGenerationTypeChange('edit-image'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('edit-image');
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/edit-image')) ? 'bg-white/20' : ''
              }`}
          >
            <Image src={imageRoutes.icons.editImage} alt="Image Edit " width={30} height={30} className="flex-none w-[24px] h-[24px]" unoptimized />
            <span className={labelClasses}>Image Edit</span>
          </div>
        </div>

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/text-to-video', () => handleGenerationTypeChange('text-to-video'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('text-to-video');
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/text-to-video')) ? 'bg-white/20' : ''
              }`}
          >
            <Image src={imageRoutes.icons.videoGeneration} alt="Video Generation" width={30} height={30} className="flex-none w-[24px] h-[24px]" priority unoptimized />
            <span className={labelClasses}>Video Generation</span>
          </div>
        </div>

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/edit-video', () => handleGenerationTypeChange('edit-video'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('edit-video');
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${isVideoEditActive ? 'bg-white/20' : ''
              }`}
          >
            <Image
              src="/icons/video-editing (1).svg"
              alt="Video Edit"
              width={30}
              height={30}
              className="flex-none w-[24px] h-[24px]"
              unoptimized
            />
            <span className={labelClasses}>Video Edit</span>
          </div>
        </div>

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, '/text-to-music', () => handleGenerationTypeChange('text-to-music'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('text-to-music');
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/text-to-music')) ? 'bg-white/20' : ''
              }`}
          >
            <Image src={imageRoutes.icons.musicGeneration} alt="Audio Generation" width={30} height={30} className="flex-none w-[24px] h-[24px]" priority unoptimized />
            <span className={labelClasses}>Audio Generation</span>
          </div>
        </div>


        {/* 
      <div>
        <div
          onMouseDown={(e) => handleClickWithNewTab(e, NAV_ROUTES.LIVE_CHAT, () => router.push(NAV_ROUTES.LIVE_CHAT))}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              router.push(NAV_ROUTES.LIVE_CHAT);
            }
          }}
          className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/live-chat')) ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.icons.canvas} alt="Live Chat" width={30} height={30} className="flex-none w-[30px] h-[30px]" unoptimized />
          <span className={labelClasses}>Live Canvas</span>
        </div>
      </div> */}



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


        {/* <div className="relative">
        <div
          ref={brandingRef}
          onMouseDown={(e) => {
            // For branding dropdown, only open in new tab if middle-click or Ctrl+click
            // Otherwise toggle the dropdown
            const isMiddleClick = e.button === 1;
            const isCtrlClick = e.ctrlKey || e.metaKey;
            
            if (isMiddleClick || isCtrlClick) {
              e.preventDefault();
              e.stopPropagation();
              // Open first branding option in new tab (Logo Generation)
              window.open('/logo-generation', '_blank');
              return;
            }
            
            // Normal click - toggle dropdown
            toggleBrandingDropdown();
          }}
          className={`flex items-center gap-4 p-2 z-0 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${isBrandingActive ? 'bg-white/20' : ''
            }`}
        >
          <Image src={imageRoutes.core.brandingKit} alt="Branding Kit" width={30} height={30} className="flex-none w-[30px] h-[30px]" unoptimized />
          <span className={labelClasses}>Branding Kit</span>
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
              onMouseDown={(e) => handleClickWithNewTab(e, '/logo-generation', () => router.push('/logo-generation'))}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  router.push('/logo-generation');
                }
              }}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'logo' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Logo Generation</span>
            </div>

            <div
              onMouseDown={(e) => handleClickWithNewTab(e, '/sticker-generation', () => router.push('/sticker-generation'))}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  router.push('/sticker-generation');
                }
              }}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'sticker-generation' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Sticker Generation</span>
            </div> */}

        {/* <div
                        onClick={() => handleGenerationTypeChange('mockup-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${
                            currentGenerationType === 'mockup-generation' ? 'bg-white/15' : ''
                        }`}
                    >
                        <span className='text-sm text-white'>Mockup Generation</span>
                    </div> */}

        {/* <div
              onMouseDown={(e) => handleClickWithNewTab(e, '/product-generation', () => router.push('/product-generation'))}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  router.push('/product-generation');
                }
              }}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${currentGenerationType === 'product-generation' ? 'bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-white'>Product Generation</span>
            </div>
          </div>)}

      </div> */}

        {/* Art Station */}


        {/* <div>
            <div className='flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item'>
                <Image src="/icons/templateswhite.svg" alt="Templates" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Templates</span>
            </div>
        </div>  */}

        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) => handleClickWithNewTab(e, NAV_ROUTES.PRICING, () => router.push(NAV_ROUTES.PRICING))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                router.push(NAV_ROUTES.PRICING);
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname?.includes('/pricing')) ? 'bg-white/20' : ''
              }`}
          >
            <Image src="/icons/shield-dollar.svg" alt="Pricing" width={30} height={30} className="flex-none w-[24px] h-[24px]" unoptimized />
            <span className={labelClasses}>Pricing</span>
          </div>
        </div>



        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
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
                closeMobileSidebar();
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
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${(pathname === '/history' || pathname?.startsWith('/history')) ? 'bg-white/20' : ''}`}
          >
            <Image src={imageRoutes.icons.history} alt="History" width={30} height={30} className="flex-none w-[24px] h-[24px]" unoptimized />
            <span className={labelClasses}>History</span>
          </div>
        </div>




        {/* Bookmarks - temporarily hidden */}
        {/*
        <div>
          <div
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseDown={(e) =>
              handleClickWithNewTab(e, '/bookmarks', () => {
                try {
                  if (onViewChange && typeof onViewChange === 'function') {
                    onViewChange('bookmarks');
                  }
                } catch (error) {
                  console.error('Error in bookmarks click handler:', error);
                }
                router.push('/bookmarks');
              })
            }
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                try {
                  if (onViewChange && typeof onViewChange === 'function') {
                    onViewChange('bookmarks');
                  }
                } catch (error) {
                  console.error('Error in bookmarks click handler:', error);
                }
                router.push('/bookmarks');
              }
            }}
            className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl group/item ${
              pathname === '/bookmarks' || pathname?.startsWith('/bookmarks')
                ? 'bg-white/20'
                : ''
            }`}
          >
            <Image
              src={imageRoutes.icons.bookmarks}
              alt="Bookmarks"
              width={30}
              height={30}
              className="flex-none w-[24px] h-[24px]"
              unoptimized
            />
            <span className={labelClasses}>Bookmarks</span>
          </div>
        </div>
        */}

        {/* Bottom: credits + profile */}

      </div>

    </>
  )
}

export default SidePannelFeatures