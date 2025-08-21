export type GenMode = "image_to_video" | "video_to_video";
export type PublicFigureThreshold = "auto" | "low";

export type Gen4TurboRatio = "1280:720" | "720:1280" | "1104:832" | "832:1104" | "960:960" | "1584:672";
export type Gen3aTurboRatio = "1280:768" | "768:1280";
export type Gen4AlephRatio = "1280:720" | "720:1280" | "1104:832" | "832:1104" | "960:960" | "1584:672";

export type ImageToVideoModel = "gen4_turbo" | "gen3a_turbo";
export type VideoToVideoModel = "gen4_aleph";

export type PromptImagePosition = "first" | "last"; // "last" only valid for gen3a_turbo

export interface ModerationSettings {
  publicFigureThreshold?: PublicFigureThreshold;
}

export interface PromptImageObject {
  uri: string;
  position: PromptImagePosition;
}

export interface ReferenceImage {
  type: "image";
  uri: string;
}

export interface ImageToVideoState {
  model: ImageToVideoModel;
  ratio: Gen4TurboRatio | Gen3aTurboRatio;
  promptText?: string;
  seed?: number;
  duration?: 5 | 10; // default 10
  promptImage: string | PromptImageObject[];
  contentModeration?: ModerationSettings;
}

export interface VideoToVideoState {
  model: VideoToVideoModel; // must be "gen4_aleph"
  ratio: Gen4AlephRatio;
  promptText: string;
  seed?: number;
  videoUri: string;
  references?: ReferenceImage[];
  contentModeration?: ModerationSettings;
}

export interface VideoGenerationState {
  mode: GenMode;
  imageToVideo: ImageToVideoState;
  videoToVideo: VideoToVideoState;
}

// Default states
export const defaultImageToVideoState: ImageToVideoState = {
  model: "gen4_turbo",
  ratio: "1280:720",
  promptText: "",
  duration: 10,
  promptImage: "",
  contentModeration: {
    publicFigureThreshold: "auto"
  }
};

export const defaultVideoToVideoState: VideoToVideoState = {
  model: "gen4_aleph",
  ratio: "1280:720",
  promptText: "",
  videoUri: "",
  references: [],
  contentModeration: {
    publicFigureThreshold: "auto"
  }
};

export const defaultVideoGenerationState: VideoGenerationState = {
  mode: "image_to_video",
  imageToVideo: defaultImageToVideoState,
  videoToVideo: defaultVideoToVideoState
};
