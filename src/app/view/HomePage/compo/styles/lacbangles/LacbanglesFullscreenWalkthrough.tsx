"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface LacbanglesFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const LacbanglesFullscreenWalkthrough: React.FC<LacbanglesFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "lacbangles");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "lacbangles"}
      styleTitle={style?.title || "Lacbangles"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default LacbanglesFullscreenWalkthrough;
