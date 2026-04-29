"use client";
import React from "react";
import { CanebamboocraftandamanModal } from "@/components/canebamboocraftandaman";
export default function CanebamboocraftandamanFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <CanebamboocraftandamanModal isOpen={isOpen} onClose={onClose} />;
}
