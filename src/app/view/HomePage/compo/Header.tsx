import React from 'react'
import { useRouter } from 'next/navigation'
import { getImageUrl } from '../routes'

const Header = () => {
  const router = useRouter();

  const handleTryNowClick = () => {
    router.push('/text-to-image');
  };

  return (
    <div className="w-full relative">
      {/* Video wrapper with right padding */}
      <div className="pr-6 md:pr-12 mt-4 ml-12">
        <div className="relative">
          <video
            src={getImageUrl('header', 'heroVideo')} // <- replace with your video path
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-[60vh] object-cover rounded-3xl"
          />

          {/* Gradient overlay from bottom to top */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent rounded-3xl" />
        </div>
      </div>

      {/* Text Overlay - Centered above the video */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 mt-64">
        <h1 className="text-4xl md:text-6xl font-medium mb-4">
          Introducing Nano Banana by Google!
        </h1>
        <p className="text-lg md:text-xl mb-6 opacity-90">
          Consistent Superior Editing by Google Gemini, now available in Wild Mind.
        </p>
        <button 
          onClick={handleTryNowClick}
          className="bg-[#1C303D] hover:bg-blue-700 text-white px-6 py-2 rounded-full text-lg font-medium transition-colors"
        >
          Try Now
        </button>
      </div>
    </div>
  )
}

export default Header
