"use client";

import React from "react";
import { ChannapatnaToysModal } from "@/components/channapatnatoys";

export default function ChannapatnaToysFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <ChannapatnaToysModal isOpen={isOpen} onClose={onClose} />;
}

