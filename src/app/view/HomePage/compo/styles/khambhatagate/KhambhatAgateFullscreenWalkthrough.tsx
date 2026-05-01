"use client";

import React from "react";
import { KhambhatAgateModal } from "@/components/khambhatagate";

export default function KhambhatAgateFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KhambhatAgateModal isOpen={isOpen} onClose={onClose} />;
}

