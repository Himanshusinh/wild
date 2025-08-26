'use client';

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loadHistory } from '@/store/slices/historySlice';
import InputBox from './compo/InputBox';

const MockupGenration = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadHistory({}));
  }, [dispatch]);

  return (
    <div className="relative min-h-screen">
      <InputBox />
    </div>
  );
};

export default MockupGenration;