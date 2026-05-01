"use client";
import React from "react";
import { NamdaModal } from "@/components/namda";
export default function NamdaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <NamdaModal isOpen={isOpen} onClose={onClose} />;
}
