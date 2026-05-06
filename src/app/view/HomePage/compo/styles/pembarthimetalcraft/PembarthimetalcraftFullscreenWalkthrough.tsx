"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface PembarthimetalcraftFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const PembarthimetalcraftFullscreenWalkthrough: React.FC<PembarthimetalcraftFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "pembarthimetalcraft");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "pembarthimetalcraft"}
      styleTitle={style?.title || "Pembarthimetalcraft"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default PembarthimetalcraftFullscreenWalkthrough;
