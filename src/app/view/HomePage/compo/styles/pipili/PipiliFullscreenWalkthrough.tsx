"use client";
import React from "react";
import { PipiliModal } from "@/components/pipili";
export default function PipiliFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PipiliModal isOpen={isOpen} onClose={onClose} />;
}
