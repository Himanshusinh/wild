"use client";
import React from "react";
import { BasohlipaintingModal } from "@/components/basohlipainting";
export default function BasohlipaintingFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BasohlipaintingModal isOpen={isOpen} onClose={onClose} />;
}
