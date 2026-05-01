"use client";
import React from "react";
import { BaghEmbroideryModal } from "@/components/baghembroidery";
export default function BaghEmbroideryFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BaghEmbroideryModal isOpen={isOpen} onClose={onClose} />;
}
