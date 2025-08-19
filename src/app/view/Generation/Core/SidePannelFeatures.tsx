import React from 'react'
import Image from 'next/image'

interface SidePannelFeaturesProps {
  currentView: 'generation' | 'history';
  onViewChange: (view: 'generation' | 'history') => void;
}

const SidePannelFeatures = ({ currentView, onViewChange }: SidePannelFeaturesProps) => {
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

        <div>
            <div
                onClick={() => onViewChange('generation')}
                className={`flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item`}
            >
                <Image src="/icons/imagegenerationwhite.svg" alt="Image Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Image Generation</span>
            </div>
        </div>

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
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item'>
                <Image src="/icons/videoGenerationiconwhite.svg" alt="Video Generation" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Video Generation</span>
            </div>
        </div>
        
        <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item'>
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
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item'>
                <Image src="/icons/historywhite.svg" alt="History" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>History</span>
            </div>
        </div>
        
        <div>
            <div className='flex items-center gap-4 p-2 transition-all duration-200 cursor-pointer text-white hover:bg-white/5 group/item'>
                <Image src="/icons/Bookmarkwhite.svg" alt="Bookmark" width={25} height={25} />
                <span className='text-white overflow-hidden w-0 group-hover:w-auto transition-all duration-200 whitespace-nowrap group-hover/item:translate-x-2'>Bookmark</span>
            </div>
        </div>
    </div>
  )
}

export default SidePannelFeatures