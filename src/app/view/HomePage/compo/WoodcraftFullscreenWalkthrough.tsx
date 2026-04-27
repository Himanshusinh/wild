"use client";
import React from "react";
import { WoodcraftModal } from "@/components/woodcraft";
export default function WoodcraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <WoodcraftModal isOpen={isOpen} onClose={onClose} />;
}
