"use client";

import React from "react";
import { AzulejosModal } from "@/components/azulejos";

export default function AzulejosFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <AzulejosModal isOpen={isOpen} onClose={onClose} />;
}

