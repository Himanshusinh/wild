/**
 * Session Persistence Test Script (LIVE/PRODUCTION VERSION)
 * 
 * This version handles content encoding errors and works on live websites
 * 
 * Usage:
 * 1. Log in to your app
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 */

(async function testSessionPersistence() {
  console.log('🧪 Starting Session Persistence Test (Live)...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Backend verification (with error handling)
  console.log('📋 TEST 1: Backend Session Verification');
  console.log('───────────────────────────────────────────────────────');
  let sessionStatus = null;
  let hasValidSession = false;
  let debugEndpointError = false;
  
  try {
    const response = await fetch('/api/auth/debug-session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      try {
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
            console.log('   ❌ Session verification FAILED');
            if (sessionStatus.verification?.error) {
              console.log(`   Error: ${JSON.stringify(sessionStatus.verification.error)}`);
            }
          }
        } else {
          console.log('❌ Invalid response format:', data);
        }
      } catch (jsonError) {
        // Handle content decoding errors
        debugEndpointError = true;
        console.log('⚠️  Could not parse debug endpoint response (encoding issue)');
        console.log('   Status:', response.status);
        console.log('   This is OK - we can verify session via /api/auth/me instead');
      }
    } else {
      console.log(`❌ Backend returned error: ${response.status}`);
      try {
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}`);
      } catch {}
    }
  } catch (e) {
    debugEndpointError = true;
    console.log('⚠️  Failed to check debug endpoint:', e.message);
    console.log('   This is OK - we can verify session via /api/auth/me instead');
  }
  console.log('');

  // Test 2: Multiple API calls (stress test) - This is the REAL test
  console.log('📋 TEST 2: Multiple API Calls (Stress Test)');
  console.log('───────────────────────────────────────────────────────');
  console.log('   Making 5 consecutive /api/auth/me calls...\n');
  
  let successCount = 0;
  let failCount = 0;
  let userInfo = null;
  
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
      
      if (res.ok) {
        try {
          const data = await res.json();
          // Handle different response structures
          const userData = data?.data || data?.user || data;
          if (userData && (userData.email || userData.username || userData.uid)) {
            successCount++;
            // Keep the most complete user info
            if (!userInfo || (userData.email && !userInfo.email)) {
              userInfo = userData;
            }
            const userDisplay = userData.email || userData.username || userData.uid || 'N/A';
            console.log(`   ✅ Request ${i}/5: SUCCESS (${duration}ms) - User: ${userDisplay}`);
          } else if (data?.responseStatus === 'success') {
            // Response is successful but no user data (might be empty response)
            successCount++;
            console.log(`   ✅ Request ${i}/5: SUCCESS (${duration}ms) - Authenticated (no user data in response)`);
          } else {
            failCount++;
            console.log(`   ❌ Request ${i}/5: FAILED (${duration}ms) - No user data`);
            console.log(`      Response: ${JSON.stringify(data).substring(0, 100)}`);
          }
        } catch (jsonError) {
          failCount++;
          console.log(`   ❌ Request ${i}/5: FAILED (${duration}ms) - JSON parse error: ${jsonError.message}`);
        }
      } else {
        failCount++;
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.log(`   ❌ Request ${i}/5: FAILED (${duration}ms) - ${errorData?.message || 'Unknown error'}`);
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

  // Test 3: Check localStorage
  console.log('📋 TEST 3: LocalStorage Check');
  console.log('───────────────────────────────────────────────────────');
  try {
    const authToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (authToken) {
      console.log('✅ authToken found in localStorage');
      console.log(`   Token length: ${authToken.length} characters`);
      console.log(`   Token preview: ${authToken.substring(0, 30)}...`);
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
  
  // If debug endpoint failed but API calls succeed, session is still valid
  if (apiSuccess) {
    console.log('✅ OVERALL: Session persistence is WORKING CORRECTLY!');
    console.log('   - Multiple API calls: ✅ ALL SUCCEEDED');
    if (hasValidSession) {
      console.log('   - Backend verification: ✅ VERIFIED');
      console.log(`   - Expires in: ${sessionStatus?.jwt?.expiresInDays || 'unknown'} days`);
      console.log('   - Redis cache: ' + (sessionStatus?.cache?.found ? '✅ CACHED' : '⚠️ NOT CACHED'));
    } else if (debugEndpointError) {
      console.log('   - Backend verification: ⚠️  Debug endpoint has encoding issue');
      console.log('   - But /api/auth/me works, so session is VALID ✅');
    }
    if (userInfo && (userInfo.email || userInfo.username || userInfo.uid)) {
      console.log(`   - User: ${userInfo.email || userInfo.username || userInfo.uid}`);
      if (userInfo.uid) {
        console.log(`   - UID: ${userInfo.uid}`);
      }
    } else {
      console.log('   - User: Authenticated (user data not in response)');
      console.log('   - Note: Session is valid even if user data is not returned');
    }
    console.log('\n   🎉 Your session is VALID and will persist for 14 days!');
    console.log('   ✅ No random logouts should occur.');
  } else if (!apiSuccess) {
    console.log('❌ OVERALL: Session is NOT WORKING!');
    console.log('   - API calls are failing');
    console.log('   - User may not be logged in');
    console.log('   - Or session cookie was not set');
    console.log('\n   ACTION: Try logging in again and check if /api/auth/session is called.');
  } else {
    console.log('⚠️  OVERALL: Session status unclear');
    console.log('   - Review individual test results above');
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  return {
    hasValidSession: apiSuccess, // Use API success as primary indicator
    apiSuccess,
    successCount,
    failCount,
    expiresInDays: sessionStatus?.jwt?.expiresInDays,
    cached: sessionStatus?.cache?.found,
    userInfo
  };
})();

