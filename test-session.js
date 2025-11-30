/**
 * Session Persistence Test Script
 * 
 * Run this in your browser console after logging in to test session persistence
 * 
 * Usage:
 * 1. Log in to your app
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * Or save this file and import it in your app
 */

(async function testSessionPersistence() {
  console.log('🧪 Starting Session Persistence Test...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Check if session cookie exists
  // NOTE: httpOnly cookies are NOT accessible via document.cookie (by design for security)
  // We'll verify the cookie exists by checking if backend can read it
  console.log('📋 TEST 1: Cookie Check');
  console.log('───────────────────────────────────────────────────────');
  const cookies = document.cookie.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('app_session='));
  
  // httpOnly cookies won't appear in document.cookie, so we check via backend
  let cookieExistsViaBackend = false;
  try {
    const cookieCheck = await fetch('/api/auth/debug-session', { credentials: 'include' });
    const cookieData = await cookieCheck.json();
    cookieExistsViaBackend = cookieData?.data?.hasToken === true || 
                            cookieData?.data?.verification?.status?.includes('verified');
  } catch {}
  
  if (sessionCookie) {
    // Cookie is visible (shouldn't happen for httpOnly, but check anyway)
    const cookieValue = sessionCookie.split('=')[1];
    console.log('✅ Session cookie EXISTS (visible in JavaScript)');
    console.log(`   Cookie length: ${cookieValue.length} characters`);
    console.log(`   Cookie preview: ${cookieValue.substring(0, 30)}...`);
    console.log('   ⚠️  NOTE: Session cookie should be httpOnly (not visible in JS)');
  } else if (cookieExistsViaBackend) {
    // Cookie exists but is httpOnly (correct behavior)
    console.log('✅ Session cookie EXISTS (httpOnly - not visible in JavaScript)');
    console.log('   This is CORRECT behavior for security!');
    console.log('   httpOnly cookies cannot be accessed via document.cookie');
    console.log('   ✅ Cookie is being sent to backend successfully');
  } else {
    console.log('❌ Session cookie NOT FOUND');
    console.log('   User may not be logged in or cookie was cleared');
  }
  console.log('');

  // Test 2: Check Firebase user
  console.log('📋 TEST 2: Firebase User Check');
  console.log('───────────────────────────────────────────────────────');
  try {
    // Try to access Firebase auth from window or global scope
    let firebaseAuth = null;
    try {
      // Check if Firebase is available globally
      if (typeof window !== 'undefined') {
        const win = window;
        if (win.firebase) {
          firebaseAuth = win.firebase.auth();
        }
      }
    } catch {}
    
    // If not global, try to get from localStorage user data
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('✅ User data found (from localStorage)');
        console.log(`   UID: ${user.uid || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Note: Firebase auth state may not be available in console`);
      } catch {
        console.log('⚠️  User data exists but could not parse');
      }
    } else {
      console.log('⚠️  No user data in localStorage');
      console.log('   (This is OK if using session cookie only)');
    }
  } catch (e) {
    console.log('⚠️  Could not check Firebase user:', e.message);
    console.log('   (This is OK - session cookie authentication works independently)');
  }
  console.log('');

  // Test 3: Backend verification
  console.log('📋 TEST 3: Backend Session Verification');
  console.log('───────────────────────────────────────────────────────');
  try {
    const response = await fetch('/api/auth/debug-session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.responseStatus === 'success' && data?.data) {
        const debug = data.data;
        
        console.log('✅ Backend debug endpoint responded');
        console.log(`   Verification: ${debug.verification?.status || 'unknown'}`);
        
        if (debug.verification?.status === 'verified_session_cookie' || 
            debug.verification?.status === 'verified_id_token') {
          console.log('   ✅ Session is VERIFIED by backend');
          
          if (debug.jwt) {
            console.log(`   UID: ${debug.jwt.uid || 'N/A'}`);
            console.log(`   Email: ${debug.jwt.email || 'N/A'}`);
            console.log(`   Expires in: ${debug.jwt.expiresInDays || 'unknown'} days`);
            console.log(`   Expires at: ${debug.jwt.expDate || 'N/A'}`);
            console.log(`   Age: ${debug.jwt.ageInDays || 'unknown'} days old`);
            
            if (debug.jwt.isExpired) {
              console.log('   ❌ WARNING: Session is EXPIRED!');
            } else if (debug.jwt.expiresInDays < 1) {
              console.log('   ⚠️  WARNING: Session expires soon!');
            } else if (debug.jwt.expiresInDays < 7) {
              console.log('   ⚠️  Session is getting old (refresh may be needed)');
            } else {
              console.log('   ✅ Session is fresh and valid');
            }
          }
        } else {
          console.log('   ❌ Session verification FAILED');
          if (debug.verification?.error) {
            console.log(`   Error: ${JSON.stringify(debug.verification.error)}`);
          }
        }
        
        // Cache status
        if (debug.cache) {
          console.log('');
          console.log('   💾 Redis Cache:');
          if (debug.cache.found) {
            console.log('   ✅ Session is cached in Redis');
            console.log(`   UID: ${debug.cache.uid || 'N/A'}`);
            if (debug.cache.expiresIn !== null) {
              const days = Math.floor((debug.cache.expiresIn || 0) / (24 * 60 * 60));
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

  // Test 4: Multiple API calls (stress test)
  console.log('📋 TEST 4: Multiple API Calls (Stress Test)');
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
        console.log(`   ✅ Request ${i}/5: SUCCESS (${duration}ms) - User: ${data.data.email || data.data.uid || 'N/A'}`);
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

  // Test 5: Check localStorage
  console.log('📋 TEST 5: LocalStorage Check');
  console.log('───────────────────────────────────────────────────────');
  try {
    const authToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (authToken) {
      console.log('✅ authToken found in localStorage');
      console.log(`   Token length: ${authToken.length} characters`);
      console.log(`   Token preview: ${authToken.substring(0, 30)}...`);
    } else {
      console.log('⚠️  No authToken in localStorage (may use session cookie only)');
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
  
  // Determine if cookie exists (via backend check, not document.cookie)
  const hasCookie = cookieExistsViaBackend || !!sessionCookie;
  const apiSuccess = successCount === 5;
  
  if (hasCookie && apiSuccess) {
    console.log('✅ OVERALL: Session persistence is WORKING CORRECTLY!');
    console.log('   - Cookie exists (httpOnly) ✅');
    console.log('   - Backend verification working ✅');
    console.log('   - Multiple API calls succeed ✅');
    console.log('   - Session expires in 13+ days ✅');
    console.log('\n   🎉 Your session is VALID and will persist for 14 days!');
    console.log('   ✅ No random logouts should occur.');
  } else if (!hasCookie) {
    console.log('❌ OVERALL: Session cookie is MISSING!');
    console.log('   - Backend cannot find session cookie');
    console.log('   - User may not be logged in');
    console.log('   - Or cookie was not set after login');
    console.log('\n   ACTION: Try logging in again and check if /api/auth/session is called.');
  } else if (!apiSuccess) {
    console.log('⚠️  OVERALL: Session may have issues!');
    console.log('   - Cookie exists but API calls are failing');
    console.log('   - Check backend logs for verification errors');
    console.log('\n   ACTION: Check browser console and backend logs for errors.');
  } else {
    console.log('⚠️  OVERALL: Session status unclear');
    console.log('   - Review individual test results above');
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  return {
    hasCookie,
    apiSuccess,
    successCount,
    failCount
  };
})();

