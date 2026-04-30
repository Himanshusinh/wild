"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface BanarasibrocadeFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const BanarasibrocadeFullscreenWalkthrough: React.FC<BanarasibrocadeFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "banarasibrocade");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "banarasibrocade"}
      styleTitle={style?.title || "Banarasibrocade"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default BanarasibrocadeFullscreenWalkthrough;
