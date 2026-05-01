"use client";

import React from "react";
import TraditionalStyleWalkthrough from "../../TraditionalStyleWalkthrough";
import { STYLES } from "@/styles/creativeStyleCatalog";

interface PilkhuwablockprintFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const PilkhuwablockprintFullscreenWalkthrough: React.FC<PilkhuwablockprintFullscreenWalkthroughProps> = ({ isOpen, onClose }) => {
  const style = STYLES.find((s) => s.id === "pilkhuwablockprint");
  return (
    <TraditionalStyleWalkthrough
      isOpen={isOpen}
      onClose={onClose}
      styleId={style?.id || "pilkhuwablockprint"}
      styleTitle={style?.title || "Pilkhuwablockprint"}
      styleName={style?.name || "India"}
      styleDesc={style?.desc || "Traditional Indian visual language."}
      styleImage={style?.image || "/styles/Logo.gif"}
      styleTag={style?.tag || "Art"}
    />
  );
};

export default PilkhuwablockprintFullscreenWalkthrough;
