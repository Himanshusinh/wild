"use client";
import React from "react";
import { ChandigarhmodernistModal } from "@/components/chandigarhmodernist";
export default function ChandigarhmodernistFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <ChandigarhmodernistModal isOpen={isOpen} onClose={onClose} />;
}
