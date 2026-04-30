"use client";

import React from "react";
import { PuanlaisenModal } from "@/components/puanlaisen";

export default function PuanlaisenFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <PuanlaisenModal isOpen={isOpen} onClose={onClose} />;
}

