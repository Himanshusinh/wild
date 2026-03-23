export type SseEvent = { event: string; data: any };

function parseEventBlock(block: string): SseEvent | null {
  const lines = block.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim() || "message";
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
      continue;
    }
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

/**
 * Minimal SSE parser for fetch() response bodies (ReadableStream).
 * Expects chunks in the format: `event: name\ndata: {...}\n\n`.
 */
export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Events are separated by a blank line
    while (true) {
      const sepIndex = buffer.indexOf("\n\n");
      if (sepIndex === -1) break;
      const block = buffer.slice(0, sepIndex).trimEnd();
      buffer = buffer.slice(sepIndex + 2);
      const evt = parseEventBlock(block);
      if (evt) yield evt;
    }
  }
}

