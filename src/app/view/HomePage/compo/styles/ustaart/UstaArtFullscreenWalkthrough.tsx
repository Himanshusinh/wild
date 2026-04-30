"use client";
import React from "react";
import { UstaArtModal } from "@/components/ustaart";
export default function UstaArtFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <UstaArtModal isOpen={isOpen} onClose={onClose} />;
}
