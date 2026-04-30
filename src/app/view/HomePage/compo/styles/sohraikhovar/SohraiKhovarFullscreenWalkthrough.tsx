"use client";

import React from "react";
import { SohraiKhovarModal } from "@/components/sohraikhovar";

export default function SohraiKhovarFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <SohraiKhovarModal isOpen={isOpen} onClose={onClose} />;
}

