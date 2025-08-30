"use client";
import React from 'react'
import Image from 'next/image'
import { useAppSelector } from '@/store/hooks';
import { ViewType, GenerationType } from '@/types/generation';
import { usePathname } from 'next/navigation';
import { Clapperboard } from 'lucide-react';

interface SidePannelFeaturesProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onGenerationTypeChange: (type: GenerationType) => void;
}

const SidePannelFeatures = ({ currentView, onViewChange, onGenerationTypeChange }: SidePannelFeaturesProps) => {
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');
  const pathname = usePathname();
  const [showBrandingDropdown, setShowBrandingDropdown] = React.useState(false);
  const brandingRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleGenerationTypeChange = (type: GenerationType) => {
    onGenerationTypeChange(type);
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

  const isBrandingActive = pathname?.includes('/logo-generation') || 
                           pathname?.includes('/sticker-generation') || 
                           pathname?.includes('/mockup-generation') || 
                           pathname?.includes('/product-generation');

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
                onClick={handleImageGenerationClick}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  (pathname?.includes('/text-to-image')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/imagegenerationwhite.svg" alt="Image Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
            </div>
        </div>

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

        {/* Wildmind Skit */}
        <div>
            <div 
                onClick={() => handleGenerationTypeChange('ad-generation')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  (pathname?.includes('/ad-generation')) ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/clapperboard.svg" alt="Wildmind Skit" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Wildmind Skit</span>
            </div>
        </div>
        
        {/* Branding Kit with Dropdown */}
        <div className="relative">
            <div
                ref={brandingRef}
                onClick={toggleBrandingDropdown}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  isBrandingActive ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/brandingkitwhite.svg" alt="Branding Kit" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Branding Kit</span>
                
                {/* Dropdown Arrow */}
                <div className={`ml-auto transition-transform duration-200 ${showBrandingDropdown ? 'rotate-180' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                </div>
            </div>

            {/* Branding Dropdown Menu */}
            {showBrandingDropdown && (
                <div
                    ref={dropdownRef}
                    className='absolute left-full top-0 ml-2 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-2 space-y-1 z-50 min-w-[200px]'
                >
                    <div className='px-3 py-2 border-b border-white/10'>
                        <span className='text-xs text-white/60 uppercase tracking-wider'>Branding Kit</span>
                    </div>
                    
                    <div
                        onClick={() => handleGenerationTypeChange('logo-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                            currentGenerationType === 'logo-generation' ? 'bg-white/15' : ''
                        }`}
                    >
                        {/* <div className='w-2 h-2 rounded-full bg-blue-400'></div> */}
                        <span className='text-sm text-white'>Logo Generation</span>
                    </div>
                    
                    <div
                        onClick={() => handleGenerationTypeChange('sticker-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                            currentGenerationType === 'sticker-generation' ? 'bg-white/15' : ''
                        }`}
                    >
                        {/* <div className='w-2 h-2 rounded-full bg-green-400'></div> */}
                        <span className='text-sm text-white'>Sticker Generation</span>
                    </div>
                    
                    <div
                        onClick={() => handleGenerationTypeChange('mockup-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                            currentGenerationType === 'mockup-generation' ? 'bg-white/15' : ''
                        }`}
                    >
                        {/* <div className='w-2 h-2 rounded-full bg-purple-400'></div> */}
                        <span className='text-sm text-white'>Mockup Generation</span>
                    </div>
                    
                    <div
                        onClick={() => handleGenerationTypeChange('product-generation')}
                        className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                            currentGenerationType === 'product-generation' ? 'bg-white/15' : ''
                        }`}
                    >
                        {/* <div className='w-2 h-2 rounded-full bg-orange-400'></div> */}
                        <span className='text-sm text-white'>Product Generation</span>
                    </div>
                </div>
            )}
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