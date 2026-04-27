"use client";

import React from "react";
import { TraditionalStyleModal } from "@/components/traditional/TraditionalStyleModal";

export default function TraditionalStyleFullscreenWalkthrough({
  isOpen,
  onClose,
  styleId,
  styleTitle,
  styleName,
  styleDesc,
  styleTag,
}: {
  isOpen: boolean;
  onClose: () => void;
  styleId: string;
  styleTitle: string;
  styleName: string;
  styleDesc: string;
  styleTag: string;
}) {
  return (
    <TraditionalStyleModal
      isOpen={isOpen}
      onClose={onClose}
      styleId={styleId}
      styleTitle={styleTitle}
      styleName={styleName}
      styleDesc={styleDesc}
      styleTag={styleTag}
    />
  );
}
