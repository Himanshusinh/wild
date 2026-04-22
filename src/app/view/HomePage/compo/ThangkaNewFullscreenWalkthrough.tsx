"use client";

import React from "react";
import { ThangkaNewModal } from "@/components/thangkanew";

export default function ThangkaNewFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <ThangkaNewModal isOpen={isOpen} onClose={onClose} />;
}
