"use client";
import React from "react";
import { RammanmaskModal } from "@/components/rammanmask";
export default function RammanmaskFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <RammanmaskModal isOpen={isOpen} onClose={onClose} />;
}
