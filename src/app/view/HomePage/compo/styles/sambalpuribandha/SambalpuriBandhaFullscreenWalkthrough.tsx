"use client";
import React from "react";
import { SambalpuriBandhaModal } from "@/components/sambalpuribandha";
export default function SambalpuriBandhaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <SambalpuriBandhaModal isOpen={isOpen} onClose={onClose} />;
}
