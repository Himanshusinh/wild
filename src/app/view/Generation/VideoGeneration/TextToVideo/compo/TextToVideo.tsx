'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Hydration-safe: render InputBox only on client to avoid SSR/CSR markup drift in complex interactive UI
const InputBox = dynamic(() => import('./InputBox'), { ssr: false });

const TextToVideo = () => {
  return (
    <div className="relative min-h-screen">
      <InputBox />
    </div>
  );
};

export default TextToVideo;
