"use client";
import React from "react";
import { AgramarbleinlayModal } from "@/components/agramarbleinlay";
export default function AgramarbleinlayFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <AgramarbleinlayModal isOpen={isOpen} onClose={onClose} />;
}
