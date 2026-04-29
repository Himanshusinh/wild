"use client";

import React from "react";
import { GaradsareeModal } from "@/components/garadsaree";

export default function GaradsareeFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <GaradsareeModal isOpen={isOpen} onClose={onClose} />;
}
