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
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);



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
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showBrandingDropdown &&
        brandingRef.current &&
        !brandingRef.current.contains(event.target as Node) &&
        !(dropdownRef.current && dropdownRef.current.contains(event.target as Node))
      ) {
        setShowBrandingDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrandingDropdown]);

  const isBrandingActive = pathname?.includes('/logo') ||
    pathname?.includes('/sticker-generation') ||
    pathname?.includes('/mockup-generation') ||
    pathname?.includes('/product-generation');

  return (
    <div
      className='fixed top-[4px] bottom-1 left-0 flex flex-col gap-3 md:py-6 py-0 md:px-3 group transition-all text-black dark:text-white duration-300 bg-black/10 dark:bg-white/10 backdrop-blur-lg md:w-[68px] w-[50px] hover:w-60 z-40 border border-black/10 dark:border-white/10 shadow-2xl'
      style={{
        borderTopLeftRadius: '16px',
        borderBottomLeftRadius: '16px',
        borderTopRightRadius: '16px',
        borderBottomRightRadius: '16px'
      }}
    >
      {/* Logo at the top */}
      <div className="flex items-center gap-4 md:p-2 px-3 py-1 md:mb-4 mb-0  -ml-1">
        <div
          onClick={() => {
            try { console.log('[SidePanel] logo clicked -> /view/Landingpage') } catch {}
            try { dispatch(setCurrentView('landing')); } catch {}
            // Force hard navigation to avoid race conditions
            try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); }
          }}
          className="md:w-[34px] md:h-[34px] w-[25px] h-[25px] flex-none cursor-pointer">
          <Image
            src={imageRoutes.core.logo}
            alt="Wild Mind Logo"
            width={32}
            height={32}
            className="w-full h-full brightness-50 dark:brightness-100 transition-all duration-300"
          />
        </div>
        <span
          onClick={() => { try { console.log('[SidePanel] brand clicked -> /view/Landingpage') } catch {}; try { dispatch(setCurrentView('landing')); } catch {}; try { window.location.assign('/view/Landingpage'); } catch { router.push('/view/Landingpage'); } }}
          className='text-black dark:text-white text-2xl mt-1 font-medium overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap cursor-pointer'>
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
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item`}
        >
          <Image src={imageRoutes.icons.home} alt="Home" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Home</span>
        </div>
      </div>

      <div className="relative">
        <div
          onClick={handleImageGenerationClick}
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/text-to-image')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.imageGeneration} alt="Image Generation" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('text-to-video')}
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/text-to-video')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.videoGeneration} alt="Video Generation" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Video Generation</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('text-to-music')}
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/text-to-music')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.musicGeneration} alt="Music Generation" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Music Generation</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => handleGenerationTypeChange('edit-image')}
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/edit-image')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.editImage} alt="Edit Image" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Edit Image</span>
        </div>
      </div>

      {/* Wildmind Skit */}
      <div>
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
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/workflows')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.wildmindskit} alt="Wildmind Skit" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Wild Magic</span>
        </div>
      </div>


      <div className="relative">
        <div
          ref={brandingRef}
          onClick={toggleBrandingDropdown}
          className={`flex items-center gap-4 p-2 z-0 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${isBrandingActive ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.core.brandingKit} alt="Branding Kit" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Branding Kit</span>
        </div>

        {showBrandingDropdown && (
          <div
            ref={dropdownRef}
            className='absolute left-full top-0 ml-4 bg-white/70 dark:bg-black/70 backdrop-blur-3xl border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl p-2 space-y-1 z-100 min-w-[200px] transition-colors duration-300'
          >
            <div className='px-3 py-2 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl shadow-md z-10'>
              <span className='text-xs text-black/90 dark:text-white/90 uppercase tracking-wider'>Branding Kit</span>
            </div>

            <div
              onClick={() => router.push('/logo-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 rounded-xl ${currentGenerationType === 'logo' ? 'bg-black/15 dark:bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-black dark:text-white'>Logo Generation</span>
            </div>

            <div
              onClick={() => router.push('/sticker-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 rounded-xl ${currentGenerationType === 'sticker-generation' ? 'bg-black/15 dark:bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-black dark:text-white'>Sticker Generation</span>
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
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 rounded-xl ${currentGenerationType === 'product-generation' ? 'bg-black/15 dark:bg-white/15' : ''
                }`}
            >
              <span className='text-sm text-black dark:text-white'>Product Generation</span>
            </div>
          </div>)}

      </div>

      {/* Art Station */}
      <div>
        <div
          onClick={() => router.push('/view/ArtStation')}
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/ArtStation')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.artStation} alt="Art Station" width={28} height={28} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Art Station</span>
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
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/pricing')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.pricing} alt="Pricing" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Pricing</span>
        </div>
      </div>

      <div>
        <div
          onClick={() => router.push(NAV_ROUTES.LIVE_CHAT)}
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname?.includes('/live-chat')) ? 'bg-black/10 dark:bg-white/10' : ''
            }`}
        >
          <Image src={imageRoutes.icons.canvas} alt="Live Chat" width={28} height={28} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>Live Canvas</span>
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
          className={`flex items-center gap-4 p-2 transition-all duration-300 cursor-pointer text-black dark:text-white hover:bg-black/15 dark:hover:bg-white/15 rounded-xl group/item ${(pathname === '/history' || pathname?.startsWith('/history')) ? 'bg-black/10 dark:bg-white/10' : ''}`}
        >
          <Image src={imageRoutes.icons.history} alt="History" width={30} height={30} className="brightness-50 dark:brightness-100 transition-all duration-300" />
          <span className='text-black dark:text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-300 whitespace-nowrap group-hover/item:translate-x-2'>History</span>
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
  )
}

export default SidePannelFeatures