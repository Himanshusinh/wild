"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface FarrukhabadprintFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const FarrukhabadprintFullscreenWalkthrough: React.FC<FarrukhabadprintFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "farrukhabadprint");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "farrukhabadprint"}
      styleTitle={style?.title || "Farrukhabadprint"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default FarrukhabadprintFullscreenWalkthrough;
