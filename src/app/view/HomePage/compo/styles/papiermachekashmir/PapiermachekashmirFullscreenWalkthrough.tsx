"use client";
import React from "react";
import { PapiermachekashmirModal } from "@/components/papiermachekashmir";
export default function PapiermachekashmirFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PapiermachekashmirModal isOpen={isOpen} onClose={onClose} />;
}
