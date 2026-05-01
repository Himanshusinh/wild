"use client";

import React from "react";
import { IduMishmiModal } from "@/components/idumishmi";

export default function IduMishmiFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <IduMishmiModal isOpen={isOpen} onClose={onClose} />;
}

