"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface OdishafiligreeFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const OdishafiligreeFullscreenWalkthrough: React.FC<OdishafiligreeFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "odishafiligree");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "odishafiligree"}
      styleTitle={style?.title || "Odishafiligree"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default OdishafiligreeFullscreenWalkthrough;
