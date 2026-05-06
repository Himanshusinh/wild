"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface KalighatpaintingFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const KalighatpaintingFullscreenWalkthrough: React.FC<KalighatpaintingFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "kalighatpainting");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "kalighatpainting"}
      styleTitle={style?.title || "Kalighatpainting"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default KalighatpaintingFullscreenWalkthrough;
