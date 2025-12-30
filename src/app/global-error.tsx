"use client";

import React from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    // Automatically reload on ChunkLoadError (deployment version mismatch)
    if (error?.message?.includes('Loading chunk') || error?.message?.includes('ChunkLoadError') || error?.name === 'ChunkLoadError') {
       const reloadKey = `reload_chunk_error_${new Date().getMinutes()}`;
       if (!sessionStorage.getItem(reloadKey)) {
         sessionStorage.setItem(reloadKey, 'true');
         window.location.reload();
       }
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-2xl font-semibold">App crashed</div>
            <div className="text-white/70 text-sm break-words">
              {error?.message || "We hit an error while rendering this page."}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => reset()}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-sm"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-[#2F6BFF] hover:bg-[#2a5fe3] text-sm"
              >
                Reload
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && error?.digest && (
              <div className="text-xs text-white/50">Ref: {error.digest}</div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
