"use client";
import React from "react";
import { SufEmbroideryModal } from "@/components/sufembroidery";
export default function SufEmbroideryFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SufEmbroideryModal isOpen={isOpen} onClose={onClose} />;
}
