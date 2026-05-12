"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface ThanjavurdollFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThanjavurdollFullscreenWalkthrough: React.FC<ThanjavurdollFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "thanjavurdoll");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "thanjavurdoll"}
      styleTitle={style?.title || "Thanjavurdoll"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default ThanjavurdollFullscreenWalkthrough;
