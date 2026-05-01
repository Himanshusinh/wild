"use client";
import React from "react";
import { SonowalTextileModal } from "@/components/sonowaltextile";
export default function SonowalTextileFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SonowalTextileModal isOpen={isOpen} onClose={onClose} />;
}
