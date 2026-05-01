"use client";
import React from "react";
import { IndoportugueseenvironmentModal } from "@/components/indoportugueseenvironment";
export default function IndoportugueseenvironmentFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <IndoportugueseenvironmentModal isOpen={isOpen} onClose={onClose} />;
}
