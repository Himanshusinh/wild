"use client";
import React from "react";
import { TerracottacraftModal } from "@/components/terracottacraft";
export default function TerracottacraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <TerracottacraftModal isOpen={isOpen} onClose={onClose} />;
}
