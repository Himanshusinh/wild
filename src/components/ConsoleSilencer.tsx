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
  // Disabled to allow debugging - logs will show in browser console
  return null;
}
