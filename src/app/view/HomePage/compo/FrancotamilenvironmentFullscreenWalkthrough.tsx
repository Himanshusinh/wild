"use client";
import React from "react";
import { FrancotamilenvironmentModal } from "@/components/francotamilenvironment";
export default function FrancotamilenvironmentFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <FrancotamilenvironmentModal isOpen={isOpen} onClose={onClose} />;
}
