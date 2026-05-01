"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface NirmalartFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const NirmalartFullscreenWalkthrough: React.FC<NirmalartFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "nirmalart");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "nirmalart"}
      styleTitle={style?.title || "Nirmalart"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default NirmalartFullscreenWalkthrough;
