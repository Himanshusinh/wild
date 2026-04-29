"use client";
import React from "react";
import { PattachitraModal } from "@/components/pattachitra";
export default function PattachitraFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PattachitraModal isOpen={isOpen} onClose={onClose} />;
}
