export type MusicModel = "music-1.5";
export type SampleRate = 16000 | 24000 | 32000 | 44100;
export type Bitrate = 32000 | 64000 | 128000 | 256000;
export type AudioFormat = "mp3" | "wav" | "pcm";
export type OutputFormat = "hex" | "url";

export interface AudioSetting {
  sample_rate: SampleRate;
  bitrate: Bitrate;
  format: AudioFormat;
}

export interface MiniMaxMusicRequest {
  model: MusicModel;
  prompt: string;
  lyrics: string;
  audio_setting: AudioSetting;
  output_format?: OutputFormat;
}

export interface MiniMaxMusicResponse {
  data?: { audio?: string; status?: 1 | 2 };
  trace_id?: string;
  base_resp: { status_code: number; status_msg: string };
}


