"use client";

import React from "react";
import { BidriwareModal } from "@/components/bidriware";

export default function BidriwareFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BidriwareModal isOpen={isOpen} onClose={onClose} />;
}

