"use client";
import React from "react";
import { ShellcraftModal } from "@/components/shellcraft";
export default function ShellcraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <ShellcraftModal isOpen={isOpen} onClose={onClose} />;
}
