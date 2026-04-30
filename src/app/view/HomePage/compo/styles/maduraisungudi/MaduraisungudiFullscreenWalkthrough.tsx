"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface MaduraisungudiFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const MaduraisungudiFullscreenWalkthrough: React.FC<MaduraisungudiFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "maduraisungudi");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "maduraisungudi"}
      styleTitle={style?.title || "Maduraisungudi"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default MaduraisungudiFullscreenWalkthrough;
