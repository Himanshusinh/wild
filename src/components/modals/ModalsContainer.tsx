"use client";

import React from "react";
import dynamic from "next/dynamic";

const StorageFullModal = dynamic(() => import("./StorageFullModal"), { ssr: false });
const NoCreditsModal = dynamic(() => import("./NoCreditsModal"), { ssr: false });

export default function ModalsContainer() {
  return (
    <>
      <StorageFullModal />
      <NoCreditsModal />
    </>
  );
}
