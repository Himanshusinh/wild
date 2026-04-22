"use client";
import React from "react";
import { RajasthaniMiniatureModal } from "@/components/rajasthaniminiature";
export default function RajasthaniMiniatureFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <RajasthaniMiniatureModal isOpen={isOpen} onClose={onClose} />;
}
