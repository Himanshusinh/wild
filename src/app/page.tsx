'use client';

import React from 'react';
import MainLayout from './view/Generation/Core/MainLayout';
import MockupGenration from './view/Generation/Core/MockupGeneation/page';
import ProductGeneration from './view/Generation/Core/ProductGeneration/page';
import HomePage from './view/HomePage/page';

const page = () => {
  return (
    <div>
      {/* <MainLayout /> */}
      <MockupGenration />
      {/* <ProductGeneration /> */}
      {/* <HomePage /> */}
    </div>
  );
};

export default page