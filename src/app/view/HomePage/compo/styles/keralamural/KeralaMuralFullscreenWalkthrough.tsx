"use client";

import React from "react";
import { KeralaMuralModal } from "@/components/keralamural";

export default function KeralaMuralFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KeralaMuralModal isOpen={isOpen} onClose={onClose} />;
}

