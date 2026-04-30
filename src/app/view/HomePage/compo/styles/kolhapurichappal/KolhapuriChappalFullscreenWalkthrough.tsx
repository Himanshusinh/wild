"use client";

import React from "react";
import { KolhapuriChappalModal } from "@/components/kolhapurichappal";

export default function KolhapuriChappalFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KolhapuriChappalModal isOpen={isOpen} onClose={onClose} />;
}

