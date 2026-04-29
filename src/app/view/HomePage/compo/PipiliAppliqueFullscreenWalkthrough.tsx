"use client";
import React from "react";
import { PipiliAppliqueModal } from "@/components/pipiliapplique";
export default function PipiliAppliqueFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PipiliAppliqueModal isOpen={isOpen} onClose={onClose} />;
}
