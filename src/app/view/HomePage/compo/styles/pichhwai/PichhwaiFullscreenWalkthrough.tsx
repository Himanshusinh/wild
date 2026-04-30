"use client";
import React from "react";
import { PichhwaiModal } from "@/components/pichhwai";
export default function PichhwaiFullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  return <PichhwaiModal isOpen={isOpen} onClose={onClose} />;
}
