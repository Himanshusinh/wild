export type BackendPromptV1 = {
  mode: "auto" | "manual";
  media: { image_url: string };
  delivery: {
    engine: "veo3" | "veo3_fast";
    resolution: "720p" | "1080p";
    duration: "8s";
    generate_audio: boolean;
  };
  brand?: {
    name?: string;
    color_palette?: string[]; // hex
    tone?: string;
  };
  style?: {
    background?: string;
    lighting?: string;
    camera_style?: string;
    framing?: string;
    motion_intensity?: "low" | "medium" | "high";
  };
  talent?: {
    age_range?: string;
    presentation?: string;
    speaking_style?: string;
    gestures?: string;
  };
  script?: {
    hook?: string; // "…"
    body?: string; // natural dialogue
    cta?: string;  // "…"
  };
  beats?: Array<{
    start: number;
    end: number;
    camera: string;     // Zoom in, Tilt up, …
    action: string;     // holding, demo, …
    dialogue: string;   // "spoken line"
    sfx?: string;
    ambience?: string;
    on_screen_text?: string;
  }>;
  constraints?: {
    avoid?: string[];
    legal?: string;
  };
  notes?: string;
};

export type FalI2VRequest = {
  prompt: string;
  image_url: string;
  duration: "8s";
  generate_audio: boolean;
  resolution: "720p" | "1080p";
};

// Compiler function type
export type PromptCompiler = (input: BackendPromptV1) => FalI2VRequest;
