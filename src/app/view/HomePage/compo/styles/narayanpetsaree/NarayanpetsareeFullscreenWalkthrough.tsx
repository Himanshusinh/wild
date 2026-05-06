"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface NarayanpetsareeFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const NarayanpetsareeFullscreenWalkthrough: React.FC<NarayanpetsareeFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "narayanpetsaree");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "narayanpetsaree"}
      styleTitle={style?.title || "Narayanpetsaree"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default NarayanpetsareeFullscreenWalkthrough;
