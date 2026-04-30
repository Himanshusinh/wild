"use client";
import React from "react";
import { PalmmatModal } from "@/components/palmmat";
export default function PalmmatFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PalmmatModal isOpen={isOpen} onClose={onClose} />;
}
