"use client";
import React from "react";
import { BalucharisareeModal } from "@/components/balucharisaree";
export default function BalucharisareeFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BalucharisareeModal isOpen={isOpen} onClose={onClose} />;
}
