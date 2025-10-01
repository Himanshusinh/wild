"use client";
import React from 'react'
import Image from 'next/image'
import { useAppSelector } from '@/store/hooks';
import { ViewType, GenerationType } from '@/types/generation';
import { usePathname, useRouter } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { imageRoutes } from '../../HomePage/routes';
import { APP_ROUTES, NAV_ROUTES } from '@/routes/routes';

interface SidePannelFeaturesProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onGenerationTypeChange?: (type: GenerationType) => void;
  onWildmindSkitClick?: () => void;
}

const SidePannelFeatures = ({ 
  currentView = 'generation', 
  onViewChange = () => {}, 
  onGenerationTypeChange = () => {},
  onWildmindSkitClick = () => {}
}: SidePannelFeaturesProps) => {


  const theme = useAppSelector((state: any) => state?.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
  const pathname = usePathname();
  const router = useRouter();
  const [showBrandingDropdown, setShowBrandingDropdown] = React.useState(false);
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  


  const handleGenerationTypeChange = (type: GenerationType) => {
    try {
      if (onGenerationTypeChange && typeof onGenerationTypeChange === 'function') {
        onGenerationTypeChange(type);
      }
    } catch (error) {
      console.error('Error in handleGenerationTypeChange:', error);
    }
    setShowBrandingDropdown(false);
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
      className='fixed top-[4px] bottom-1 left-0 flex flex-col gap-3 py-4 px-3 group transition-all text-white duration-200 bg-white/10 backdrop-blur-2xl w-[68px] hover:w-60 z-40 border border-white/10 shadow-2xl'
      style={{
        borderTopLeftRadius: '16px',
        borderBottomLeftRadius: '16px',
        borderTopRightRadius: '16px',
        borderBottomRightRadius: '16px'
      }}
    >
        {/* Logo at the top */}
        <div className="flex items-center gap-4 p-2 mb-4 -ml-1">
          <div 
            onClick={() => {
              try {
                if (onViewChange && typeof onViewChange === 'function') {
                  onViewChange('landing');
                }
              } catch {}
              router.push(APP_ROUTES.LANDING);
            }}
          className="w-[32px] h-[32px] min-w-[32px] min-h-[32px] flex-none">
            <Image 
              src={imageRoutes.core.logo}
              alt="Wild Mind Logo"
              width={32}
              height={32}
              className="w-full h-full"
            />
          </div>
          <span className='text-white text-2xl mt-1 font-medium overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap uppercase'>
            Wild Mind
          </span>
        </div>

        <div>
            <div
                onClick={() => router.push(APP_ROUTES.HOME)}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item`}
            >
                <Image src="/icons/Homewhite.svg" alt="Home" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Home</span>
            </div>
        </div>

        <div className="relative">
            <div
                onClick={handleImageGenerationClick}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${
                  (pathname?.includes('/text-to-image')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/imagegenerationwhite.svg" alt="Image Generation" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
            </div>
        </div>

        <div>
            <div 
                onClick={() => handleGenerationTypeChange('text-to-video')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${
                  (pathname?.includes('/text-to-video')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/videoGenerationiconwhite.svg" alt="Video Generation" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Video Generation</span>
            </div>
        </div>
        
        <div>
            <div 
                onClick={() => handleGenerationTypeChange('text-to-music')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${
                  (pathname?.includes('/text-to-music')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/musicgenerationwhite.svg" alt="Music Generation" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Music Generation</span>
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
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${
                  (pathname?.includes('/workflows')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/yy666.png" alt="Wildmind Skit" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Wild Magic</span>
            </div>
        </div>
        

         <div className="relative">
            <div
                ref={brandingRef}
                onClick={toggleBrandingDropdown}
                className={`flex items-center gap-4 p-2 z-100 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${
                  isBrandingActive ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/brandingkitwhite.svg" alt="Branding Kit" width={30} height={30} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Branding Kit</span>
            </div>

           { showBrandingDropdown && (
                <div
                    ref={dropdownRef}
                    className='absolute left-full top-0 ml-4 bg-black/50 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl p-2 space-y-1 z-50 min-w-[240px]'
                >
                    <div className='px-3 py-2 bg-white/10 border border-white/10 rounded-xl shadow-md'>
                        <span className='text-xs text-white/90 uppercase tracking-wider'>Branding Kit</span>
                    </div>
                    
                    <div
                        onClick={() => handleGenerationTypeChange('logo-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${
                            currentGenerationType === 'logo' ? 'bg-white/15' : ''
                        }`}
                    >
                        <span className='text-sm text-white'>Logo Generation</span>
                    </div>
                    
                    <div
                        onClick={() => handleGenerationTypeChange('sticker-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${
                            currentGenerationType === 'sticker-generation' ? 'bg-white/15' : ''
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
                        onClick={() => handleGenerationTypeChange('product-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/20 rounded-xl ${
                            currentGenerationType === 'product-generation' ? 'bg-white/15' : ''
                        }`}
                    >
                        <span className='text-sm text-white'>Product Generation</span>
                    </div>
                </div>)}
            
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
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${
                  (pathname?.includes('/pricing')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/pricingwhite.svg" alt="Pricing" width={30} height={30} />
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
                }}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/15 rounded-xl group/item ${ (pathname === '/history' || pathname?.startsWith('/history')) ? 'bg-white/10' : '' }`}
            >
                <Image src="/icons/historywhite.svg" alt="History" width={30} height={30} />
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
  )
}

export default SidePannelFeatures