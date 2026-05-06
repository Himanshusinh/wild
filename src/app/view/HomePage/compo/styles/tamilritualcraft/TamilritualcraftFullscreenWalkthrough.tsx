"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface TamilritualcraftFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const TamilritualcraftFullscreenWalkthrough: React.FC<TamilritualcraftFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "tamilritualcraft");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "tamilritualcraft"}
      styleTitle={style?.title || "Tamilritualcraft"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default TamilritualcraftFullscreenWalkthrough;
