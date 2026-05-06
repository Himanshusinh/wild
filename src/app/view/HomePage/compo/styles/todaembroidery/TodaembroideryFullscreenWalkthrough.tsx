"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface TodaembroideryFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const TodaembroideryFullscreenWalkthrough: React.FC<TodaembroideryFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "todaembroidery");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "todaembroidery"}
      styleTitle={style?.title || "Todaembroidery"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default TodaembroideryFullscreenWalkthrough;
