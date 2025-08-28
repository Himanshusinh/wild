import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ImageAnalysis = {
  brand_name: string;
  color_scheme: string[];          // hex codes like ["#FF0000", "#00FF00"]
  font_style: string;
  visual_description: string;
};

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json();
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      // If your SDK errors on json_schema, switch to: response_format: { type: "json_object" }
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ImageAnalysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              brand_name: { type: "string" },
              color_scheme: {
                type: "array",
                items: { type: "string", pattern: "^#([0-9A-Fa-f]{6})$" },
                description: "Primary colors in hex, e.g. #FF0000"
              },
              font_style: { type: "string" },
              visual_description: { type: "string" }
            },
            required: ["brand_name", "color_scheme", "font_style", "visual_description"]
          }
        }
      },
      messages: [
        {
          role: "system",
          content:
            "You are an expert brand analyst. Return STRICT JSON only (no extra text)."
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageData } // supports https URL or data:image/...;base64
            },
            {
              type: "text",
              text:
                "Analyze the product image. Extract brand_name (string), color_scheme (array of hex), font_style (string), visual_description (string)."
            }
          ]
        }
      ],
      max_tokens: 600
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as ImageAnalysis;

    // Minimal safety normalization
    parsed.brand_name ||= "Not visible";
    parsed.font_style ||= "Not visible";
    parsed.visual_description ||= "Not visible";
    if (!Array.isArray(parsed.color_scheme) || parsed.color_scheme.length === 0) {
      parsed.color_scheme = ["#000000", "#FFFFFF"];
    }

    return NextResponse.json({ analysis: parsed });
  } catch (err) {
    console.error("analyze-image error:", err);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
