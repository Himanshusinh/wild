"use client";
import React from "react";
import { SauraModal } from "@/components/saura";
export default function SauraFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SauraModal isOpen={isOpen} onClose={onClose} />;
}
