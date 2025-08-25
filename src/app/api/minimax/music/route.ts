import { NextRequest, NextResponse } from 'next/server';
import { MiniMaxMusicRequest } from '@/lib/minimaxMusicTypes';
import { MiniMaxMusicService } from '@/lib/minimaxMusicService';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'MiniMax API not configured' }, { status: 500 });

    const body: MiniMaxMusicRequest = await request.json();
    // Basic validation
    const prompt = (body.prompt || '').trim();
    const lyrics = (body.lyrics || '').trim();
    if (prompt.length < 10 || prompt.length > 300) {
      return NextResponse.json({ error: 'Invalid input format. Check prompt/lyrics length.' }, { status: 400 });
    }
    if (lyrics.length < 10 || lyrics.length > 600) {
      return NextResponse.json({ error: 'Invalid input format. Check prompt/lyrics length.' }, { status: 400 });
    }

    console.log('🎵 MiniMax music request:', {
      model: body.model,
      promptLen: prompt.length,
      lyricsLen: lyrics.length,
      audio_setting: body.audio_setting,
      output_format: body.output_format || 'hex',
    });

    const service = new MiniMaxMusicService(apiKey);
    const resp = await service.generateMusic(body);
    console.log('🎵 MiniMax music response:', resp.base_resp, 'trace:', resp.trace_id);
    return NextResponse.json(resp);
  } catch (e: any) {
    console.error('❌ Music generation failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to generate music' }, { status: 500 });
  }
}


