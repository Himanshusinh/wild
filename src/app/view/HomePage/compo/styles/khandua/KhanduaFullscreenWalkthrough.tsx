"use client";
import React from "react";
import { KhanduaModal } from "@/components/khandua";
export default function KhanduaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <KhanduaModal isOpen={isOpen} onClose={onClose} />;
}
