// Local frontend SDK usage removed.
// This file used to call the Google GenAI SDK from the Next frontend; that is no longer necessary
// because prompt enhancement is handled by the external API gateway. Keep a tiny shim so any
// accidental imports will receive a clear error at runtime.

export async function enhancePrompt(_prompt: string, _opts?: { model?: string }) {
  throw new Error('Local Gemini SDK usage has been removed. Call the backend API gateway instead.');
}

export default { enhancePrompt };
