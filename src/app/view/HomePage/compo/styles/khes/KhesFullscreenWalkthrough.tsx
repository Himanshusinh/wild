"use client";
import React from "react";
import { KhesModal } from "@/components/khes";
export default function KhesFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <KhesModal isOpen={isOpen} onClose={onClose} />;
}
