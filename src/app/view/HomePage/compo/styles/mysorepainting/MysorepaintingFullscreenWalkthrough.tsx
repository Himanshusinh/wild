"use client";

import React from "react";
import { MysorepaintingModal } from "@/components/mysorepainting";

export default function MysorepaintingFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MysorepaintingModal isOpen={isOpen} onClose={onClose} />;
}
