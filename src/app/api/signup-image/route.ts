import { NextRequest, NextResponse } from 'next/server';

// No caching - fetch fresh image on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0; // No revalidation, always fetch fresh

async function fetchFromBackend(): Promise<any> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 
                  process.env.API_BASE_URL || 
                  '';
  // No cache-busting needed - backend now uses a pool system for instant responses
  const apiUrl = `${apiBase.replace(/\/$/, '')}/api/feed/random/high-scored`;
  
  console.log('[signup-image] Fetching from backend:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[signup-image] Backend error:', response.status, errorText);
      throw new Error(`Backend error ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('[signup-image] ✅ Backend response received');
    return data;
  } catch (fetchError: any) {
    console.error('[signup-image] ❌ Fetch error:', fetchError?.message);
    throw fetchError;
  }
}

export async function GET(request: NextRequest) {
  console.log('[signup-image] ========== GET REQUEST RECEIVED ==========');
  
  try {
    // Always fetch fresh image from backend (no caching)
    console.log('[signup-image] Fetching fresh image from backend...');
    
    const data = await fetchFromBackend();
    
    // Validate response
    if (data?.responseStatus === 'success' && data?.data) {
      console.log('[signup-image] ✅ Fresh image fetched successfully');
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache': 'MISS',
        },
      });
    }
    
    console.error('[signup-image] Invalid response structure:', data);
    throw new Error('Invalid response from backend');
  } catch (error: any) {
    // Return error with actual message
    const errorMessage = error?.message || 'Failed to fetch random image';
    console.error('[signup-image] ========== ERROR ==========');
    console.error('[signup-image] Error:', errorMessage);
    console.error('[signup-image] Stack:', error?.stack?.substring(0, 300));
    
    return NextResponse.json(
      {
        responseStatus: 'error',
        message: errorMessage,
        data: null,
      },
      { status: 500 }
    );
  }
}
