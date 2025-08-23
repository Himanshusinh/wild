// MiniMax Video Generation API Types

export interface MiniMaxVideoGenerationRequest {
  model: string;
  prompt?: string;
  prompt_optimizer?: boolean;
  fast_pretreatment?: boolean;
  duration?: number;
  resolution?: string;
  first_frame_image?: string; // base64 or URL
  subject_reference?: MiniMaxSubjectReference[];
  callback_url?: string;
}

export interface MiniMaxSubjectReference {
  type: string; // "character"
  image: string[]; // base64 or URL array
}

export interface MiniMaxVideoGenerationResponse {
  task_id: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

export interface MiniMaxVideoStatusResponse {
  task_id: string;
  status: 'Queueing' | 'Preparing' | 'Processing' | 'Success' | 'Fail';
  file_id?: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

export interface MiniMaxFileRetrieveResponse {
  file: {
    file_id: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    download_url: string;
    backup_download_url: string;
  };
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

// MiniMax Models
export const MINIMAX_MODELS = {
  'MiniMax-Hailuo-02': {
    name: 'MiniMax-Hailuo-02',
    description: 'Text→Video / Image→Video model, supports 512P/768P/1080P, 6s/10s duration',
    supportedDurations: [6, 10],
    supportedResolutions: ['512P', '768P', '1080P'],
    requiresFirstFrame: false, // optional for 768P/1080P, required for 512P
    requiresSubjectReference: false,
    type: 'text-to-video' // Supports both text→video and image→video
  },
  'T2V-01-Director': {
    name: 'T2V-01-Director',
    description: 'Text→Video only, enhanced precision shot control, 720P, 6s duration',
    supportedDurations: [6],
    supportedResolutions: ['720P'],
    requiresFirstFrame: false,
    requiresSubjectReference: false,
    type: 'text-to-video'
  },
  'I2V-01-Director': {
    name: 'I2V-01-Director',
    description: 'Image→Video only, enhanced precision shot control, 720P, 6s duration',
    supportedDurations: [6],
    supportedResolutions: ['720P'],
    requiresFirstFrame: true,
    requiresSubjectReference: false,
    type: 'image-to-video'
  },
  'S2V-01': {
    name: 'S2V-01',
    description: 'Subject→Video model, requires character reference image, 720P, 6s duration',
    supportedDurations: [6],
    supportedResolutions: ['720P'],
    requiresFirstFrame: false,
    requiresSubjectReference: true,
    type: 'subject-reference'
  }
} as const;

export type MiniMaxModelType = keyof typeof MINIMAX_MODELS;

// Model type mapping for generation modes
export const MODEL_TYPE_MAPPING = {
  'text-to-video': ['MiniMax-Hailuo-02', 'T2V-01-Director'],
  'image-to-video': ['MiniMax-Hailuo-02', 'I2V-01-Director', 'S2V-01'],
  'video-to-video': [] // MiniMax doesn't support video→video
} as const;

// Camera Movement Instructions
export const CAMERA_MOVEMENTS = [
  'Truck left', 'Truck right',
  'Pan left', 'Pan right',
  'Push in', 'Pull out',
  'Pedestal up', 'Pedestal down',
  'Tilt up', 'Tilt down',
  'Zoom in', 'Zoom out',
  'Shake', 'Tracking shot', 'Static shot'
] as const;

export type CameraMovement = typeof CAMERA_MOVEMENTS[number];
