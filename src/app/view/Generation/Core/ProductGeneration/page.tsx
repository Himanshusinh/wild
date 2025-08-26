'use client';

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loadHistory } from '@/store/slices/historySlice';
import ProductWithModelPoseInputBox from './compo/ProductWithModelPoseInputBox';

const ProductGeneration = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadHistory({}));
  }, [dispatch]);

  return (
    <div className="relative min-h-screen">
      <ProductWithModelPoseInputBox />
    </div>
  );
};

export default ProductGeneration;