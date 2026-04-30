"use client";
import React from "react";
import { SarkandaArchitectureModal } from "@/components/sarkandaarchitecture";
export default function SarkandaArchitectureFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SarkandaArchitectureModal isOpen={isOpen} onClose={onClose} />;
}
