"use client";
import React from "react";
import { MatweavingModal } from "@/components/matweaving";
export default function MatweavingFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <MatweavingModal isOpen={isOpen} onClose={onClose} />;
}
