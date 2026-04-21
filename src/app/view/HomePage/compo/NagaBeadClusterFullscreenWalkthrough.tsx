"use client";

import React from "react";
import { NagaBeadClusterModal } from "@/components/nagabeadcluster";

export default function NagaBeadClusterFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <NagaBeadClusterModal isOpen={isOpen} onClose={onClose} />;
}

