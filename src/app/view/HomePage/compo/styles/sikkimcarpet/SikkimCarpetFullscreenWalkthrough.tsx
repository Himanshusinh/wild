"use client";
import React from "react";
import { SikkimCarpetModal } from "@/components/sikkimcarpet";
export default function SikkimCarpetFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SikkimCarpetModal isOpen={isOpen} onClose={onClose} />;
}
