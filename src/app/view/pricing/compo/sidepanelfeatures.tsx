"use client";
import React from 'react'
import { usePathname } from 'next/navigation';


interface SidePannelFeaturesProps {
  onViewChange: (view: string) => void;
  onGenerationTypeChange: (type: string) => void;
}

const SidePannelFeatures = ({ onViewChange, onGenerationTypeChange }: SidePannelFeaturesProps) => {
  const pathname = usePathname();
  const [showBrandingOptions, setShowBrandingOptions] = React.useState(false);
  const [currentGenerationType, setCurrentGenerationType] = React.useState('text-to-image');
  const imageGenerationRef = React.useRef<HTMLDivElement>(null);
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const brandingOptionsRef = React.useRef<HTMLDivElement>(null);
  const brandingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleGenerationTypeChange = (type: string) => {
    setCurrentGenerationType(type);
    onGenerationTypeChange(type);
    setShowBrandingOptions(false);
  };

  const handleImageGenerationClick = () => {
    handleGenerationTypeChange('text-to-image');
  };

  const handleBrandingMouseEnter = () => {
    if (brandingTimeoutRef.current) {
      clearTimeout(brandingTimeoutRef.current);
    }
    setShowBrandingOptions(true);
  };

  const handleBrandingMouseLeave = () => {
    brandingTimeoutRef.current = setTimeout(() => {
      setShowBrandingOptions(false);
    }, 150);
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
  }, [showBrandingOptions]);

  return (
    <div 
      className='fixed top-[4px] bottom-1 left-  flex flex-col gap-3 py-4 px-3 group transition-all text-white duration-200 bg-[#1C303D]/50 backdrop-blur-md w-[68px] hover:w-60 z-50 border border-white/10 shadow-2xl'
      style={{
        borderTopLeftRadius: '16px',
        borderBottomLeftRadius: '16px',
        borderTopRightRadius: '16px',
        borderBottomRightRadius: '16px'
      }}
    >
        {/* Logo at the top */}
        <div className="flex items-center gap-4 p-2 mb-4 -ml-1">
          <div className="w-[32px] h-[32px] min-w-[32px] min-h-[32px] flex-none bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">WM</span>
          </div>
          <span className='text-white text-2xl mt-1 font-medium overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap uppercase'>
            Wild Mind
          </span>
        </div>

        <div>
            <div
                onClick={() => onViewChange('generation')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item`}
            >
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🏠</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Home</span>
            </div>
        </div>

        <div className="relative">
            <div
                ref={imageGenerationRef}
                onClick={handleImageGenerationClick}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item ${
                  (pathname?.includes('/text-to-image')) ? 'bg-white/10' : ''
                }`}
            >
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🖼️</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
            </div>
        </div>




        <div>
            <div 
                onClick={() => handleGenerationTypeChange('text-to-video')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item ${
                  (pathname?.includes('/text-to-video')) ? 'bg-white/10' : ''
                }`}
            >
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🎥</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Video Generation</span>
            </div>
        </div>
        
        <div>
            <div 
                onClick={() => handleGenerationTypeChange('text-to-music')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item ${
                  (pathname?.includes('/text-to-music')) ? 'bg-white/10' : ''
                }`}
            >
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🎵</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Music Generation</span>
            </div>
        </div>
        
        {/* Canvas Tool */}
        <div>
            <div 
                onClick={() => handleGenerationTypeChange('canvas')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item ${
                  (pathname?.includes('/canvas')) ? 'bg-white/10' : ''
                }`}
            >
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🎨</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Canvas</span>
            </div>
        </div>
        
        <div className="relative">
            <div
                ref={brandingRef}
                onMouseEnter={handleBrandingMouseEnter}
                onMouseLeave={handleBrandingMouseLeave}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item ${
                  (pathname?.includes('/logo-generation') || pathname?.includes('/sticker-generation') || pathname?.includes('/mockup-generation') || pathname?.includes('/product-generation')) ? 'bg-white/10' : ''
                }`}
            >
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🏷️</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Branding Kit</span>
            </div>
            
            {/* Branding Kit Sub-options */}
            {showBrandingOptions && (
              <div
                className='absolute left-full ml-2 bg-[#1C303D]/50 backdrop-blur-md border border-white/10 shadow-2xl p-2 space-y-1 z-50 transition-all duration-200 text-white'
                style={{
                  top: '0',
                  minWidth: '200px',
                  borderTopLeftRadius: '16px',
                  borderBottomLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  borderBottomRightRadius: '16px'
                }}
                ref={brandingOptionsRef}
                onMouseEnter={() => {
                  if (brandingTimeoutRef.current) {
                    clearTimeout(brandingTimeoutRef.current);
                  }
                }}
                onMouseLeave={handleBrandingMouseLeave}
              >
                <div
                  onClick={() => handleGenerationTypeChange('logo-generation')}
                  className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded-xl ${
                    currentGenerationType === 'logo-generation' ? 'bg-white/15' : ''
                  }`}
                >
                  <span className='text-md text-white'>Logo Generation</span>
                </div>
                <div
                  onClick={() => handleGenerationTypeChange('sticker-generation')}
                  className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded-xl ${
                    currentGenerationType === 'sticker-generation' ? 'bg-white/15' : ''
                  }`}
                >
                  <span className='text-md text-white'>Sticker Generation</span>
                </div>
                <div
                  onClick={() => handleGenerationTypeChange('mockup-generation')}
                  className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded-xl ${
                    currentGenerationType === 'mockup-generation' ? 'bg-white/15' : ''
                  }`}
                >
                  <span className='text-md text-white'>Mockup Generation</span>
                </div>
                <div
                  onClick={() => handleGenerationTypeChange('product-generation')}
                  className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded-xl ${
                    currentGenerationType === 'product-generation' ? 'bg-white/15' : ''
                  }`}
                >
                  <span className='text-md text-white'>Product Generation</span>
                </div>
              </div>
            )}
        </div>
        
        <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item'>
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">📄</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Templates</span>
            </div>
        </div>
        
        <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item'>
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">💰</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Pricing</span>
            </div>
        </div>
        
        <div>
            <div
                onClick={() => onViewChange('history')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item ${ (pathname === '/history' || pathname?.startsWith('/history')) ? 'bg-white/10' : '' }`}
            >
                <div className="w-[30px] h-[30px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">📜</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>History</span>
            </div>
        </div>

        <div>
            <div
                onClick={() => onViewChange('bookmarks')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-[#1C303D] rounded-xl group/item ${ (pathname === '/bookmarks' || pathname?.startsWith('/bookmarks')) ? 'bg-white/10' : '' }`}
            >
                <div className="w-[25px] h-[25px] bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🔖</span>
                </div>
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Bookmarks</span>
            </div>
        </div>
    </div>
  )
}

export default SidePannelFeatures