'use client';

import React, { useState } from 'react'
import Image from 'next/image'

const Nav = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10'>
      <div className='flex justify-between items-center m-3'>
          <div className='rounded-full p-2 border border-[#998E8E]'>
              <Image  src="/core/logosquare.png" alt='logo' width={25} height={25} />
          </div>

          <div className='flex items-center gap-5'>
              <div 
                className='relative'
                onMouseEnter={() => setIsSearchVisible(true)}
                onMouseLeave={() => setIsSearchVisible(false)}
              >
                  {/* Search Container - expands and shows input */}
                  <div className={`transition-all duration-300 ease-in-out ${
                    isSearchVisible ? 'w-80 h-10' : 'w-10 h-10'
                  } bg-white/10 border-2 border-white/20 rounded-full flex items-center justify-center hover:border-white/40 cursor-pointer overflow-hidden`}>
                      
                      {!isSearchVisible ? (
                        // Search icon when not expanded
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                      ) : (
                        // Input box when expanded
                        <input
                          type="text"
                          placeholder="Search features..."
                          className="w-full h-full bg-transparent text-white placeholder-white/50 outline-none px-4 text-sm"
                        />
                      )}
                  </div>
              </div>
              <button className='flex items-center gap-2 bg-[#006aff] rounded-full p-1 w-24 justify-center'>150 <Image className='cursor-pointer' src="/icons/coinswhite.svg" alt='logo' width={25} height={25} /></button>
              <button className='flex items-center gap-2 border-2 border-[#998E8E] rounded-full p-1'> <Image className='cursor-pointer' src="/icons/person.svg" alt='logo' width={25} height={25}></Image></button>
          </div>
      </div>
    </div>
  )
}

export default Nav