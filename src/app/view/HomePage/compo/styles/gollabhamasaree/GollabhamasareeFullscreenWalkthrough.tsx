"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface GollabhamasareeFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const GollabhamasareeFullscreenWalkthrough: React.FC<GollabhamasareeFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "gollabhamasaree");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "gollabhamasaree"}
      styleTitle={style?.title || "Gollabhamasaree"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default GollabhamasareeFullscreenWalkthrough;
