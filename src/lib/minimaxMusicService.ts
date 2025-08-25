import { MiniMaxMusicRequest, MiniMaxMusicResponse } from "./minimaxMusicTypes";

const MINIMAX_API_BASE = 'https://api.minimax.io/v1';

export class MiniMaxMusicService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMusic(body: MiniMaxMusicRequest): Promise<MiniMaxMusicResponse> {
    const res = await fetch(`${MINIMAX_API_BASE}/music_generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      throw new Error(`MiniMax music error: ${res.status} ${res.statusText} ${text}`);
    }
    return data as MiniMaxMusicResponse;
  }
}


