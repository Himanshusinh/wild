"use client";

import React from "react";
import { KolhapurJewelleryModal } from "@/components/kolhapurjewellery";

export default function KolhapurJewelleryFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KolhapurJewelleryModal isOpen={isOpen} onClose={onClose} />;
}

