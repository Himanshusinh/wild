"use client";
import React from 'react'
import Image from 'next/image'
import { useAppSelector } from '@/store/hooks';
import { ViewType, GenerationType } from '@/types/generation';
import { usePathname } from 'next/navigation';

interface SidePannelFeaturesProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onGenerationTypeChange: (type: GenerationType) => void;
}

const SidePannelFeatures = ({ currentView, onViewChange, onGenerationTypeChange }: SidePannelFeaturesProps) => {
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');
  const pathname = usePathname();
  const [showBrandingOptions, setShowBrandingOptions] = React.useState(false);
  const [brandingOptionsPosition, setBrandingOptionsPosition] = React.useState({ top: 0 });
  const imageGenerationRef = React.useRef<HTMLDivElement>(null);
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const brandingOptionsRef = React.useRef<HTMLDivElement>(null);

  const handleGenerationTypeChange = (type: GenerationType) => {
    onGenerationTypeChange(type);
    setShowBrandingOptions(false);
  };

  const handleImageGenerationClick = () => {
    handleGenerationTypeChange('text-to-image');
  };

  const handleBrandingMouseEnter = () => {
    if (brandingRef.current) {
      const rect = brandingRef.current.getBoundingClientRect();
      setBrandingOptionsPosition({ top: rect.top });
    }
    setShowBrandingOptions(true);
  };

  const handleBrandingMouseLeave = () => {
    setShowBrandingOptions(false);
  };

  // Close sub-options when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showBrandingOptions &&
        brandingRef.current &&
        !brandingRef.current.contains(event.target as Node) &&
        !(brandingOptionsRef.current && brandingOptionsRef.current.contains(event.target as Node))
      ) {
        setShowBrandingOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrandingOptions, pathname, currentView, currentGenerationType ]);

  return (
    <div className='fixed top-[62px] left-0 h-[calc(100vh-52px)] flex flex-col gap-3 py-6 px-3 group transition-all text-white duration-200 bg-black/20 backdrop-blur-md w-[68px] hover:w-60 z-40'>
        <div>
            <div
                onClick={() => onViewChange('generation')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item`}
            >
                <Image src="/icons/Homewhite.svg" alt="Home" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Home</span>
            </div>
        </div>

        <div className="relative">
            <div
                ref={imageGenerationRef}
                onClick={handleImageGenerationClick}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  (pathname?.includes('/text-to-image')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/imagegenerationwhite.svg" alt="Image Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
            </div>
        </div>

        {/* Branding Kit Sub-options */}
        {showBrandingOptions && (
          <div
            className='fixed group-hover:left-[240px] left-[68px] bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-2 space-y-1 z-50 transition-all duration-200'
            style={{
              top: `${brandingOptionsPosition.top}px`,
              minWidth: '180px'
            }}
            ref={brandingOptionsRef}
            onMouseLeave={handleBrandingMouseLeave}
          >
            <div
              onClick={() => handleGenerationTypeChange('logo-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                currentGenerationType === 'logo-generation' ? 'bg-white/15' : ''
              }`}
            >
              <span className='text-sm text-white'>Logo Generation</span>
            </div>
            <div
              onClick={() => handleGenerationTypeChange('sticker-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                currentGenerationType === 'sticker-generation' ? 'bg-white/15' : ''
              }`}
            >
              <span className='text-sm text-white'>Sticker Generation</span>
            </div>
            <div
              onClick={() => handleGenerationTypeChange('mockup-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                currentGenerationType === 'mockup-generation' ? 'bg-white/15' : ''
              }`}
            >
              <span className='text-sm text-white'>Mockup Generation</span>
            </div>
            <div
              onClick={() => handleGenerationTypeChange('product-generation')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                currentGenerationType === 'product-generation' ? 'bg-white/15' : ''
              }`}
            >
              <span className='text-sm text-white'>Product Generation</span>
            </div>
          </div>
        )}


        <div>
            <div 
                onClick={() => handleGenerationTypeChange('text-to-video')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  (pathname?.includes('/text-to-video')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/videoGenerationiconwhite.svg" alt="Video Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Video Generation</span>
            </div>
        </div>
        
        <div>
            <div 
                onClick={() => handleGenerationTypeChange('text-to-music')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  (pathname?.includes('/text-to-music')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/musicgenerationwhite.svg" alt="Music Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Music Generation</span>
            </div>
        </div>
        
        <div className="relative">
            <div
                ref={brandingRef}
                onMouseEnter={handleBrandingMouseEnter}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  (pathname?.includes('/logo-generation') || pathname?.includes('/sticker-generation') || pathname?.includes('/mockup-generation') || pathname?.includes('/product-generation')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/brandingkitwhite.svg" alt="Branding Kit" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Branding Kit</span>
            </div>
        </div>
        
        <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item'>
                <Image src="/icons/templateswhite.svg" alt="Templates" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Templates</span>
            </div>
        </div>
        
        <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item'>
                <Image src="/icons/pricingwhite.svg" alt="Pricing" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Pricing</span>
            </div>
        </div>
        
        <div>
            <div
                onClick={() => onViewChange('history')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${ (pathname === '/history' || pathname?.startsWith('/history')) ? 'bg-white/10' : '' }`}
            >
                <Image src="/icons/historywhite.svg" alt="History" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>History</span>
            </div>
        </div>

        <div>
            <div
                onClick={() => onViewChange('bookmarks')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-theme-primary hover:bg-white/5 group/item ${ (pathname === '/bookmarks' || pathname?.startsWith('/bookmarks')) ? 'bg-white/10' : '' }`}
            >
                <Image
                    src="/icons/Bookmarkwhite.svg"
                    alt="Bookmarks"
                    width={25}
                    height={25}
                    style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }}
                />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Bookmarks</span>
            </div>
        </div>
    </div>
  )
}

export default SidePannelFeatures