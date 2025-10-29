'use client'

import React, { useState } from 'react'
import NavigationCompo from './NavigationFeatuesall'
import FeaturesCompo from './FeatuesCompo'

const FeatuesAll = () => {
  const [activeCategory, setActiveCategory] = useState('All')

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
  }

  return ( 
    <div className='text-white w-full'>
        <div className='w-full overflow-x-auto pb-4 mb:px-4'>
            <NavigationCompo onCategoryChange={handleCategoryChange} />
        </div>
        <div className='flex justify-center items-center'>
          <FeaturesCompo activeCategory={activeCategory} />
        </div>
    </div>
  )
}

export default FeatuesAll