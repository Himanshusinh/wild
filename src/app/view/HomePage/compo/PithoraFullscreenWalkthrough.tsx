"use client";
import React from "react";
import { PithoraModal } from "@/components/pithora";
export default function PithoraFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PithoraModal isOpen={isOpen} onClose={onClose} />;
}
