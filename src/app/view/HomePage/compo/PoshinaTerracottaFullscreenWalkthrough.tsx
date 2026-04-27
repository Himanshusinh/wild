"use client";

import React from "react";
import { PoshinaTerracottaModal } from "@/components/poshinaterracotta";

export default function PoshinaTerracottaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <PoshinaTerracottaModal isOpen={isOpen} onClose={onClose} />;
}

