import React from 'react'
import Image from 'next/image'

const Header = () => {
  return (
    <div className="w-full relative">
        <Image 
          src="/homepage/image 11.png" 
          alt="logo" 
          width={1920} 
          height={1080} 
          className="w-full h-auto object-cover"
        />

        {/* Text Overlay - Centered above the image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Text to image . Your new Favourite Model</h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">Beautiful, authentic, and reliable images with every generation. Create in 1080p & 4k Ultra.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors">Try it Again</button>
        </div>
    </div>
  )
}

export default Header