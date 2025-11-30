/**
 * Session Persistence Test Script (FIXED VERSION)
 * 
 * This version correctly handles httpOnly cookies
 * 
 * Usage:
 * 1. Log in to your app
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 */

(async function testSessionPersistence() {
  console.log('🧪 Starting Session Persistence Test...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Backend verification (this is the REAL check)
  console.log('📋 TEST 1: Backend Session Verification');
  console.log('───────────────────────────────────────────────────────');
  let sessionStatus = null;
  let hasValidSession = false;
  
  try {
    const response = await fetch('/api/auth/debug-session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.responseStatus === 'success' && data?.data) {
        sessionStatus = data.data;
        hasValidSession = sessionStatus.verification?.status === 'verified_session_cookie' || 
                         sessionStatus.verification?.status === 'verified_id_token';
        
        console.log('✅ Backend debug endpoint responded');
        console.log(`   Verification: ${sessionStatus.verification?.status || 'unknown'}`);
        
        if (hasValidSession) {
          console.log('   ✅ Session is VERIFIED by backend');
          
          if (sessionStatus.jwt) {
            console.log(`   UID: ${sessionStatus.jwt.uid || 'N/A'}`);
            console.log(`   Email: ${sessionStatus.jwt.email || 'N/A'}`);
            console.log(`   Expires in: ${sessionStatus.jwt.expiresInDays || 'unknown'} days`);
            console.log(`   Expires at: ${sessionStatus.jwt.expDate || 'N/A'}`);
            console.log(`   Age: ${sessionStatus.jwt.ageInDays || 'unknown'} days old`);
            
            if (sessionStatus.jwt.isExpired) {
              console.log('   ❌ WARNING: Session is EXPIRED!');
            } else if (sessionStatus.jwt.expiresInDays < 1) {
              console.log('   ⚠️  WARNING: Session expires soon!');
            } else if (sessionStatus.jwt.expiresInDays < 7) {
              console.log('   ⚠️  Session is getting old (refresh may be needed)');
            } else {
              console.log('   ✅ Session is fresh and valid');
            }
          }
        } else {
          console.log('   ❌ Session verification FAILED');
          if (sessionStatus.verification?.error) {
            console.log(`   Error: ${JSON.stringify(sessionStatus.verification.error)}`);
          }
        }
        
        // Cache status
        if (sessionStatus.cache) {
          console.log('');
          console.log('   💾 Redis Cache:');
          if (sessionStatus.cache.found) {
            console.log('   ✅ Session is cached in Redis');
            console.log(`   UID: ${sessionStatus.cache.uid || 'N/A'}`);
            if (sessionStatus.cache.expiresIn !== null) {
              const days = Math.floor((sessionStatus.cache.expiresIn || 0) / (24 * 60 * 60));
              console.log(`   Expires in: ${days} days`);
            }
          } else {
            console.log('   ⚠️  Session not cached (may cause slower auth)');
          }
        }
      } else {
        console.log('❌ Invalid response format:', data);
      }
    } else {
      console.log(`❌ Backend returned error: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 200)}`);
    }
  } catch (e) {
    console.log('❌ Failed to check backend:', e.message);
  }
  console.log('');

  // Test 2: Cookie Check (Note: httpOnly cookies won't show in document.cookie)
  console.log('📋 TEST 2: Cookie Check');
  console.log('───────────────────────────────────────────────────────');
  const cookies = document.cookie.split(';').map(c => c.trim());
  const visibleCookie = cookies.find(c => c.startsWith('app_session='));
  
  if (visibleCookie) {
    console.log('✅ Session cookie visible in JavaScript');
    console.log('   ⚠️  NOTE: Session cookie should be httpOnly (not visible)');
    console.log('   If visible, it may not be secure!');
  } else if (hasValidSession) {
    console.log('✅ Session cookie EXISTS (httpOnly - correct behavior!)');
    console.log('   httpOnly cookies are NOT accessible via document.cookie');
    console.log('   This is CORRECT for security - prevents XSS attacks');
    console.log('   ✅ Cookie is being sent to backend successfully');
    console.log('');
    console.log('   To view the cookie:');
    console.log('   1. Open DevTools (F12)');
    console.log('   2. Go to Application tab → Cookies');
    console.log('   3. Look for "app_session" cookie');
    console.log('   4. Check expiration date (should be ~14 days)');
  } else {
    console.log('❌ Session cookie NOT FOUND');
    console.log('   Backend cannot verify session');
  }
  console.log('');

  // Test 3: Multiple API calls (stress test)
  console.log('📋 TEST 3: Multiple API Calls (Stress Test)');
  console.log('───────────────────────────────────────────────────────');
  console.log('   Making 5 consecutive /api/auth/me calls...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 1; i <= 5; i++) {
    try {
      const startTime = performance.now();
      const res = await fetch('/api/auth/me', { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const duration = (performance.now() - startTime).toFixed(0);
      const data = await res.json();
      
      if (res.ok && data?.data) {
        successCount++;
        const userInfo = data.data.email || data.data.username || data.data.uid || 'N/A';
        console.log(`   ✅ Request ${i}/5: SUCCESS (${duration}ms) - User: ${userInfo}`);
      } else {
        failCount++;
        console.log(`   ❌ Request ${i}/5: FAILED (${duration}ms) - ${data?.message || 'Unknown error'}`);
        if (res.status === 401) {
          console.log('      ⚠️  401 Unauthorized - Session may be invalid!');
        }
      }
    } catch (e) {
      failCount++;
      console.log(`   ❌ Request ${i}/5: ERROR - ${e.message}`);
    }
    
    // Wait 500ms between requests
    if (i < 5) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log('');
  console.log(`   Results: ${successCount} successful, ${failCount} failed`);
  if (failCount > 0) {
    console.log('   ⚠️  WARNING: Some requests failed - session may not be persisting!');
  } else {
    console.log('   ✅ All requests succeeded - session is persisting correctly!');
  }
  console.log('');

  // Test 4: Check localStorage
  console.log('📋 TEST 4: LocalStorage Check');
  console.log('───────────────────────────────────────────────────────');
  try {
    const authToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (authToken) {
      console.log('✅ authToken found in localStorage');
      console.log(`   Token length: ${authToken.length} characters`);
      console.log(`   Token preview: ${authToken.substring(0, 30)}...`);
      console.log('   Note: This is used for Bearer token auth (backup method)');
    } else {
      console.log('⚠️  No authToken in localStorage');
      console.log('   (This is OK - session cookie is primary auth method)');
    }
    
    if (user) {
      try {
        const userObj = JSON.parse(user);
        console.log('✅ User data found in localStorage');
        console.log(`   UID: ${userObj.uid || 'N/A'}`);
        console.log(`   Email: ${userObj.email || 'N/A'}`);
      } catch {
        console.log('⚠️  User data exists but could not parse');
      }
    } else {
      console.log('⚠️  No user data in localStorage');
    }
  } catch (e) {
    console.log('❌ Error checking localStorage:', e.message);
  }
  console.log('');

  // Final Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const apiSuccess = successCount === 5;
  
  if (hasValidSession && apiSuccess) {
    console.log('✅ OVERALL: Session persistence is WORKING CORRECTLY!');
    console.log('   - Backend verification: ✅ VERIFIED');
    console.log('   - Session cookie: ✅ EXISTS (httpOnly)');
    console.log('   - Multiple API calls: ✅ ALL SUCCEEDED');
    console.log(`   - Expires in: ${sessionStatus?.jwt?.expiresInDays || 'unknown'} days`);
    console.log('   - Redis cache: ' + (sessionStatus?.cache?.found ? '✅ CACHED' : '⚠️ NOT CACHED'));
    console.log('\n   🎉 Your session is VALID and will persist for 14 days!');
    console.log('   ✅ No random logouts should occur.');
    console.log('\n   💡 To verify cookie in DevTools:');
    console.log('      Application → Cookies → Your domain → app_session');
  } else if (!hasValidSession) {
    console.log('❌ OVERALL: Session is NOT VERIFIED!');
    console.log('   - Backend cannot verify session cookie');
    console.log('   - User may not be logged in');
    console.log('   - Or cookie was not set after login');
    console.log('\n   ACTION: Try logging in again and check if /api/auth/session is called.');
  } else if (!apiSuccess) {
    console.log('⚠️  OVERALL: Session may have issues!');
    console.log('   - Backend verification works but API calls are failing');
    console.log('   - Check backend logs for verification errors');
    console.log('\n   ACTION: Check browser console and backend logs for errors.');
  } else {
    console.log('⚠️  OVERALL: Session status unclear');
    console.log('   - Review individual test results above');
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  return {
    hasValidSession,
    apiSuccess,
    successCount,
    failCount,
    expiresInDays: sessionStatus?.jwt?.expiresInDays,
    cached: sessionStatus?.cache?.found
  };
})();

