"use client";
import React from "react";
import { DurrieModal } from "@/components/durrie";
export default function DurrieFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <DurrieModal isOpen={isOpen} onClose={onClose} />;
}
