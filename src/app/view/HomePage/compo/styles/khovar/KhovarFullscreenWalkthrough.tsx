"use client";

import React from "react";
import { KhovarModal } from "@/components/khovar";

interface KhovarFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KhovarFullscreenWalkthrough({
  isOpen,
  onClose,
}: KhovarFullscreenWalkthroughProps) {
  return <KhovarModal isOpen={isOpen} onClose={onClose} />;
}
