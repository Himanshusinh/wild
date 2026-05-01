"use client";
import React from "react";
import { MolelaModal } from "@/components/molela";
export default function MolelaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <MolelaModal isOpen={isOpen} onClose={onClose} />;
}
