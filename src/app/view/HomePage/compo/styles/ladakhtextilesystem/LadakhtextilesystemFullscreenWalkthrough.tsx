"use client";
import React from "react";
import { LadakhtextilesystemModal } from "@/components/ladakhtextilesystem";
export default function LadakhtextilesystemFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <LadakhtextilesystemModal isOpen={isOpen} onClose={onClose} />;
}
