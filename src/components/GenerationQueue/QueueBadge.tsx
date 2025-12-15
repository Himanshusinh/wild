'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';

export default function QueueBadge() {
  const queueItems = useAppSelector((state) => state.queue.items);
  const activeItems = queueItems.filter(item => 
    item.status === 'queued' || item.status === 'processing'
  );
  const count = activeItems.length;

  if (count === 0) return null;

  return (
    <div className="relative">
      {/* Pulsing glow effect */}
      <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-md animate-pulse" />
      
      {/* Badge */}
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold shadow-lg border border-white/20">
        {count > 9 ? '9+' : count}
      </div>
      
      {/* Animated ring */}
      <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-ping" style={{ animationDuration: '2s' }} />
    </div>
  );
}

