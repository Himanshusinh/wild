"use client";
import React from "react";
import { PapiermachepuducherryModal } from "@/components/papiermachepuducherry";
export default function PapiermachepuducherryFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PapiermachepuducherryModal isOpen={isOpen} onClose={onClose} />;
}
