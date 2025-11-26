'use client';
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ProductWithModelPoseInputBox from './compo/ProductWithModelPoseInputBox';

const ProductGeneration = () => {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        <ProductWithModelPoseInputBox />
      </div>
    </ProtectedRoute>
  );
};

export default ProductGeneration;