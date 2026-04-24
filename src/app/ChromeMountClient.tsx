"use client";

import dynamic from "next/dynamic";

const ChromeMount = dynamic(() => import("./chrome-mount"), {
  ssr: false,
});

export default function ChromeMountClient() {
  return <ChromeMount />;
}
