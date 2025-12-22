/**
 * Comprehensive test script for canvas cookie sharing
 * Run this in browser console on studio.wildmindai.com
 */

async function testCanvasCookieSharing() {
  console.log('🔍 Testing Canvas Cookie Sharing...\n');
  console.log('═══════════════════════════════════════════════════════');
  
  // 1. Check current domain
  console.log('\n1️⃣ CURRENT DOMAIN:');
  console.log({
    hostname: window.location.hostname,
    href: window.location.href,
    protocol: window.location.protocol,
    origin: window.location.origin
  });
  
  // 2. Check visible cookies
  console.log('\n2️⃣ VISIBLE COOKIES (document.cookie):');
  const visibleCookies = document.cookie.split(';').map(c => c.trim());
  console.log({
    totalCookies: visibleCookies.length,
    cookies: visibleCookies,
    hasAppSession: visibleCookies.some(c => c.startsWith('app_session=')),
    note: 'httpOnly cookies (like app_session) are NOT visible here - this is normal'
  });
  
  // 3. Check DevTools cookies (we can't access these programmatically, but guide user)
  console.log('\n3️⃣ CHECK DEVTOOLS COOKIES:');
  console.log('📋 Manual Steps:');
  console.log('   1. Open DevTools → Application → Cookies');
  console.log('   2. Check cookies for: https://studio.wildmindai.com');
  console.log('   3. Look for app_session cookie');
  console.log('   4. If not found, check: https://www.wildmindai.com');
  console.log('   5. Verify cookie has Domain: .wildmindai.com (with leading dot)');
  
  // 4. Test API call
  console.log('\n4️⃣ TESTING API CALL:');
  try {
    const apiUrl = 'https://api-gateway-services-wildmind.onrender.com/api/auth/me';
    console.log('Making request to:', apiUrl);
    console.log('With credentials: include (should send cookies)');
    
    const response = await fetch(apiUrl, {
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
      console.log('✅ API CALL SUCCESS:', {
        hasUser: !!data?.data?.user,
        userId: data?.data?.user?.uid,
        email: data?.data?.user?.email
      });
    } else {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      
      console.log('❌ API CALL FAILED:', {
        status: response.status,
        error: errorData
      });
      
      if (response.status === 401) {
        console.log('\n🔴 DIAGNOSIS: 401 Unauthorized');
        console.log('Possible causes:');
        console.log('  1. COOKIE_DOMAIN env var is NOT set in backend (most likely)');
        console.log('  2. Cookie was set without Domain attribute');
        console.log('  3. User is not logged in on www.wildmindai.com');
        console.log('  4. Cookie domain mismatch');
        console.log('\n📋 How to fix:');
        console.log('  1. Go to Render.com → API Gateway service → Environment tab');
        console.log('  2. Add: COOKIE_DOMAIN=.wildmindai.com');
        console.log('  3. Restart backend service');
        console.log('  4. Log in again on www.wildmindai.com');
        console.log('  5. Check cookie has Domain: .wildmindai.com');
        console.log('  6. Try studio.wildmindai.com again');
      }
    }
  } catch (error) {
    console.error('❌ API CALL ERROR:', error);
  }
  
  // 5. Check backend cookie config
  console.log('\n5️⃣ CHECKING BACKEND COOKIE CONFIG:');
  try {
    const configUrl = 'https://api-gateway-services-wildmind.onrender.com/api/auth/debug/cookie-config';
    const configResponse = await fetch(configUrl, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('Backend cookie config:', configData);
      
      if (configData.cookieDomain === '(NOT SET)') {
        console.log('\n🔴 CRITICAL: COOKIE_DOMAIN is NOT SET!');
        console.log('This is why cookies are not sharing across subdomains.');
        console.log('Follow the instructions in the response to fix it.');
      } else {
        console.log('✅ COOKIE_DOMAIN is set:', configData.cookieDomain);
        console.log('If cookies still not working, user needs to log in again after setting env var.');
      }
    } else {
      console.log('❌ Failed to get cookie config:', configResponse.status);
    }
  } catch (error) {
    console.error('❌ Error checking cookie config:', error);
  }
  
  // 6. Check if logged in on main site
  console.log('\n6️⃣ CHECKING MAIN SITE LOGIN STATUS:');
  console.log('📋 Manual Steps:');
  console.log('  1. Open new tab → https://www.wildmindai.com');
  console.log('  2. Check if you are logged in');
  console.log('  3. Open DevTools → Application → Cookies → https://www.wildmindai.com');
  console.log('  4. Look for app_session cookie');
  console.log('  5. Check Domain column:');
  console.log('     - If shows: .wildmindai.com (with dot) → ✅ Correct');
  console.log('     - If shows: www.wildmindai.com (no dot) → ❌ COOKIE_DOMAIN not set');
  
  // 7. Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\nIf API returns 401:');
  console.log('  → Most likely: COOKIE_DOMAIN env var is NOT set');
  console.log('  → Solution: Set COOKIE_DOMAIN=.wildmindai.com in Render.com');
  console.log('  → Then: Restart backend and log in again');
  console.log('\nIf cookie exists but API still 401:');
  console.log('  → Cookie might be expired or invalid');
  console.log('  → Check cookie expiration in DevTools');
  console.log('  → Log in again to get fresh cookie');
  console.log('\nIf cookie has wrong domain:');
  console.log('  → Domain shows www.wildmindai.com instead of .wildmindai.com');
  console.log('  → COOKIE_DOMAIN env var is not set');
  console.log('  → Set it and log in again');
  console.log('\n═══════════════════════════════════════════════════════');
}

// Run the test
testCanvasCookieSharing().catch(console.error);

