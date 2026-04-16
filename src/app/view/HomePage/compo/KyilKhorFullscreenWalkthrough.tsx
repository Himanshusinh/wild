"use client";

import React from "react";
import { KyilKhorModal } from "@/components/kyilkhor";

export default function KyilKhorFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KyilKhorModal isOpen={isOpen} onClose={onClose} />;
}

