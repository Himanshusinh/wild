/**
 * Comprehensive cookie diagnosis script
 * Run this in browser console on www.wildmindai.com (where you're logged in)
 */

async function diagnoseCookieIssue() {
  console.log('🔍 COMPREHENSIVE COOKIE DIAGNOSIS\n');
  console.log('═══════════════════════════════════════════════════════');
  
  // 1. Check current domain
  console.log('\n1️⃣ CURRENT DOMAIN:');
  console.log({
    hostname: window.location.hostname,
    href: window.location.href,
    isMainSite: window.location.hostname === 'www.wildmindai.com' || window.location.hostname === 'wildmindai.com'
  });
  
  if (!window.location.hostname.includes('wildmindai.com')) {
    console.log('⚠️ WARNING: You are not on www.wildmindai.com');
    console.log('Please run this script on www.wildmindai.com where you are logged in');
    return;
  }
  
  // 2. Check cookies in DevTools (we can't access httpOnly cookies, but guide user)
  console.log('\n2️⃣ CHECKING COOKIES:');
  console.log('📋 Manual Steps (CRITICAL):');
  console.log('   1. Open DevTools → Application → Cookies → https://www.wildmindai.com');
  console.log('   2. Find app_session cookie');
  console.log('   3. Check the "Domain" column:');
  console.log('      ✅ CORRECT: Domain: .wildmindai.com (with leading dot)');
  console.log('      ❌ WRONG: Domain: www.wildmindai.com (no leading dot)');
  console.log('   4. If wrong, you need to log in again after COOKIE_DOMAIN was set');
  
  const visibleCookies = document.cookie.split(';').map(c => c.trim());
  console.log('\nVisible cookies (httpOnly cookies like app_session are NOT visible here):');
  console.log({
    totalCookies: visibleCookies.length,
    cookies: visibleCookies,
    hasAppSessionVisible: visibleCookies.some(c => c.startsWith('app_session=')),
    note: 'app_session is httpOnly, so it won\'t be in document.cookie - this is normal'
  });
  
  // 3. Test API call from main site
  console.log('\n3️⃣ TESTING API CALL FROM MAIN SITE:');
  try {
    const apiUrl = '/api/auth/me';
    console.log('Making request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API CALL SUCCESS:', {
        hasUser: !!data?.data?.user,
        userId: data?.data?.user?.uid,
        email: data?.data?.user?.email
      });
      console.log('You are logged in on www.wildmindai.com');
    } else {
      const errorText = await response.text();
      console.log('❌ API CALL FAILED:', {
        status: response.status,
        error: errorText.substring(0, 200)
      });
      console.log('You are NOT logged in on www.wildmindai.com');
      console.log('Please log in first, then check the cookie domain');
    }
  } catch (error) {
    console.error('❌ API CALL ERROR:', error);
  }
  
  // 4. Check backend cookie config
  console.log('\n4️⃣ CHECKING BACKEND COOKIE CONFIG:');
  try {
    const configUrl = 'https://api-gateway-services-wildmind.onrender.com/api/auth/debug/cookie-config';
    const configResponse = await fetch(configUrl, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('Backend Config:', {
        cookieDomain: configData.cookieDomain,
        isSet: configData.cookieDomain !== '(NOT SET)',
        message: configData.message
      });
      
      if (configData.cookieDomain === '(NOT SET)') {
        console.log('\n🔴 CRITICAL: COOKIE_DOMAIN is NOT SET!');
        console.log('Set it in Render.com and restart backend');
      } else {
        console.log('✅ COOKIE_DOMAIN is set:', configData.cookieDomain);
        console.log('\n📋 NEXT STEPS:');
        console.log('   1. Check DevTools → Application → Cookies');
        console.log('   2. Verify app_session cookie has Domain: .wildmindai.com');
        console.log('   3. If domain is www.wildmindai.com (no dot), log in again');
        console.log('   4. After logging in, check cookie domain again');
        console.log('   5. Then test studio.wildmindai.com');
      }
      
      if (configData.cookieHeaderAnalysis) {
        console.log('\nCookie Header Analysis:', configData.cookieHeaderAnalysis);
      }
    } else {
      console.log('❌ Failed to get cookie config:', configResponse.status);
    }
  } catch (error) {
    console.error('❌ Error checking cookie config:', error);
  }
  
  // 5. Instructions for checking cookie domain
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 HOW TO CHECK COOKIE DOMAIN:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n1. Open DevTools → Application → Cookies');
  console.log('2. Select: https://www.wildmindai.com');
  console.log('3. Find app_session cookie');
  console.log('4. Check "Domain" column:');
  console.log('   ✅ CORRECT: .wildmindai.com (with leading dot)');
  console.log('   ❌ WRONG: www.wildmindai.com (no leading dot)');
  console.log('\nIf domain is WRONG:');
  console.log('   1. Log out');
  console.log('   2. Log in again');
  console.log('   3. Check cookie domain again (should be .wildmindai.com)');
  console.log('   4. Then test studio.wildmindai.com');
  console.log('\n═══════════════════════════════════════════════════════');
}

// Run the diagnosis
diagnoseCookieIssue().catch(console.error);

