"use client";

import { useEffect } from "react";

/**
 * ConsoleSilencer
 * Disables all console output on the client to keep the console clean.
 * This affects: log, info, warn, error, debug, group, groupEnd, time, timeEnd, trace.
 * 
 * By default, all logs are allowed. Set ?silenceConsole=1 in the URL to enable suppression.
 */
export default function ConsoleSilencer() {
  useEffect(() => {
    try {
      // Check if console silencing is enabled via URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const shouldSilence = urlParams.get('silenceConsole') === '1';
      
      // If silencing is not enabled, allow all logs by default
      if (!shouldSilence) {
        return; // Don't suppress anything
      }
      
      // Only suppress if explicitly requested via ?silenceConsole=1
      // Allow only specially-prefixed debug logs (e.g. [INF_SCROLL]) and suppress all other console output.
      const ALLOW_PREFIXES = ['[INF_SCROLL]', '[AnimateInputBox]', '[VideoPage]'];
      const original: Record<string, any> = {};
      const passthrough = (method: keyof Console) => {
        original[method] = (console as any)[method];
        (console as any)[method] = (...args: any[]) => {
          try {
            if (!args.length) return; // nothing to print
            const first = typeof args[0] === 'string' ? args[0] : '';
            if (ALLOW_PREFIXES.some(p => first.startsWith(p))) {
              return original[method](...args);
            }
            // Suppress everything else.
          } catch {}
        };
      };
      ['log','info','warn','error','debug','group','groupEnd','time','timeEnd','trace'].forEach(m => passthrough(m as keyof Console));
    } catch {}
  }, []);
  return null;
}
