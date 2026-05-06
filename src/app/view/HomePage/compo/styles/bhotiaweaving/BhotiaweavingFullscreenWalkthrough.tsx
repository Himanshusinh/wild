"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface BhotiaweavingFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const BhotiaweavingFullscreenWalkthrough: React.FC<BhotiaweavingFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "bhotiaweaving");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "bhotiaweaving"}
      styleTitle={style?.title || "Bhotiaweaving"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default BhotiaweavingFullscreenWalkthrough;
