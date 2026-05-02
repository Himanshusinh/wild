"use client";
import React from "react";
import { RuralFiberCraftModal } from "@/components/ruralfibercraft";
export default function RuralFiberCraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <RuralFiberCraftModal isOpen={isOpen} onClose={onClose} />;
}
