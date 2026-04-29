"use client";

import React from "react";
import { TawlhlophuanModal } from "@/components/tawlhlophuan";

export default function TawlhlophuanFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <TawlhlophuanModal isOpen={isOpen} onClose={onClose} />;
}

