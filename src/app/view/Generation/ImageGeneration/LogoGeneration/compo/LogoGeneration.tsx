'use client';

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loadHistory } from '@/store/slices/historySlice';
import InputBox from './InputBox';

const LogoGeneration = () => {
  const dispatch = useAppDispatch();

  // Load history when component mounts
  useEffect(() => {
    console.log('LogoGeneration: Loading history...');
    dispatch(loadHistory({}));
  }, [dispatch]);

  return (
    <div className="relative min-h-screen">
      <InputBox />
    </div>
  );
};

export default LogoGeneration;
