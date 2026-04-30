"use client";
import React from "react";
import { NeedleworkModal } from "@/components/needlework";
export default function NeedleworkFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <NeedleworkModal isOpen={isOpen} onClose={onClose} />;
}
