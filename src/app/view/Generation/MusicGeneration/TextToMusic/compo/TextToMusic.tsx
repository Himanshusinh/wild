'use client';

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loadHistory } from '@/store/slices/historySlice';
import InputBox from './InputBox';

const TextToMusic = () => {
  const dispatch = useAppDispatch();

  // Load history when component mounts
  useEffect(() => {
    console.log('TextToMusic: Loading history...');
    dispatch(loadHistory({}));
  }, [dispatch]);

  return (
    <InputBox />
  );
};

export default TextToMusic;
