"use client";
import React from "react";
import { PatolaModal } from "@/components/patola";
export default function PatolaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PatolaModal isOpen={isOpen} onClose={onClose} />;
}
