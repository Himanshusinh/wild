"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface GadwalsareeFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const GadwalsareeFullscreenWalkthrough: React.FC<GadwalsareeFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "gadwalsaree");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "gadwalsaree"}
      styleTitle={style?.title || "Gadwalsaree"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default GadwalsareeFullscreenWalkthrough;
