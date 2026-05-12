"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface CholaoldbronzeFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const CholaoldbronzeFullscreenWalkthrough: React.FC<CholaoldbronzeFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "cholaoldbronze");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "cholaoldbronze"}
      styleTitle={style?.title || "Cholaoldbronze"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default CholaoldbronzeFullscreenWalkthrough;
