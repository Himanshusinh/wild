"use client";
import React from "react";
import { LikhaiwoodcarvingModal } from "@/components/likhaiwoodcarving";
export default function LikhaiwoodcarvingFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <LikhaiwoodcarvingModal isOpen={isOpen} onClose={onClose} />;
}
