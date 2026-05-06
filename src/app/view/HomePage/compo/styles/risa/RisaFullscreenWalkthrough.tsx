"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface RisaFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const RisaFullscreenWalkthrough: React.FC<RisaFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "risa");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "risa"}
      styleTitle={style?.title || "Risa"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default RisaFullscreenWalkthrough;
