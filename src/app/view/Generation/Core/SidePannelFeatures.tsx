import React from 'react'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentGenerationType } from '@/store/slices/uiSlice';

interface SidePannelFeaturesProps {
  currentView: 'generation' | 'history' | 'bookmarks';
  onViewChange: (view: 'generation' | 'history' | 'bookmarks') => void;
  onGenerationTypeChange: (type: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music') => void;
}

const SidePannelFeatures = ({ currentView, onViewChange, onGenerationTypeChange }: SidePannelFeaturesProps) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');
  const [showImageOptions, setShowImageOptions] = React.useState(false);
  const [imageOptionsPosition, setImageOptionsPosition] = React.useState({ top: 0 });
  const imageGenerationRef = React.useRef<HTMLDivElement>(null);

  const handleGenerationTypeChange = (type: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music') => {
    onGenerationTypeChange(type);
    setShowImageOptions(false);
  };

  const handleImageGenerationClick = () => {
    if (imageGenerationRef.current) {
      const rect = imageGenerationRef.current.getBoundingClientRect();
      setImageOptionsPosition({ top: rect.top });
    }
    setShowImageOptions(!showImageOptions);
  };

  // Close sub-options when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImageOptions && 
          imageGenerationRef.current && 
          !imageGenerationRef.current.contains(event.target as Node)) {
        setShowImageOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageOptions]);

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
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item`}
            >
                <Image src="/icons/imagegenerationwhite.svg" alt="Image Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
            </div>
        </div>

        {/* Image Generation Sub-options - Positioned absolutely next to the sidebar */}
        {showImageOptions && (
          <div 
            className='fixed group-hover:left-[240px] left-[68px] bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-2 space-y-1 z-50 transition-all duration-200'
            style={{ 
              top: `${imageOptionsPosition.top}px`,
              minWidth: '180px'
            }}
            onMouseLeave={() => setShowImageOptions(false)}
          >
            <div
              onClick={() => handleGenerationTypeChange('text-to-image')}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/10 rounded ${
                currentGenerationType === 'text-to-image' ? 'bg-white/15' : ''
              }`}
            >
              <span className='text-sm text-white'>Text to Image</span>
            </div>
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
          </div>
        )}

        <div>
            <div
                onClick={() => onViewChange('history')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item`}
            >
                <Image src="/icons/historywhite.svg" alt="History" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>History</span>
            </div>
        </div>

        <div>
            <div 
                onClick={() => handleGenerationTypeChange('text-to-video')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item ${
                  currentGenerationType === 'text-to-video' ? 'bg-white/10' : ''
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
                  currentGenerationType === 'text-to-music' ? 'bg-white/10' : ''
                }`}
            >
                <Image src="/icons/musicgenerationwhite.svg" alt="Music Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Music Generation</span>
            </div>
        </div>
        
        <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item'>
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
                className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-theme-primary hover:bg-white/5 group/item'
            >
                <Image
                    src="/icons/historywhite.svg"
                    alt="History"
                    width={25}
                    height={25}
                    style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }}
                />
                <span className='text-theme-primary overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>History</span>
            </div>
        </div>

        <div>
            <div
                onClick={() => onViewChange('bookmarks')}
                className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-theme-primary hover:bg-white/5 group/item'
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