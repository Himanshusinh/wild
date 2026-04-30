"use client";
import React from "react";
import { SanganerModal } from "@/components/sanganer";
export default function SanganerFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SanganerModal isOpen={isOpen} onClose={onClose} />;
}
