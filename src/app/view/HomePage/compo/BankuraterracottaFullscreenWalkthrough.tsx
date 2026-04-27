"use client";
import React from "react";
import { BankuraterracottaModal } from "@/components/bankuraterracotta";
export default function BankuraterracottaFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <BankuraterracottaModal isOpen={isOpen} onClose={onClose} />;
}
