"use client";
import React from "react";
import { CoircraftlakshadweepModal } from "@/components/coircraftlakshadweep";
export default function CoircraftlakshadweepFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <CoircraftlakshadweepModal isOpen={isOpen} onClose={onClose} />;
}
