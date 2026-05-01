"use client";

import React from "react";
import { KondapalliModal } from "@/components/kondapalli";

export default function KondapalliFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KondapalliModal isOpen={isOpen} onClose={onClose} />;
}

