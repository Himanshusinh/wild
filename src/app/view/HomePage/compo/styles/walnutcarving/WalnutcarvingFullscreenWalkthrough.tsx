"use client";
import React from "react";
import { WalnutcarvingModal } from "@/components/walnutcarving";
export default function WalnutcarvingFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <WalnutcarvingModal isOpen={isOpen} onClose={onClose} />;
}
