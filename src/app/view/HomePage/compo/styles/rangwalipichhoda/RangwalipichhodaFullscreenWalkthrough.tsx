"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface RangwalipichhodaFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const RangwalipichhodaFullscreenWalkthrough: React.FC<RangwalipichhodaFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "rangwalipichhoda");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "rangwalipichhoda"}
      styleTitle={style?.title || "Rangwalipichhoda"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default RangwalipichhodaFullscreenWalkthrough;
