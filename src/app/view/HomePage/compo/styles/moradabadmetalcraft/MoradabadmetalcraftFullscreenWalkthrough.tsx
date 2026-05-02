"use client";
import React from "react";
import { MoradabadmetalcraftModal } from "@/components/moradabadmetalcraft";
export default function MoradabadmetalcraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <MoradabadmetalcraftModal isOpen={isOpen} onClose={onClose} />;
}
