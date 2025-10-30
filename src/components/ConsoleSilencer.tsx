"use client";

import { useEffect } from "react";

/**
 * ConsoleSilencer
 * Disables all console output on the client to keep the console clean.
 * This affects: log, info, warn, error, debug, group, groupEnd, time, timeEnd, trace.
 */
export default function ConsoleSilencer() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const debugParam = url.searchParams.get('debug');
      if (debugParam === '1') {
        localStorage.setItem('wild_debug', '1');
      } else if (debugParam === '0') {
        localStorage.removeItem('wild_debug');
      }
      const isDebug = localStorage.getItem('wild_debug') === '1';
      if (isDebug) {
        try { console.info('[ConsoleSilencer] Debug mode enabled via ?debug=1 or localStorage'); } catch {}
        return; // do not silence in debug mode
      }
      const noop = () => {};
      const methods: (keyof Console)[] = [
        "log",
        "info",
        "warn",
        "error",
        "debug",
        "group",
        "groupEnd",
        "time",
        "timeEnd",
        "trace",
      ];
      methods.forEach((m) => {
        try {
          // @ts-expect-error: overriding console methods intentionally
          console[m] = noop;
        } catch {}
      });
    } catch {}
  }, []);

  return null;
}
