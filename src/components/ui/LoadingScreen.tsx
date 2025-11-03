"use client"

import React from 'react'

type Props = {
  message?: string
  subMessage?: string
}

export default function LoadingScreen({ message = 'Loading…', subMessage }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-[#0f1115]/90 border border-white/10 shadow-2xl">
        <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <div className="text-center">
          <p className="text-white text-base md:text-lg font-medium">{message}</p>
          {subMessage ? (
            <p className="text-white/70 text-xs md:text-sm mt-1">{subMessage}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
