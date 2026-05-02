"use client";
import React from "react";
import { CoastalfibercraftModal } from "@/components/coastalfibercraft";
export default function CoastalfibercraftFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <CoastalfibercraftModal isOpen={isOpen} onClose={onClose} />;
}
