"use client";

import React from "react";
import { BambooCraftModal } from "@/components/bamboocraft";

export default function BambooCraftFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BambooCraftModal isOpen={isOpen} onClose={onClose} />;
}

