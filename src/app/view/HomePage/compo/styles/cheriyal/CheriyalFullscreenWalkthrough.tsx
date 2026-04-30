"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface CheriyalFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheriyalFullscreenWalkthrough: React.FC<CheriyalFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "cheriyal");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "cheriyal"}
      styleTitle={style?.title || "Cheriyal"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default CheriyalFullscreenWalkthrough;
