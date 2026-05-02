"use client";
import React from "react";
import { SozniembroideryModal } from "@/components/sozniembroidery";
export default function SozniembroideryFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SozniembroideryModal isOpen={isOpen} onClose={onClose} />;
}
