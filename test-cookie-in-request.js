/**
 * Test script to check if cookie is being sent with requests
 * Run this in browser console on studio.wildmindai.com
 */

async function testCookieInRequest() {
  console.log('🔍 Testing if Cookie is in Request Headers...\n');
  console.log('═══════════════════════════════════════════════════════');
  
  // 1. Check Network Tab Instructions
  console.log('\n1️⃣ NETWORK TAB CHECK (Most Reliable):');
  console.log('📋 Manual Steps:');
  console.log('   1. Open DevTools → Network tab');
  console.log('   2. Check "Preserve log" checkbox');
  console.log('   3. Reload the page (or make an API call)');
  console.log('   4. Find the /api/auth/me request');
  console.log('   5. Click on it → Headers tab');
  console.log('   6. Scroll to "Request Headers"');
  console.log('   7. Look for "Cookie" header');
  console.log('');
  console.log('   ✅ GOOD: Cookie: app_session=eyJhbGciOiJ...');
  console.log('   ❌ BAD: Cookie: _ga=GA1.1... (no app_session)');
  
  // 2. Test API call and check response
  console.log('\n2️⃣ TESTING API CALL:');
  try {
    const apiUrl = 'https://api-gateway-services-wildmind.onrender.com/api/auth/me';
    console.log('Making request to:', apiUrl);
    console.log('With credentials: include (should send cookies)');
    
    // Note: We can't see the Cookie header in fetch, but we can check the response
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ 401 Unauthorized');
      console.log('\n🔴 DIAGNOSIS:');
      console.log('The cookie is NOT being sent with the request.');
      console.log('This means:');
      console.log('  1. Cookie exists on www.wildmindai.com');
      console.log('  2. But cookie does NOT have Domain: .wildmindai.com');
      console.log('  3. So it\'s not available on studio.wildmindai.com');
      console.log('\n📋 SOLUTION:');
      console.log('  1. Set COOKIE_DOMAIN=.wildmindai.com in Render.com');
      console.log('  2. Restart backend service');
      console.log('  3. Log in again on www.wildmindai.com');
      console.log('  4. Check cookie has Domain: .wildmindai.com');
      console.log('  5. Try studio.wildmindai.com again');
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ API CALL SUCCESS:', {
        hasUser: !!data?.data?.user,
        userId: data?.data?.user?.uid
      });
      console.log('Cookie IS being sent and accepted!');
    }
  } catch (error) {
    console.error('❌ API CALL ERROR:', error);
  }
  
  // 3. Check backend cookie config
  console.log('\n3️⃣ CHECKING BACKEND COOKIE CONFIG:');
  try {
    const configUrl = 'https://api-gateway-services-wildmind.onrender.com/api/auth/debug/cookie-config';
    const configResponse = await fetch(configUrl, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('Backend cookie config:', JSON.stringify(configData, null, 2));
      
      if (configData.cookieDomain === '(NOT SET)') {
        console.log('\n🔴 CRITICAL: COOKIE_DOMAIN is NOT SET!');
        console.log('This is why cookies are not sharing across subdomains.');
      } else {
        console.log('✅ COOKIE_DOMAIN is set:', configData.cookieDomain);
      }
      
      if (configData.cookieHeaderAnalysis) {
        console.log('\nCookie Header Analysis:', configData.cookieHeaderAnalysis);
        if (configData.cookieHeaderAnalysis.diagnosis) {
          console.log('\nDiagnosis:', configData.cookieHeaderAnalysis.diagnosis);
        }
      }
    } else {
      console.log('❌ Failed to get cookie config:', configResponse.status);
    }
  } catch (error) {
    console.error('❌ Error checking cookie config:', error);
  }
  
  // 4. Check debug session endpoint
  console.log('\n4️⃣ CHECKING DEBUG SESSION ENDPOINT:');
  try {
    const debugUrl = 'https://api-gateway-services-wildmind.onrender.com/api/auth/debug-session';
    const debugResponse = await fetch(debugUrl, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Debug session info:', JSON.stringify(debugData, null, 2));
      
      if (debugData.data?.cookieHeaderAnalysis) {
        console.log('\nCookie Header Analysis:', debugData.data.cookieHeaderAnalysis);
      }
    } else {
      console.log('❌ Failed to get debug session:', debugResponse.status);
    }
  } catch (error) {
    console.error('❌ Error checking debug session:', error);
  }
  
  // 5. Instructions for Network Tab
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 HOW TO CHECK IF COOKIE IS IN REQUEST:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n1. Open DevTools → Network tab');
  console.log('2. Reload page or make API call');
  console.log('3. Find /api/auth/me request');
  console.log('4. Click on it → Headers tab');
  console.log('5. Scroll to "Request Headers"');
  console.log('6. Look for "Cookie" header');
  console.log('\n✅ If you see: Cookie: app_session=...');
  console.log('   → Cookie IS being sent');
  console.log('   → But backend is rejecting it (check backend logs)');
  console.log('\n❌ If you see: Cookie: _ga=... (no app_session)');
  console.log('   → Cookie is NOT being sent');
  console.log('   → COOKIE_DOMAIN is not set');
  console.log('   → Set it in Render.com and log in again');
  console.log('\n═══════════════════════════════════════════════════════');
}

// Run the test
testCookieInRequest().catch(console.error);

