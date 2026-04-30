"use client";
import React from "react";
import { RockgardenassemblageModal } from "@/components/rockgardenassemblage";
export default function RockgardenassemblageFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <RockgardenassemblageModal isOpen={isOpen} onClose={onClose} />;
}
