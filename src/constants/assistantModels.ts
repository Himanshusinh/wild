export type AssistantMode = "agent" | "chat";

export const AGENT_DEFAULT_MODEL_ID = "openai/gpt-5-nano";

export const CHAT_MODELS = [
  { id: "google/gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6" },
  { id: "openai/gpt-5.2", label: "GPT-5.2" },
  { id: "deepseek-ai/deepseek-v3.1", label: "DeepSeek V3.1" },
] as const;

export type ChatModeModelId = (typeof CHAT_MODELS)[number]["id"];

export const GEMINI_MODEL_ID: ChatModeModelId = "google/gemini-3.1-pro";
export const GEMINI25_FLASH_MODEL_ID: ChatModeModelId =
  "google/gemini-2.5-flash";
export const CLAUDE_MODEL_ID: ChatModeModelId = "anthropic/claude-opus-4.6";
export const GPT52_MODEL_ID: ChatModeModelId = "openai/gpt-5.2";
export const DEEPSEEK_MODEL_ID: ChatModeModelId = "deepseek-ai/deepseek-v3.1";

export const GEMINI_ATTACHMENT_LIMITS = {
  image: {
    maxCount: 10,
    maxBytes: 7 * 1024 * 1024,
    accept: "image/jpeg,image/png,image/webp,image/gif",
    helper: "Up to 10 images, 7MB each.",
  },
  video: {
    maxCount: 10,
    maxBytes: 500 * 1024 * 1024,
    accept: "video/mp4,video/quicktime,video/webm",
    helper: "Up to 10 videos. Clips longer than 45 minutes are not supported.",
  },
  audio: {
    maxCount: 1,
    maxBytes: 500 * 1024 * 1024,
    accept:
      "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/x-m4a,audio/webm",
    helper: "1 audio file. Audio longer than 8.4 hours is not supported.",
  },
} as const;

export const CLAUDE_ATTACHMENT_LIMITS = {
  image: {
    maxCount: 2,
    maxBytes: 5 * 1024 * 1024,
    accept: "image/jpeg,image/png,image/gif,image/webp",
    helper: "Up to 2 images, 5MB each.",
  },
  video: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Videos not supported.",
  },
  audio: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Audio not supported.",
  },
} as const;

export const GEMINI25_FLASH_ATTACHMENT_LIMITS = {
  image: {
    maxCount: 10,
    maxBytes: 7 * 1024 * 1024,
    accept: "image/jpeg,image/png,image/webp,image/gif",
    helper: "Up to 10 images, 7MB each.",
  },
  video: {
    maxCount: 10,
    maxBytes: 500 * 1024 * 1024,
    accept: "video/mp4,video/quicktime,video/webm",
    helper: "Up to 10 videos. Clips longer than 45 minutes are not supported.",
  },
  audio: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Audio not supported.",
  },
} as const;

export const GPT52_ATTACHMENT_LIMITS = {
  image: {
    maxCount: 4,
    maxBytes: 5 * 1024 * 1024,
    accept: "image/jpeg,image/png,image/gif,image/webp",
    helper: "Up to 4 images, 5MB each.",
  },
  video: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Videos not supported.",
  },
  audio: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Audio not supported.",
  },
} as const;

export const DEEPSEEK_ATTACHMENT_LIMITS = {
  image: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Images not supported.",
  },
  video: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Videos not supported.",
  },
  audio: {
    maxCount: 0,
    maxBytes: 0,
    accept: "",
    helper: "Audio not supported.",
  },
} as const;

export const GEMINI_DEFAULT_INPUT = {
  audio: null as string | null,
  images: [] as string[],
  videos: [] as string[],
  temperature: 1,
  top_p: 0.95,
  thinking_level: "high" as const,
  max_output_tokens: 65535,
  system_instruction: null as string | null,
};

export const CLAUDE_DEFAULT_INPUT = {
  image: null as string | null,
  images: [] as string[],
  max_tokens: 8192,
  system_prompt: null as string | null,
  max_image_resolution: 0.5,
};

export const GEMINI25_FLASH_DEFAULT_INPUT = {
  images: [] as string[],
  videos: [] as string[],
  temperature: 1,
  top_p: 0.95,
  max_output_tokens: 65535,
  thinking_budget: null as number | null,
  dynamic_thinking: false,
  system_instruction: null as string | null,
};

export const GPT52_DEFAULT_INPUT = {
  image_input: [] as string[],
  verbosity: "medium" as "low" | "medium" | "high",
  reasoning_effort: "low" as "none" | "low" | "medium" | "high" | "xhigh",
  max_completion_tokens: null as number | null,
  system_prompt: null as string | null,
};

export const DEEPSEEK_DEFAULT_INPUT = {
  thinking: "None" as "None" | "medium",
  prompt: "" as string,
  max_tokens: 1024,
  temperature: 0.1,
  top_p: 1,
  presence_penalty: 0,
  frequency_penalty: 0,
};

export function getChatModelLabel(modelId: string): string {
  return (
    CHAT_MODELS.find((model) => model.id === modelId)?.label || "Assistant"
  );
}
