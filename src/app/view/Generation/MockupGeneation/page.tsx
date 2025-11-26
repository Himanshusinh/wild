"use client";
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import InputBox from './compo/InputBox';

// History is self-managed inside InputBox (single initial fetch + IO pagination)
const Page = () => {
  return (
    <ProtectedRoute>
      <InputBox />
    </ProtectedRoute>
  );
};

export default Page;