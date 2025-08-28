import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ImageAnalysis = {
  brand_name: string;
  color_scheme: string[];     // from the analyzer route
  font_style: string;
  visual_description: string;
};

type PromptsOut = {
  image_prompt: string;
  video_prompt: string;       // include dialogue in straight quotes for audio-friendly TTV/ITV engines
  aspect_ratio: "16:9" | "9:16" | "1:1";
  negative_prompt: string;
  parameters: {
    duration_seconds: number; // keep 8 for short ads
    resolution: "720p" | "1080p";
    sample_count: number;     // for A/B
    seed?: number;
  };
};

export async function POST(req: NextRequest) {
  try {
    const {
      imageAnalysis,
      script,
      aspectRatio,
      specialRequests,
      platform
    }: {
      imageAnalysis: ImageAnalysis;
      script?: string;
      aspectRatio?: string;
      specialRequests?: string;
      platform?: string;
    } = await req.json();

    if (!imageAnalysis) {
      return NextResponse.json({ error: "Image analysis is required" }, { status: 400 });
    }

    // Normalize AR to our enum
    const ar = ["16:9", "9:16", "1:1"].includes(aspectRatio || "")
      ? (aspectRatio as "16:9" | "9:16" | "1:1")
      : "16:9";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      // If your SDK errors on json_schema, switch to: response_format: { type: "json_object" }
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "UGCPrompts",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              image_prompt: { type: "string" },
              video_prompt: { type: "string" },
              aspect_ratio: { type: "string", enum: ["16:9", "9:16", "1:1"] },
              negative_prompt: { type: "string" },
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  duration_seconds: { type: "integer", enum: [8] },
                  resolution: { type: "string", enum: ["720p", "1080p"] },
                  sample_count: { type: "integer", minimum: 1, maximum: 4 },
                  seed: { type: "integer", minimum: 0, maximum: 4294967295 }
                },
                required: ["duration_seconds", "resolution", "sample_count"]
              }
            },
            required: [
              "image_prompt",
              "video_prompt",
              "aspect_ratio",
              "negative_prompt",
              "parameters"
            ]
          }
        }
      },
      messages: [
        {
          role: "system",
          content: [
            "You are a UGC AI director for short product ads.",
            "Return STRICT JSON only (no commentary).",
            "Rules:",
            "- Person is 21–25 and naturally holding the actual product (no logo changes).",
            "- Tone is authentic social content, lightly handheld feel.",
            "- Dialogue MUST use straight quotes for spoken lines.",
            "- Use subtle camera cues like [Zoom in], [Tilt up], [Pan left] inline.",
            "- Keep it concise for an ~8 second ad.",
            "- Avoid odd hands, extra fingers, warped logos, extra brands, text glitches."
          ].join("\n")
        },
        {
          role: "user",
          content: `
Create a single compelling UGC scene (image + video prompts) for a product ad.

Product Analysis:
- Brand: ${imageAnalysis.brand_name || "Unknown"}
- Colors: ${(imageAnalysis.color_scheme || []).join(", ") || "Various"}
- Visual Style: ${imageAnalysis.visual_description || "Product image"}
- Font Style: ${imageAnalysis.font_style || "Not visible"}

User Script Themes: ${script || "benefits + personal experience + CTA"}
Special Requests: ${specialRequests || "casual, believable, simple background"}
Target Platform: ${platform || "generic"}
Aspect Ratio: ${ar}

Output constraints:
- aspect_ratio must be one of "16:9", "9:16", or "1:1".
- Provide a strong negative_prompt to avoid artifacts.
- parameters: duration_seconds = 8, resolution = "1080p" for final, sample_count = 2 or 3.`
        }
      ],
      max_tokens: 900
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as PromptsOut;

    // Final minimal normalization/safety
    if (!["16:9", "9:16", "1:1"].includes(parsed.aspect_ratio)) {
      parsed.aspect_ratio = ar;
    }
    parsed.parameters.duration_seconds ||= 8;
    parsed.parameters.resolution ||= "1080p";
    parsed.parameters.sample_count ||= 2;
    parsed.negative_prompt ||= "warped hands, extra fingers, distorted product, changed logo, extra brands, text artifacts, flicker, low quality";

    return NextResponse.json({ prompts: parsed });
  } catch (err) {
    console.error("generate-prompts error:", err);

    // Safe fallback so your client keeps working
    const fallback: PromptsOut = {
      image_prompt:
        "A 23-year-old person in casual clothes, natural lighting, simple background, holding the product close to camera with a friendly expression",
      video_prompt:
        '[Zoom in] "Real talk… this made my routine easier." [Pan left] "Quality is solid and it actually does what it says." [Tilt up] "If you’ve been on the fence, try it and thank me later."',
      aspect_ratio: "16:9",
      negative_prompt:
        "warped hands, extra fingers, distorted product, changed logo, extra brands, text artifacts, flicker, low quality",
      parameters: { duration_seconds: 8, resolution: "1080p", sample_count: 2 }
    };

    return NextResponse.json({ prompts: fallback }, { status: 200 });
  }
}
