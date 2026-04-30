"use client";
import React from "react";
import { SaharanpurwoodcraftModal } from "@/components/saharanpurwoodcraft";
export default function SaharanpurwoodcraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SaharanpurwoodcraftModal isOpen={isOpen} onClose={onClose} />;
}
