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
import toast from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createPortal } from 'react-dom';

interface SidePannelFeaturesProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onGenerationTypeChange?: (type: GenerationType) => void;
  onWildmindSkitClick?: () => void;
}

// Memoized SidebarIcon to prevent re-renders of the mask when parent state changes (e.g. hover)
const SidebarIcon = React.memo(({ icon, label, isActive }: { icon: string, label: string, isActive: boolean }) => (
  <Image
    src={icon}
    alt={label}
    width={30}
    height={30}
    className="flex-none w-[24px] h-[24px]"
    unoptimized
  />
));
SidebarIcon.displayName = 'SidebarIcon';

// SidebarItem component moved outside to prevent re-renders
const SidebarItem = ({
  icon,
  label,
  isActive,
  onClick,
  onMouseDown,
  labelClasses,
  setIsSidebarHovered,
  className = ''
}: {
  icon: string,
  label: string,
  isActive: boolean,
  onClick: (e: React.MouseEvent) => void,
  onMouseDown?: (e: React.MouseEvent) => void,
  labelClasses: string,
  setIsSidebarHovered: (value: boolean) => void,
  className?: string
}) => (
  <div
    onMouseEnter={() => setIsSidebarHovered(true)}
    onMouseDown={onMouseDown}
    onClick={onClick}
    className={`flex items-center gap-4 p-2 transition-colors duration-200 cursor-pointer rounded-xl group/item ${isActive
      ? 'bg-blue-500/20 border border-blue-500/40'
      : 'text-white hover:bg-white/20'
      } ${className}`}
  >
    <SidebarIcon icon={icon} label={label} isActive={isActive} />
    <span className={`${labelClasses} ${isActive ? 'text-blue-400' : ''}`}>{label}</span>
  </div>
);

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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Credits (shared with top nav)
  const { creditBalance, refreshCredits, loading: creditsLoading, error: creditsError } = useCredits();
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);
  const profileButtonRef = React.useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, bottom: 0 });

  // Update dropdown position when sidebar state changes
  React.useEffect(() => {
    if (showProfileDropdown && profileButtonRef.current) {
      const updatePosition = () => {
        if (profileButtonRef.current) {
          const rect = profileButtonRef.current.getBoundingClientRect();
          const gap = 12; // Gap between sidebar and popup

          // Position to the right of the sidebar/button
          const left = rect.right + gap;

          // Align bottom of popup with bottom of button
          // We use 'bottom' CSS property, so we calculate distance from bottom of viewport
          const bottom = window.innerHeight - rect.bottom;

          setDropdownPosition({ top: 0, left, bottom });
        }
      };

      // Small delay to ensure button position is calculated correctly
      const timeoutId = setTimeout(updatePosition, 0);

      // Update on window resize and scroll
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isSidebarHovered, isMobileSidebarOpen, showProfileDropdown]);
  const [isPublic, setIsPublic] = React.useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isPublicGenerations');
      return stored ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

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

  // Sync public generations toggle from user data
  React.useEffect(() => {
    if (!userData) return;
    try {
      const stored = localStorage.getItem('isPublicGenerations');
      const server = (userData as any)?.isPublic;
      const planRaw = String((userData as any)?.plan || '').toUpperCase();
      const isPlanCOrD =
        (userData as any)?.canTogglePublicGenerations === true ||
        /(^|\b)PLAN\s*C\b/.test(planRaw) ||
        /(^|\b)PLAN\s*D\b/.test(planRaw) ||
        planRaw === 'C' ||
        planRaw === 'D';
      let next = true;
      if (isPlanCOrD) {
        next = stored != null ? stored === 'true' : server !== undefined ? Boolean(server) : true;
      } else {
        try {
          localStorage.setItem('isPublicGenerations', 'true');
        } catch { }
      }
      setIsPublic(next);
    } catch { }
  }, [userData]);

  // Close profile dropdown on outside click
  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      // Check if click is outside BOTH the button wrapper and the portal content
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node) &&
        portalRef.current &&
        !portalRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      try {
        localStorage.removeItem('me_cache');
      } catch { }
      try {
        sessionStorage.removeItem('me_cache');
      } catch { }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      try {
        await signOut(auth);
      } catch { }
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/';
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`;
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`;
        document.cookie = `app_session=; ${expired}; SameSite=Lax`;
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`;
      } catch { }
    } catch { }
    if (typeof window !== 'undefined') {
      window.location.replace('/view/Landingpage?toast=LOGOUT_SUCCESS');
    }
  };

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
          <SidebarItem
            icon={imageRoutes.icons.home}
            label="Home"
            isActive={pathname === APP_ROUTES.HOME}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, APP_ROUTES.HOME, async () => {
              try { await ensureSessionReady(600) } catch (error) { }
              router.push(APP_ROUTES.HOME)
            })}
            onClick={(e) => {
              if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                closeMobileSidebar();
                (async () => {
                  try { await ensureSessionReady(600) } catch (error) { }
                  router.push(APP_ROUTES.HOME)
                })();
              }
            }}
          />
        </div>

        <div>
          <SidebarItem
            icon={imageRoutes.icons.artStation}
            label="Art Station"
            isActive={pathname?.includes('/ArtStation') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, '/view/ArtStation', () => router.push('/view/ArtStation'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                router.push('/view/ArtStation');
              }
            }}
          />
        </div>

        <div>
          <SidebarItem
            icon={imageRoutes.icons.canvas}
            label="WildCanvas"
            isActive={pathname?.includes('/canvas-projects') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, '/canvas-projects', () => router.push('/canvas-projects'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                router.push('/canvas-projects');
              }
            }}
          />
        </div>

        <div className="relative">
          <SidebarItem
            icon={imageRoutes.icons.imageGeneration}
            label="Image Generation"
            isActive={pathname?.includes('/text-to-image') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, '/text-to-image', handleImageGenerationClick)}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleImageGenerationClick();
              }
            }}
          />
        </div>

        <div>
          <SidebarItem
            icon={imageRoutes.icons.editImage}
            label="Image Edit"
            isActive={pathname?.includes('/edit-image') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, '/edit-image', () => handleGenerationTypeChange('edit-image'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('edit-image');
              }
            }}
          />
        </div>

        <div>
          <SidebarItem
            icon={imageRoutes.icons.videoGeneration}
            label="Video Generation"
            isActive={pathname?.includes('/text-to-video') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, '/text-to-video', () => handleGenerationTypeChange('text-to-video'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('text-to-video');
              }
            }}
          />
        </div>

        <div>
          <SidebarItem
            icon="/icons/video-editing (1).svg"
            label="Video Edit"
            isActive={isVideoEditActive || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, '/edit-video', () => handleGenerationTypeChange('edit-video'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('edit-video');
              }
            }}
          />
        </div>

        <div>
          <SidebarItem
            icon={imageRoutes.icons.musicGeneration}
            label="Audio Generation"
            isActive={pathname?.includes('/text-to-music') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, '/text-to-music', () => handleGenerationTypeChange('text-to-music'))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                handleGenerationTypeChange('text-to-music');
              }
            }}
          />
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
          <SidebarItem
            icon="/icons/shield-dollar.svg"
            label="Pricing"
            isActive={pathname?.includes('/pricing') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
            onMouseDown={(e) => handleClickWithNewTab(e, NAV_ROUTES.PRICING, () => router.push(NAV_ROUTES.PRICING))}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                closeMobileSidebar();
                router.push(NAV_ROUTES.PRICING);
              }
            }}
          />
        </div>



        <div>
          <SidebarItem
            icon={imageRoutes.icons.history}
            label="History"
            isActive={pathname === '/history' || pathname?.startsWith('/history') || false}
            labelClasses={labelClasses}
            setIsSidebarHovered={setIsSidebarHovered}
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
          />
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

        {/* Bottom: profile with credits */}
        <div className="mt-auto pt-4 pb-4 border-t border-white/10">
          {/* Profile trigger + dropdown - simplified animation */}
          <div
            className="relative"
            ref={profileDropdownRef}
          >
            <div
              role="button"
              tabIndex={0}
              ref={profileButtonRef}
              onClick={() => {
                // On mobile, navigate directly to account settings instead of opening dropdown
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT);
                  return;
                }
                // Expand sidebar when profile is clicked (if not already expanded)
                if (!isSidebarHovered && !isMobileSidebarOpen) {
                  setIsSidebarHovered(true);
                }
                // Position will be calculated by useEffect
                setShowProfileDropdown((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // Expand sidebar when profile is clicked (if not already expanded)
                  if (!isSidebarHovered && !isMobileSidebarOpen) {
                    setIsSidebarHovered(true);
                  }
                  setShowProfileDropdown((v) => !v);
                }
              }}
              onMouseEnter={() => setIsSidebarHovered(true)}
              className={`w-full flex items-start justify-between px-1 transition-colors duration-200 ease-out cursor-pointer ${isSidebarHovered || isMobileSidebarOpen
                ? 'rounded-2xl'
                : 'rounded-full bg-transparent border-0'
                }`}
            >
              <div className="flex  gap-2">
                {/* Profile image - always visible, fixed position and aligned with sidebar icons */}
                {userData?.photoURL && !avatarFailed ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20 flex items-center justify-center">
                    <img
                      src={userData.photoURL}
                      alt="profile"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 border border-white/20">
                    <span className="text-white text-[11px] font-semibold">
                      {(userData?.username || userData?.email || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Username and credits - fade in/out, no slide */}
                {(isSidebarHovered || isMobileSidebarOpen) && (
                  <div className="flex flex-col items-start whitespace-nowrap pl-2 transition-opacity duration-200 ease-out">
                    <span className="text-xs font-medium text-white">
                      {userData?.username || 'User'}
                    </span>
                    {/* Credits below username */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshCredits();
                      }}
                      className="flex items-center gap-1.5 mt-1 hover:opacity-80 transition-opacity"
                      title="Click to refresh credits"
                    >
                      <Image
                        src="/icons/coinswhite.svg"
                        alt="Credits"
                        width={14}
                        height={14}
                        className="w-3.5 h-3.5 flex-shrink-0"
                        unoptimized
                      />
                      <span className="text-xs font-semibold text-white tabular-nums">
                        {creditsLoading ? '…' : (creditBalance ?? userData?.credits ?? 0)}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              {/* Dropdown arrow - simple show/hide */}
              {(isSidebarHovered || isMobileSidebarOpen) && (
                <span className="text-xs text-white/60 whitespace-nowrap"> &#9654; </span>
              )}
            </div>

            {showProfileDropdown && mounted && createPortal(
              <div
                ref={portalRef}
                onMouseLeave={() => setShowProfileDropdown(false)}
                className="fixed w-80 rounded-2xl backdrop-blur-3xl bg-[#05050a]/95 shadow-2xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300"
                style={{
                  zIndex: 999999,
                  position: 'fixed',
                  left: `${dropdownPosition.left}px`,
                  bottom: `${dropdownPosition.bottom}px`,
                  maxHeight: 'calc(100vh - 20px)',
                  overflowY: 'auto'
                }}
              >
                <div className="p-3 md:p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      {userData?.photoURL && !avatarFailed ? (
                        <img
                          src={userData.photoURL}
                          alt="avatar"
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {(userData?.username || userData?.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-lg">
                        {userData?.username || 'User'}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {userData?.email || 'user@example.com'}
                      </div>
                    </div>
                  </div>

                  {/* Stats + actions */}
                  <div className="space-y-2">
                    <div className="space-y-1 px-3 py-2 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">Status</span>
                        <span className="text-green-400 text-sm">
                          {userData?.metadata?.accountStatus || 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="text-white text-sm">Active Plan</span>
                      <span className="text-gray-300 text-sm">
                        {userData?.plan || 'Launch Offer'}
                      </span>
                    </div>

                    {/* Make generations public toggle */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="text-white text-sm">Make generations public</span>
                      <button
                        type="button"
                        aria-pressed={isPublic}
                        onClick={async () => {
                          const planRaw = String(userData?.plan || '').toUpperCase();
                          const canToggle =
                            /(^|\b)PLAN\s*C\b/.test(planRaw) ||
                            /(^|\b)PLAN\s*D\b/.test(planRaw) ||
                            planRaw === 'C' ||
                            planRaw === 'D';
                          if (!canToggle) {
                            toast('Public generations are always enabled on your plan');
                            setIsPublic(true);
                            try {
                              localStorage.setItem('isPublicGenerations', 'true');
                            } catch { }
                            return;
                          }
                          const next = !isPublic;
                          setIsPublic(next);
                          try {
                            localStorage.setItem('isPublicGenerations', String(next));
                          } catch { }
                        }}
                        className={`w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-blue-500' : 'bg-white/20'
                          }`}
                      >
                        <span
                          className={`block w-4 h-4 bg-white rounded-full transition-transform transform ${isPublic ? 'translate-x-5' : 'translate-x-0'
                            } relative top-0 left-0.5`}
                        />
                      </button>
                    </div>

                    <div className="border-t border-white/10 my-2" />

                    {/* Account Settings */}
                    <button
                      onClick={() => {
                        router.push(NAV_ROUTES.ACCOUNT_MANAGEMENT);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white text-sm">Account Settings</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <span className="text-red-400 text-sm">Log Out</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

      </div>

    </>
  )
}

export default SidePannelFeatures