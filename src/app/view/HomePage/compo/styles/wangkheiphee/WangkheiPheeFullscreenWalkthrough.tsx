"use client";

import React from "react";
import { WangkheiPheeModal } from "@/components/wangkheiphee";

export default function WangkheiPheeFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <WangkheiPheeModal isOpen={isOpen} onClose={onClose} />;
}

