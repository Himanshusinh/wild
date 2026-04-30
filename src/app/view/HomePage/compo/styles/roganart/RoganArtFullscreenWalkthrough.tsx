"use client";
import React from "react";
import { RoganArtModal } from "@/components/roganart";
export default function RoganArtFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <RoganArtModal isOpen={isOpen} onClose={onClose} />;
}
