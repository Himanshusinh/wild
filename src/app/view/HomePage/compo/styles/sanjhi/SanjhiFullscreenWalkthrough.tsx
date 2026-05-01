"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface SanjhiFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const SanjhiFullscreenWalkthrough: React.FC<SanjhiFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "sanjhi");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "sanjhi"}
      styleTitle={style?.title || "Sanjhi"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default SanjhiFullscreenWalkthrough;
