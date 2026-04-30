"use client";

import React from "react";
import { TaiAhomManuscriptModal } from "@/components/taiahommanuscript";

export default function TaiAhomManuscriptFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <TaiAhomManuscriptModal isOpen={isOpen} onClose={onClose} />;
}

