"use client";
import React from "react";
import { BomkaiModal } from "@/components/bomkai";
export default function BomkaiFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BomkaiModal isOpen={isOpen} onClose={onClose} />;
}
