"use client";

import React from "react";
import { CeremonialEmblemModal } from "@/components/ceremonialemblem";

export default function CeremonialEmblemFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <CeremonialEmblemModal isOpen={isOpen} onClose={onClose} />;
}

