import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ImageAnalysis = {
  brand_name: string;
  color_scheme: string[]; // from the analyzer route
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

// ---------- helpers ----------
function wordCount(s: string) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

function ensureNegatives(neg: string) {
  const base = "extra fingers, warped hands, distorted product, changed or blurred logo, extra brands, text glitches, heavy flicker, over-sharpening, extreme exposure, odd limbs, bad anatomy, duplicate items, oversaturated skin, banding, motion smear, artificial poses, fake smiles, over-produced look, corporate stock photo feel, unnatural product placement";
  if (!neg || neg.length < 10) return base;
  const need = 15;
  const have = neg.split(",").map(t => t.trim()).filter(Boolean);
  if (have.length >= need) return neg;
  const add = base.split(",").map(t => t.trim()).filter(Boolean);
  const merged = Array.from(new Set([...have, ...add])).slice(0, Math.max(need, have.length));
  return merged.join(", ");
}

async function expandText({
  original,
  targetWords,
  label,
  scriptForInclusion,
  language,
}: {
  original: string;
  targetWords: number;
  label: "image_prompt" | "video_prompt";
  scriptForInclusion?: string;
  language: string;
}) {
  const prompt =
    label === "image_prompt"
      ? `Expand the SCENE DESCRIPTION to ~${targetWords} words. Focus on creating an advertising-friendly environment that showcases the product effectively. Be concrete about setting, lighting, props, talent posture, and overall vibe. Emphasize how the scene supports product demonstration and creates desire. Do NOT remove brand/label guidance. Return ONLY the expanded text.

SCENE:
${original}`
      : `Expand the UGC VIDEO PROMPT to ~${targetWords} words and keep the 8-second structure with THREE beats labeled exactly as:
0–2s, 2–6s, 6–8s.

REQUIREMENTS:
- Spoken lines MUST be in ${language} inside straight quotes.
- Weave in the following user script lines/themes VERBATIM where they fit (you may add connecting lines around them but do NOT alter quoted text):
SCRIPT:
${scriptForInclusion || `(no script provided; write natural ${language} lines that highlight product benefits and create desire)`}
- Include explicit camera movement cues in square brackets per beat (e.g., [Handheld], [Zoom in], [Pan left], [Tilt up], [Push in], [Rack focus]).
- Keep label/logo unchanged; do not add overlays over the label.
- Use realistic micro-actions that demonstrate product benefits (open, pour, show texture, light bite, demonstrate features).
- Include subtle ambience/SFX and optional on-screen text that reinforces product value.
- Make it feel like authentic UGC content that builds trust and desire.
- Return ONLY the expanded prompt text (no JSON). 

VIDEO PROMPT:
${original}`;

  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You skillfully rewrite and expand text. Return ONLY the expanded text. No JSON, no commentary." },
      { role: "user", content: prompt },
    ],
    max_tokens: Math.max(1000, Math.ceil(targetWords * 6)),
    temperature: 0.7,
    top_p: 0.95,
    presence_penalty: 0.2,
    frequency_penalty: 0.2,
  });
  return r.choices[0]?.message?.content?.trim() || original;
}
// --------------------------------

export async function POST(req: NextRequest) {
  try {
    const t0 = Date.now();
    const {
      imageAnalysis,
      script,
      specialRequests,
      language,
    }: {
      imageAnalysis: ImageAnalysis;
      script?: string;
      specialRequests?: string;
      language?: string;
    } = await req.json();

    console.log("[generate-prompts] request received", {
      hasImageAnalysis: !!imageAnalysis,
      hasScript: !!script,
      language: language || 'English',
      specialRequests,
    });

    if (!imageAnalysis) {
      return NextResponse.json({ error: "Image analysis is required" }, { status: 400 });
    }

    // Fixed AR for current i2v flow
    const ar: "16:9" = "16:9";
    const spokenLanguage = (language || 'English').trim();

    // ----- Primary generation (explicit long form + camera moves + script use) -----
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
            "You are a senior UGC ad director specializing in product advertising videos. Return STRICT JSON only.",
            "",
            "LENGTH TARGETS (MANDATORY):",
            "- image_prompt: 40–70 words (concise scene setup).",
            "- video_prompt: 90–140 words with THREE beats labeled exactly as 0–2s, 2–6s, 6–8s.",
            "- negative_prompt: 10–20 tokens, comma-separated artifacts.",
            "",
            "PRODUCT ADVERTISING RULES:",
            "- Analyze if product is handheld/portable vs stationary/large. For handheld: show person holding and using it naturally. For stationary: show person interacting with it.",
            "- Person should be 21–25 years old, relatable, and demonstrate the product's key benefits through natural actions.",
            "- Keep brand logo/label completely intact and visible throughout the video.",
            "- Create authentic UGC-style scenes that feel like real user testimonials.",
            "",
            "CAMERA & SCRIPT RULES:",
            "- Include camera movement cues IN SQUARE BRACKETS per beat (e.g., [Handheld], [Zoom in], [Pan left], [Tilt up], [Push in], [Rack focus]).",
            `- Spoken lines MUST be in ${spokenLanguage} inside straight quotes.`,
            "- If user script is provided, weave it in VERBATIM inside quotes; you may add brief connective lines but do NOT alter quoted script.",
            "- If no script provided, create natural, conversational lines that highlight product benefits.",
            "",
            "CONTENT & STYLE:",
            "- Use realistic micro-actions (open cap, gentle pour, tap to show texture, light bite, demonstrate features).",
            "- Include subtle ambience/SFX and optional on-screen text for key benefits.",
            "- Background should be simple, clean, and complement the product without distraction.",
            "- Lighting should be natural and flattering to both person and product.",
            "- Avoid: extra fingers, warped hands, distorted product, changed/blurred logo, extra brands, text glitches, heavy flicker.",
            "",
            "FAL API OPTIMIZATION:",
            "- Prompts should be clear and specific for image-to-video generation.",
            "- Focus on smooth, natural motion that can be realistically animated.",
            "- If any section is shorter than target, EXPAND until targets are met BEFORE returning JSON."
          ].join("\n")
        },
        {
          role: "user",
          content: `
Create ONE highly descriptive UGC advertising scene (image + video prompts) for an 8-second product ad optimized for FAL API image-to-video generation.

Product Analysis:
- Brand: ${imageAnalysis.brand_name || "Unknown"}
- Colors: ${(imageAnalysis.color_scheme || []).join(", ") || "Various"}
- Visual Style: ${imageAnalysis.visual_description || "Product image"}
- Font Style: ${imageAnalysis.font_style || "Not visible"}

User Script (2–3 short lines; use verbatim inside quotes where it fits naturally):
${script || `(no script provided; craft natural ${spokenLanguage} lines that highlight product benefits and create desire)`}

Special Requests: ${specialRequests || "authentic, believable, simple background, natural product demonstration"}

Aspect Ratio: ${ar}

ADVERTISING FOCUS:
- Create a compelling product demonstration that shows real value
- Ensure the person naturally showcases the product's key features
- Make it feel like authentic user-generated content
- Optimize for smooth motion that can be animated by AI

REMEMBER LENGTH TARGETS:
- image_prompt: 40–70 words.
- video_prompt: 90–140 words with beats labeled 0–2s, 2–6s, 6–8s.
- negative_prompt: 10–20 tokens.

Return STRICT JSON only that matches the provided schema.`
        }
      ],
      max_tokens: 2200,
      temperature: 0.75,
      top_p: 0.95,
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let parsed = JSON.parse(content) as PromptsOut;

    // ---- Normalization / safety ----
    if (!["16:9", "9:16", "1:1"].includes(parsed.aspect_ratio)) {
      parsed.aspect_ratio = ar;
    }
    parsed.parameters.duration_seconds ||= 8;
    parsed.parameters.resolution ||= "720p";
    parsed.parameters.sample_count ||= 1;
    parsed.negative_prompt = ensureNegatives(parsed.negative_prompt);

    // ---- Auto-expansion safeguard (2nd pass) ----
    const imgWC = wordCount(parsed.image_prompt);
    const vidWC = wordCount(parsed.video_prompt);

    if (imgWC < 40) {
      parsed.image_prompt = await expandText({
        original: parsed.image_prompt,
        targetWords: 55,
        label: "image_prompt",
        language: spokenLanguage,
      });
    }
    if (vidWC < 90) {
      parsed.video_prompt = await expandText({
        original: parsed.video_prompt,
        targetWords: 120,
        label: "video_prompt",
        scriptForInclusion: script,
        language: spokenLanguage,
      });
    }

    // one more negative safety
    parsed.negative_prompt = ensureNegatives(parsed.negative_prompt);

    const ms = Date.now() - t0;
    console.log("[generate-prompts] success in", ms + "ms", {
      imgWords: wordCount(parsed.image_prompt),
      vidWords: wordCount(parsed.video_prompt),
    });

    return NextResponse.json({ prompts: parsed });
  } catch (err) {
    console.error("[generate-prompts] error:", err);

    // Descriptive fallback that uses camera cues and respects 8s beats
    const userScript = ""; // we don't have it here; if needed you can thread `script` into the fallback
    const fallback: PromptsOut = {
      image_prompt:
        "Modern home setting with soft, natural lighting: a 23–25 year old person in casual, relatable clothing stands confidently by a clean counter or table, holding the product naturally with the brand label clearly visible and unchanged. The background features simple, clean elements—a neutral wall, small decorative plant, and minimal props that complement the product without distraction. The color palette subtly echoes brand hues while maintaining realistic skin tones and natural surfaces. The person's posture is relaxed yet engaging, with natural hand gestures that suggest authentic product interaction. Overall scene feels warm, trustworthy, and perfect for UGC-style product demonstration.",
      video_prompt:
        `0–2s [Handheld][Zoom in] The presenter picks up the product, ensuring the brand label faces the camera clearly, and begins with a warm, genuine smile. Soft ambient room sounds with subtle background music. Dialogue: "I've been using this product for the past week, and honestly, the difference is amazing." 
2–6s [Pan left][Push in] Natural product demonstration with smooth micro-actions—showing key features, gentle handling, and realistic usage that highlights benefits. The person demonstrates the product's value through authentic gestures and expressions. Dialogue: "It's so easy to use, and the results speak for themselves. You can really feel the quality." On-screen text: "Real Results, Real Fast." 
6–8s [Tilt up][Rack focus] Presenter holds the product near their face (label remains completely visible), gives a confident nod and friendly smile. Dialogue: "If you're looking for something that actually works, this is definitely worth trying."`,
      aspect_ratio: "16:9",
      negative_prompt:
        "extra fingers, warped hands, distorted product, changed or blurred logo, extra brands, text glitches, heavy flicker, over-sharpening, extreme exposure, odd limbs, bad anatomy, duplicate items, oversaturated skin, banding, motion smear, artificial poses, fake smiles, over-produced look, corporate stock photo feel, unnatural product placement",
      parameters: { duration_seconds: 8, resolution: "1080p", sample_count: 2 }
    };

    console.log("[generate-prompts] returning LONG fallback prompts with camera cues");
    return NextResponse.json({ prompts: fallback }, { status: 200 });
  }
}
