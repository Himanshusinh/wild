"use client";
import React from "react";
import { KhaddarModal } from "@/components/khaddar";
export default function KhaddarFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <KhaddarModal isOpen={isOpen} onClose={onClose} />;
}
