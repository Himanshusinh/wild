import React from 'react'
import Image from 'next/image'
import { getImageUrl } from '../routes'

const Nav = () => {
  return (
    <div className='fixed top-4 right-4 z-50'>
      <div className='flex items-center gap-3'>
        {/* Group 1: search + credits inside shared background */}
        <div className='flex items-center gap-3 rounded-full backdrop-blur-3xl bg-black/30 shadow-lg border border-white/10 px-3 py-2'>
          <Image className='cursor-pointer p-1' src={getImageUrl('core', 'search')} alt='search' width={36} height={36} />
          <button className='flex items-center rounded-full bg-[#1C303D] text-white text-lg px-6 py-2 gap-2'>
            150
            <Image className='cursor-pointer' src={getImageUrl('core', 'coins')} alt='coins' width={26} height={26} />
          </button>
        </div>

        {/* Group 2: person icon in its own background */}
        <div className='rounded-full backdrop-blur-3xl bg-black/30 shadow-lg border border-white/10 p-3'>
          <button className='flex items-center justify-center rounded-full'>
            <Image className='cursor-pointer' src={getImageUrl('core', 'profile')} alt='profile' width={28} height={28} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Nav