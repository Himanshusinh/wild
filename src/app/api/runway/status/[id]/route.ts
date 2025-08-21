import { NextRequest, NextResponse } from 'next/server';

const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== RUNWAY STATUS CHECK STARTED ===');
    const { id } = await params;
    console.log('Checking status for task ID:', id);

    if (!id) {
      console.error('Task ID is required');
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.RUNWAY_API_KEY;
    console.log('Runway API key configured:', !!apiKey);
    if (!apiKey) {
      console.error('Runway API key not configured');
      return NextResponse.json(
        { error: 'Runway API key not configured' },
        { status: 500 }
      );
    }

    // Make request to Runway API to get task status
    console.log('Making request to Runway API for task status...');
    const response = await fetch(`${RUNWAY_API_BASE}/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': RUNWAY_VERSION,
      },
    });

    console.log('Runway status API response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.error('Task not found or was deleted/canceled');
        return NextResponse.json(
          { error: 'Task not found or was deleted/canceled' },
          { status: 404 }
        );
      }
      
      const errorData = await response.json().catch(() => ({}));
      console.error('Runway status API request failed:', errorData);
      return NextResponse.json(
        { 
          error: 'Runway API request failed', 
          details: errorData,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Runway task status data:', data);
    console.log('=== RUNWAY STATUS CHECK COMPLETED ===');
    return NextResponse.json(data);

  } catch (error) {
    console.error('=== RUNWAY STATUS CHECK ERROR ===');
    console.error('Runway status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
