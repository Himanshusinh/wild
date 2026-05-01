"use client";

import React from "react";
import { MadhubaniModal } from "@/components/madhubani";

export default function MadhubaniFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MadhubaniModal isOpen={isOpen} onClose={onClose} />;
}

