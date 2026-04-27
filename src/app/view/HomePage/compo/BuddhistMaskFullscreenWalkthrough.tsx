"use client";
import React from "react";
import { BuddhistMaskModal } from "@/components/buddhistmask";
export default function BuddhistMaskFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BuddhistMaskModal isOpen={isOpen} onClose={onClose} />;
}
