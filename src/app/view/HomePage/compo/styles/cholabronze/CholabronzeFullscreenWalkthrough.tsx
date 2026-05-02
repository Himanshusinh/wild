"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface CholabronzeFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const CholabronzeFullscreenWalkthrough: React.FC<CholabronzeFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "cholabronze");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "cholabronze"}
      styleTitle={style?.title || "Cholabronze"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default CholabronzeFullscreenWalkthrough;
