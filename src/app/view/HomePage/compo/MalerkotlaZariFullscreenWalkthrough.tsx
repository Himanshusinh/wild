"use client";
import React from "react";
import { MalerkotlaZariModal } from "@/components/malerkotlazari";
export default function MalerkotlaZariFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <MalerkotlaZariModal isOpen={isOpen} onClose={onClose} />;
}
