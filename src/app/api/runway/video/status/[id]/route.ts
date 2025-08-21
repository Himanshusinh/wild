import { NextRequest, NextResponse } from 'next/server';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const RUNWAY_BASE_URL = 'https://api.dev.runwayml.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!RUNWAY_API_KEY) {
      return NextResponse.json({ error: 'Runway API key not configured' }, { status: 500 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log('=== RUNWAY VIDEO STATUS REQUEST ===');
    console.log('Task ID:', id);

    const response = await fetch(`${RUNWAY_BASE_URL}/v1/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Runway API error:', responseData);
      return NextResponse.json({ 
        error: 'Runway API error', 
        details: responseData 
      }, { status: response.status });
    }

    console.log('=== RUNWAY VIDEO STATUS RESPONSE ===');
    console.log('Response:', responseData);

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Video status check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
