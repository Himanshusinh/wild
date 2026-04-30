"use client";
import React from "react";
import { PhulkariModal } from "@/components/phulkari";
export default function PhulkariFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PhulkariModal isOpen={isOpen} onClose={onClose} />;
}
