"use client";
import React from "react";
import { SitalpatiModal } from "@/components/sitalpati";
export default function SitalpatiFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SitalpatiModal isOpen={isOpen} onClose={onClose} />;
}
