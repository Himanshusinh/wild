"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface KolamgeometryFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const KolamgeometryFullscreenWalkthrough: React.FC<KolamgeometryFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "kolamgeometry");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "kolamgeometry"}
      styleTitle={style?.title || "Kolamgeometry"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default KolamgeometryFullscreenWalkthrough;
