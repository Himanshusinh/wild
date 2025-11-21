/**
 * Frontend helper for calling the server prompt-enhancer/enhance endpoint.
 * Can be imported from client components or server helpers.
 */
export async function enhancePromptAPI(
  prompt: string, 
  model?: string,
  mediaType?: 'image' | 'video' | 'music'
): Promise<{ ok: boolean; enhancedPrompt?: string; error?: string } > {
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt is required');
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '');
  const url = `${base}/api/prompt-enhancer/enhance`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompt, 
      media_type: mediaType || 'image', // Default to image for backward compatibility
    }),
  });

  if (!res.ok) {
    let body: any;
    try { body = await res.json(); } catch { body = { error: res.statusText }; }
    return { ok: false, error: body?.message || body?.error || `http ${res.status}` };
  }

  const data = await res.json();
  // Backend returns: { responseStatus: "success", message: "...", data: { enhancedPrompt: "..." } }
  const enhancedPrompt = data?.data?.enhancedPrompt || data?.enhancedPrompt;
  if (!enhancedPrompt) {
    return { ok: false, error: data?.message || 'No enhanced prompt in response' };
  }
  return { ok: true, enhancedPrompt };
}

export default { enhancePromptAPI };
