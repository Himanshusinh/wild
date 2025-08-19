import React from 'react'
import Image from 'next/image'

const Nav = () => {
  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10'>
      <div className='flex justify-between items-center m-3'>
          <div className='rounded-full p-2 border border-[#998E8E]'>
              <Image  src="/core/logosquare.png" alt='logo' width={25} height={25} />
          </div>

          <div className='flex items-center gap-5'>
              <Image className='cursor-pointer border rounded-full p-2 border-[#998E8E] ' src="/icons/searchwhite.svg" alt='logo' width={35} height={35} />
              <button className='flex items-center gap-2 bg-[#0011FF] border border-[#998E8E] rounded-full p-1 w-24 justify-center'>150 <Image className='cursor-pointer' src="/icons/coinswhite.svg" alt='logo' width={25} height={25} /></button>
              <button className='flex items-center gap-2 border border-[#998E8E] rounded-full p-1'> <Image className='cursor-pointer' src="/icons/person.svg" alt='logo' width={25} height={25}></Image></button>
          </div>
      </div>
    </div>
  )
}

export default Nav