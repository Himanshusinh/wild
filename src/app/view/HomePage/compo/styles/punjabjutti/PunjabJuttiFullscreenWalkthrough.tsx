"use client";
import React from "react";
import { PunjabJuttiModal } from "@/components/punjabjutti";
export default function PunjabJuttiFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PunjabJuttiModal isOpen={isOpen} onClose={onClose} />;
}
