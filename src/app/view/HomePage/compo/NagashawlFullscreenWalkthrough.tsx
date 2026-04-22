"use client";

import React from "react";
import { NagaShawlModal } from "@/components/nagashawl";

export default function NagaShawlFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <NagaShawlModal isOpen={isOpen} onClose={onClose} />;
}

