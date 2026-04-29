"use client";
import React from "react";
import { KathputliModal } from "@/components/kathputli";
export default function KathputliFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <KathputliModal isOpen={isOpen} onClose={onClose} />;
}
