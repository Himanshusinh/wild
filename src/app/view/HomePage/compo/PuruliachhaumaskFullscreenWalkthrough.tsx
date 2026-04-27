"use client";
import React from "react";
import { PuruliachhaumaskModal } from "@/components/puruliachhaumask";
export default function PuruliachhaumaskFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PuruliachhaumaskModal isOpen={isOpen} onClose={onClose} />;
}
