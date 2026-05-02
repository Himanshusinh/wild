"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface TanjorepaintingFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const TanjorepaintingFullscreenWalkthrough: React.FC<TanjorepaintingFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "tanjorepainting");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "tanjorepainting"}
      styleTitle={style?.title || "Tanjorepainting"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default TanjorepaintingFullscreenWalkthrough;
