"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface MahabalipuramsculptureFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const MahabalipuramsculptureFullscreenWalkthrough: React.FC<MahabalipuramsculptureFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "mahabalipuramsculpture");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "mahabalipuramsculpture"}
      styleTitle={style?.title || "Mahabalipuramsculpture"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default MahabalipuramsculptureFullscreenWalkthrough;
