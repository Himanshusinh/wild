"use client";
import React from "react";
import { ShimplaHastkalaModal } from "@/components/shimplahastkala";
export default function ShimplaHastkalaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <ShimplaHastkalaModal isOpen={isOpen} onClose={onClose} />;
}
