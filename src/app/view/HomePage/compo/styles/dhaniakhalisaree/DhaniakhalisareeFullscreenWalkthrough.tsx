"use client";
import React from "react";
import { DhaniakhalisareeModal } from "@/components/dhaniakhalisaree";
export default function DhaniakhalisareeFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <DhaniakhalisareeModal isOpen={isOpen} onClose={onClose} />;
}
