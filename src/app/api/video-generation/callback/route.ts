import { NextRequest, NextResponse } from 'next/server';

// Handles MiniMax callback validation and status notifications
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const challenge = json?.challenge as string | undefined;
    if (challenge) {
      return NextResponse.json({ challenge });
    }

    // TODO: Add your own business logic here (e.g., persist status updates)
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Callback handling error' },
      { status: 500 }
    );
  }
}


