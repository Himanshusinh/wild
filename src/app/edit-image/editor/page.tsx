'use client';

import dynamic from 'next/dynamic';

// Pull the editor UI from the `image_edit` app sources.
// We enable this via `tsconfig` paths + Next `externalDir`.
const EditorShell = dynamic(
  () => import('@image-edit/components/editor/EditorShell').then((m: any) => m.EditorShell),
  { ssr: false }
);

export default function EditImageEditorPage() {
  return (
    <div className="h-screen w-screen box-border overflow-hidden pl-0 md:pl-20">
      <style jsx global>{`
        /* Prevent page scrolling - critical for the editor */
        html, body { overflow: hidden; height: 100%; width: 100%; margin: 0; padding: 0; }
        body { position: fixed; inset: 0; }

        /* Hide Fabric.js hidden textarea that can cause layout issues */
        .canvas-container textarea.hidden-textarea,
        textarea[data-fabric-hiddentextarea],
        .upper-canvas+textarea,
        .lower-canvas~textarea {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          opacity: 0 !important;
          width: 1px !important;
          height: 1px !important;
          z-index: -1 !important;
          pointer-events: none !important;
        }
      `}</style>

      <EditorShell />
    </div>
  );
}
