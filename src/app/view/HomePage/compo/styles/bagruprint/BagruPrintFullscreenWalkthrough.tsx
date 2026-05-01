"use client";
import React from "react";
import { BagruPrintModal } from "@/components/bagruprint";
export default function BagruPrintFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BagruPrintModal isOpen={isOpen} onClose={onClose} />;
}
