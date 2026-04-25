"use client";
import React from "react";
import { CoconutshellcraftModal } from "@/components/coconutshellcraft";
export default function CoconutshellcraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <CoconutshellcraftModal isOpen={isOpen} onClose={onClose} />;
}
