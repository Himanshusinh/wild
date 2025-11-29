/**
 * Test script to diagnose why cookie exists but user is logged out
 * Run this in browser console when you see the cookie but are logged out
 */

async function testCookieIssue() {
  console.log('🔍 Testing Cookie Issue...\n');
  
  // 1. Check cookie in browser
  console.log('1️⃣ Checking cookies in browser:');
  const cookies = document.cookie.split(';').map(c => c.trim());
  const appSessionCookie = cookies.find(c => c.startsWith('app_session='));
  if (appSessionCookie) {
    const token = appSessionCookie.split('=')[1];
    console.log('✅ Cookie found:', {
      exists: true,
      length: token.length,
      prefix: token.substring(0, 30) + '...',
      // Try to decode JWT payload
      payload: (() => {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
            const json = atob(padded);
            const payload = JSON.parse(json);
            return {
              uid: payload.uid,
              exp: payload.exp,
              expDate: new Date(payload.exp * 1000).toISOString(),
              iat: payload.iat,
              iatDate: new Date(payload.iat * 1000).toISOString(),
              now: new Date().toISOString(),
              isExpired: payload.exp * 1000 < Date.now(),
              expiresIn: Math.floor((payload.exp * 1000 - Date.now()) / 1000) + ' seconds',
              expiresInDays: Math.floor((payload.exp * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) + ' days'
            };
          }
        } catch (e) {
          return { error: e.message };
        }
      })()
    });
  } else {
    console.log('❌ No app_session cookie found');
  }
  
  // 2. Check if cookie is httpOnly (not visible in document.cookie)
  console.log('\n2️⃣ Checking if cookie is httpOnly:');
  console.log('Note: httpOnly cookies are NOT visible in document.cookie');
  console.log('This is normal - the cookie exists but JavaScript cannot read it');
  
  // 3. Test /api/auth/me endpoint
  console.log('\n3️⃣ Testing /api/auth/me endpoint:');
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ /api/auth/me SUCCESS:', {
        hasUser: !!data?.data?.user,
        userId: data?.data?.user?.uid,
        email: data?.data?.user?.email
      });
    } else {
      const errorText = await response.text();
      console.log('❌ /api/auth/me FAILED:', {
        status: response.status,
        error: errorText.substring(0, 200)
      });
    }
  } catch (error) {
    console.error('❌ Error calling /api/auth/me:', error);
  }
  
  // 4. Test backend debug endpoint
  console.log('\n4️⃣ Testing backend debug endpoint:');
  try {
    const response = await fetch('/api/auth/debug-session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug endpoint response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Debug endpoint failed:', {
        status: response.status,
        error: errorText.substring(0, 200)
      });
    }
  } catch (error) {
    console.error('❌ Error calling debug endpoint:', error);
  }
  
  // 5. Check Firebase auth state
  console.log('\n5️⃣ Checking Firebase auth state:');
  try {
    // Try to import Firebase auth
    const { auth } = await import('/src/lib/firebase.ts');
    if (auth?.currentUser) {
      console.log('✅ Firebase user authenticated:', {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email
      });
    } else {
      console.log('❌ Firebase user NOT authenticated (this might be the issue)');
    }
  } catch (error) {
    console.log('⚠️ Could not check Firebase auth (might not be available in console)');
  }
  
  // 6. Check localStorage
  console.log('\n6️⃣ Checking localStorage:');
  const authToken = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  console.log({
    hasAuthToken: !!authToken,
    hasUser: !!user,
    userData: user ? JSON.parse(user) : null
  });
  
  // 7. Recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  console.log('1. If cookie exists but /api/auth/me returns 401:');
  console.log('   - Cookie might be expired (check exp date above)');
  console.log('   - Backend might be rejecting the token');
  console.log('   - Redis cache might be expired');
  console.log('   - Token verification might be failing');
  console.log('');
  console.log('2. If Firebase user is null:');
  console.log('   - Firebase auth state might be lost');
  console.log('   - Try refreshing the page');
  console.log('   - Check if Firebase persistence is working');
  console.log('');
  console.log('3. If cookie is httpOnly (not visible):');
  console.log('   - This is NORMAL and SECURE');
  console.log('   - Cookie exists but JavaScript cannot read it');
  console.log('   - Backend can still read it via Set-Cookie header');
  console.log('');
  console.log('4. To fix:');
  console.log('   - Clear all cookies and localStorage');
  console.log('   - Log in again');
  console.log('   - Check backend logs for token verification errors');
}

// Run the test
testCookieIssue().catch(console.error);

