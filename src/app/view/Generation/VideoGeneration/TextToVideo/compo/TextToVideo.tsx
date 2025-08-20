'use client';

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loadHistory } from '@/store/slices/historySlice';
import InputBox from './InputBox';

const TextToVideo = () => {
  const dispatch = useAppDispatch();

  // Load history when component mounts
  useEffect(() => {
    console.log('TextToVideo: Loading history...');
    dispatch(loadHistory({}));
  }, [dispatch]);

  return (
    <div className="relative min-h-screen">
      <InputBox />
    </div>
  );
};

export default TextToVideo;
