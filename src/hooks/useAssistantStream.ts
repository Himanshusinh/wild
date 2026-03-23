import { useCallback, useRef, useState } from "react";
import { parseSseStream, type SseEvent } from "@/lib/sseParser";

export type AssistantStreamEvent = SseEvent & { event: string };

export function useAssistantStream() {
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const start = useCallback(
    async (opts: {
      apiUrl: string;
      message: string;
      sessionId: string;
      onEvent: (evt: AssistantStreamEvent) => void;
    }) => {
      stop();
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(opts.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: opts.message, sessionId: opts.sessionId }),
          signal: controller.signal,
          credentials: "include",
        });

        if (!res.ok || !res.body) {
          throw new Error(`Stream failed (${res.status})`);
        }

        for await (const evt of parseSseStream(res.body)) {
          opts.onEvent(evt);
          if (evt.event === "done" || evt.event === "error") break;
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError(e?.message ?? "Stream failed");
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [stop],
  );

  return { start, stop, isStreaming, error };
}

