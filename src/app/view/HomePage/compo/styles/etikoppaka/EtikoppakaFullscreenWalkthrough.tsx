"use client";

import React from "react";
import { EtikoppakaModal } from "@/components/etikoppaka";

export default function EtikoppakaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <EtikoppakaModal isOpen={isOpen} onClose={onClose} />;
}

