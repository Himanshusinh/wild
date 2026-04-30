"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface BanarasmuralFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const BanarasmuralFullscreenWalkthrough: React.FC<BanarasmuralFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "banarasmural");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "banarasmural"}
      styleTitle={style?.title || "Banarasmural"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default BanarasmuralFullscreenWalkthrough;
