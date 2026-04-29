"use client";
import React from "react";
import { SohraiModal } from "@/components/sohrai";
export default function SohraiFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SohraiModal isOpen={isOpen} onClose={onClose} />;
}
