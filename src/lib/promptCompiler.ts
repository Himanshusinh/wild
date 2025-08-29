import { BackendPromptV1, FalI2VRequest } from '@/types/backendPrompt';

/**
 * Compiles a BackendPromptV1 into the exact FAL API payload format
 * This function merges manual details (or AI-autofilled ones) into a single, powerful prompt string
 */
export function compileToFalI2V(input: BackendPromptV1): FalI2VRequest {
  // 1) Base, style & brand context
  const lines: string[] = [];
  lines.push(
    "Create an 8-second authentic UGC product ad filmed in a social, handheld style."
  );

  if (input.style?.background) lines.push(`Background: ${input.style.background}.`);
  if (input.style?.lighting) lines.push(`Lighting: ${input.style.lighting}.`);
  if (input.style?.camera_style) lines.push(`Camera: ${input.style.camera_style}.`);
  if (input.style?.framing) lines.push(`Framing: ${input.style.framing}.`);

  if (input.brand?.name) lines.push(`Brand: ${input.brand.name} (do not alter the logo).`);
  if (input.brand?.tone) lines.push(`Tone: ${input.brand.tone}.`);
  if (input.brand?.color_palette?.length) {
    lines.push(`Brand colors to subtly reflect: ${input.brand.color_palette.join(", ")}.`);
  }

  if (input.talent) {
    const t = input.talent;
    const desc = [
      t.age_range ? `age ${t.age_range}` : null,
      t.presentation || null,
      t.speaking_style ? `speaking ${t.speaking_style}` : null
    ].filter(Boolean).join(", ");
    if (desc) lines.push(`On-camera person: ${desc}.`);
    if (t.gestures) lines.push(`Gestures: ${t.gestures}.`);
  }

  // 2) Constraints (FAL has no separate negative_prompt; include in text)
  const avoids = input.constraints?.avoid?.length
    ? input.constraints.avoid
    : ["extra fingers","warped hands","distorted product","changed or blurred logo","extra brands","text artifacts","heavy flicker"];
  lines.push(`Avoid: ${avoids.join(", ")}.`);

  if (input.constraints?.legal) lines.push(`Legal: ${input.constraints.legal}`);

  // 3) Core content: beats (preferred) or script
  if (input.beats?.length) {
    const sorted = [...input.beats].sort((a, b) => a.start - b.start);
    for (const b of sorted) {
      const span = `[${b.start.toFixed(1)}–${b.end.toFixed(1)}s]`;
      const cam = b.camera ? `[${b.camera}]` : "";
      const sfx = b.sfx ? ` SFX: ${b.sfx}.` : "";
      const amb = b.ambience ? ` Ambience: ${b.ambience}.` : "";
      const ost = b.on_screen_text ? ` On-screen text: ${b.on_screen_text}.` : "";
      lines.push(`${span} ${cam} Action: ${b.action}. Dialogue: ${b.dialogue}.${sfx}${amb}${ost}`);
    }
  } else if (input.script) {
    // Simple 3-beat structure out of hook/body/cta
    const hook = input.script.hook ? `0–2s [Zoom in] Dialogue: ${input.script.hook}.` : "";
    const body = input.script.body ? `2–6s [Pan left] Dialogue: ${input.script.body}.` : "";
    const cta  = input.script.cta  ? `6–8s [Tilt up] Dialogue: ${input.script.cta}.` : "";
    lines.push(hook, body, cta);
  } else {
    // Minimal safe default if nothing provided
    lines.push(`0–2s [Zoom in] Dialogue: "Real talk... this improved my routine."`);
    lines.push(`2–6s [Pan left] Action: hold product closer; Dialogue: "Quality is solid and it actually works."`);
    lines.push(`6–8s [Tilt up] Dialogue: "If you're on the fence, try it."`);
  }

  // 4) Compose final prompt text
  const prompt = lines.filter(Boolean).join(" ");

  // 5) Return the exact FAL payload
  return {
    prompt,
    image_url: input.media.image_url,
    duration: input.delivery.duration,        // "8s"
    generate_audio: input.delivery.generate_audio,
    resolution: input.delivery.resolution     // "720p" | "1080p"
  };
}

/**
 * Validates a BackendPromptV1 object
 */
export function validateBackendPrompt(input: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.mode || !['auto', 'manual'].includes(input.mode)) {
    errors.push('mode must be "auto" or "manual"');
  }

  if (!input.media?.image_url) {
    errors.push('media.image_url is required');
  }

  if (!input.delivery?.engine || !['veo3', 'veo3_fast'].includes(input.delivery.engine)) {
    errors.push('delivery.engine must be "veo3" or "veo3_fast"');
  }

  if (!input.delivery?.resolution || !['720p', '1080p'].includes(input.delivery.resolution)) {
    errors.push('delivery.resolution must be "720p" or "1080p"');
  }

  if (input.delivery?.duration !== '8s') {
    errors.push('delivery.duration must be "8s"');
  }

  if (typeof input.delivery?.generate_audio !== 'boolean') {
    errors.push('delivery.generate_audio must be a boolean');
  }

  // Validate beats if provided
  if (input.beats?.length) {
    input.beats.forEach((beat: any, index: number) => {
      if (typeof beat.start !== 'number' || beat.start < 0 || beat.start > 8) {
        errors.push(`beat ${index}: start must be a number between 0 and 8`);
      }
      if (typeof beat.end !== 'number' || beat.end < 0 || beat.end > 8) {
        errors.push(`beat ${index}: end must be a number between 0 and 8`);
      }
      if (beat.start >= beat.end) {
        errors.push(`beat ${index}: start must be less than end`);
      }
      if (!beat.camera) {
        errors.push(`beat ${index}: camera is required`);
      }
      if (!beat.action) {
        errors.push(`beat ${index}: action is required`);
      }
      if (!beat.dialogue) {
        errors.push(`beat ${index}: dialogue is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
