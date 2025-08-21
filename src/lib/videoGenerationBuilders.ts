import { ImageToVideoState, VideoToVideoState } from '../types/videoGeneration';

export function buildImageToVideoBody(s: ImageToVideoState) {
  if (!s.model) throw new Error("model is required");
  if (!s.ratio) throw new Error("ratio is required");
  if (!s.promptImage) throw new Error("promptImage is required");

  const body: any = {
    promptImage: s.promptImage,
    model: s.model,
    ratio: s.ratio,
    duration: s.duration ?? 10,
  };
  
  if (s.promptText) body.promptText = s.promptText;
  if (s.seed !== undefined) body.seed = s.seed;
  if (s.contentModeration?.publicFigureThreshold) {
    body.contentModeration = { publicFigureThreshold: s.contentModeration.publicFigureThreshold };
  }

  // Guard: "last" only for gen3a_turbo
  if (Array.isArray(s.promptImage)) {
    const hasLast = s.promptImage.some(p => p.position === "last");
    if (hasLast && s.model !== "gen3a_turbo") {
      throw new Error('"position":"last" is only supported by gen3a_turbo');
    }
  }
  
  return body;
}

export function buildVideoToVideoBody(s: VideoToVideoState) {
  if (s.model !== "gen4_aleph") throw new Error("video_to_video requires model=gen4_aleph");
  if (!s.videoUri) throw new Error("videoUri is required");
  if (!s.promptText) throw new Error("promptText is required");

  const body: any = {
    videoUri: s.videoUri,
    promptText: s.promptText,
    model: "gen4_aleph",
    ratio: s.ratio,
  };
  
  if (s.seed !== undefined) body.seed = s.seed;
  if (s.references?.length) body.references = s.references.map(r => ({ type: "image", uri: r.uri }));
  if (s.contentModeration?.publicFigureThreshold) {
    body.contentModeration = { publicFigureThreshold: s.contentModeration.publicFigureThreshold };
  }
  
  return body;
}

// Helper function to get available ratios for a model
export function getAvailableRatios(model: string): string[] {
  switch (model) {
    case "gen4_turbo":
      return ["1280:720", "720:1280", "1104:832", "832:1104", "960:960", "1584:672"];
    case "gen3a_turbo":
      return ["1280:768", "768:1280"];
    case "gen4_aleph":
      return ["1280:720", "720:1280", "1104:832", "832:1104", "960:960", "1584:672"];
    default:
      return [];
  }
}

// Helper function to check if a ratio is valid for a model
export function isRatioValidForModel(ratio: string, model: string): boolean {
  return getAvailableRatios(model).includes(ratio);
}

// Helper function to get default ratio for a model
export function getDefaultRatioForModel(model: string): string {
  const ratios = getAvailableRatios(model);
  return ratios.length > 0 ? ratios[0] : "1280:720";
}
