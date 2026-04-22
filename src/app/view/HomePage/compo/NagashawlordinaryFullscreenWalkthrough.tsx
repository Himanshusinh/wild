"use client";

import React from "react";
import { NagashawlordinaryModal } from "@/components/nagashawlordinary";

export default function NagashawlordinaryFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <NagashawlordinaryModal isOpen={isOpen} onClose={onClose} />;
}
