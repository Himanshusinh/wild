"use client";

import React from "react";
import { LeatherToysModal } from "@/components/leathertoys";

export default function LeatherToysFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <LeatherToysModal isOpen={isOpen} onClose={onClose} />;
}

