import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check session status
 * Helps verify session persistence without waiting for logout
 */
export async function GET(req: NextRequest) {
  try {
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
    
    // Forward the request to backend with all cookies
    const cookies = req.cookies.getAll();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const response = await fetch(`${apiBase}/api/auth/debug-session`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    // Forward all headers including Set-Cookie
    const headers = new Headers();
    response.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    return NextResponse.json(data, { 
      status: response.status,
      headers 
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed', 
        message: error?.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

