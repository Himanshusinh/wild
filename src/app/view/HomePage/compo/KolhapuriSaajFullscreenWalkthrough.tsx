"use client";

import React from "react";
import { KolhapuriSaajModal } from "@/components/kolhapurisaaj";

export default function KolhapuriSaajFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KolhapuriSaajModal isOpen={isOpen} onClose={onClose} />;
}

