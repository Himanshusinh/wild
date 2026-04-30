"use client";
import React from "react";
import { BandhejModal } from "@/components/bandhej";
export default function BandhejFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BandhejModal isOpen={isOpen} onClose={onClose} />;
}
