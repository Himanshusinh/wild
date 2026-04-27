"use client";
import React from "react";
import { BerhampurPattaModal } from "@/components/berhampurpatta";
export default function BerhampurPattaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BerhampurPattaModal isOpen={isOpen} onClose={onClose} />;
}
