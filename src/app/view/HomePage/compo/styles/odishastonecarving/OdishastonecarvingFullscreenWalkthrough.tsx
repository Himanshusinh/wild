"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface OdishastonecarvingFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const OdishastonecarvingFullscreenWalkthrough: React.FC<OdishastonecarvingFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "odishastonecarving");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "odishastonecarving"}
      styleTitle={style?.title || "Odishastonecarving"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default OdishastonecarvingFullscreenWalkthrough;
