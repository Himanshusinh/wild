/**
 * Utility functions to check session status in the browser console
 * Use these to verify session persistence without waiting for logout
 */

export interface SessionStatus {
  hasCookie: boolean;
  cookieValue: string | null;
  cookieExpiration: Date | null;
  firebaseUser: {
    uid: string | null;
    email: string | null;
    emailVerified: boolean;
  };
  backendVerification: {
    verified: boolean;
    uid: string | null;
    expiresIn: number | null;
    expiresInDays: number | null;
    isExpired: boolean;
    error: string | null;
  };
  cacheStatus: {
    cached: boolean;
    uid: string | null;
    expiresIn: number | null;
  };
}

/**
 * Check session status from browser console
 * Usage: In browser console, run: checkSessionStatus()
 */
export async function checkSessionStatus(): Promise<SessionStatus> {
  const status: SessionStatus = {
    hasCookie: false,
    cookieValue: null,
    cookieExpiration: null,
    firebaseUser: {
      uid: null,
      email: null,
      emailVerified: false,
    },
    backendVerification: {
      verified: false,
      uid: null,
      expiresIn: null,
      expiresInDays: null,
      isExpired: false,
      error: null,
    },
    cacheStatus: {
      cached: false,
      uid: null,
      expiresIn: null,
    },
  };

  // Check cookie
  try {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('app_session='));
    if (sessionCookie) {
      status.hasCookie = true;
      status.cookieValue = sessionCookie.split('=')[1]?.substring(0, 50) + '...' || null;
      
      // Try to get expiration from cookie (if available)
      const expiresMatch = document.cookie.match(/app_session=[^;]+(?:;\s*expires=([^;]+))?/i);
      if (expiresMatch && expiresMatch[1]) {
        status.cookieExpiration = new Date(expiresMatch[1]);
      }
    }
  } catch (e) {
    console.error('Error checking cookie:', e);
  }

  // Check Firebase user
  try {
    const { auth } = await import('../lib/firebase');
    if (auth?.currentUser) {
      status.firebaseUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
      };
    }
  } catch (e) {
    console.error('Error checking Firebase user:', e);
  }

  // Check backend verification
  try {
    const response = await fetch('/api/auth/debug-session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.responseStatus === 'success' && data?.data) {
        const debugData = data.data;
        
        if (debugData.verification?.status === 'verified_session_cookie' || 
            debugData.verification?.status === 'verified_id_token') {
          status.backendVerification.verified = true;
          
          if (debugData.jwt) {
            status.backendVerification.uid = debugData.jwt.uid;
            status.backendVerification.expiresIn = debugData.jwt.expiresIn;
            status.backendVerification.expiresInDays = debugData.jwt.expiresInDays;
            status.backendVerification.isExpired = debugData.jwt.isExpired || false;
          }
        } else {
          status.backendVerification.error = debugData.verification?.error || 'Verification failed';
        }
        
        if (debugData.cache?.found) {
          status.cacheStatus.cached = true;
          status.cacheStatus.uid = debugData.cache.uid;
          status.cacheStatus.expiresIn = debugData.cache.expiresIn;
        }
      }
    } else {
      status.backendVerification.error = `Backend returned ${response.status}`;
    }
  } catch (e: any) {
    status.backendVerification.error = e?.message || 'Failed to check backend';
  }

  return status;
}

/**
 * Print session status to console in a readable format
 */
export async function printSessionStatus(): Promise<void> {
  console.log('🔍 Checking session status...\n');
  const status = await checkSessionStatus();
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 SESSION STATUS REPORT');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('🍪 COOKIE STATUS:');
  console.log(`   Has Cookie: ${status.hasCookie ? '✅ YES' : '❌ NO'}`);
  if (status.cookieValue) {
    console.log(`   Cookie Value: ${status.cookieValue}`);
  }
  if (status.cookieExpiration) {
    const daysUntilExp = Math.floor((status.cookieExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    console.log(`   Cookie Expires: ${status.cookieExpiration.toLocaleString()} (${daysUntilExp} days)`);
  }
  console.log('');
  
  console.log('🔥 FIREBASE USER:');
  if (status.firebaseUser.uid) {
    console.log(`   UID: ${status.firebaseUser.uid}`);
    console.log(`   Email: ${status.firebaseUser.email || 'N/A'}`);
    console.log(`   Verified: ${status.firebaseUser.emailVerified ? '✅' : '❌'}`);
  } else {
    console.log('   ❌ No Firebase user found');
  }
  console.log('');
  
  console.log('🔐 BACKEND VERIFICATION:');
  if (status.backendVerification.verified) {
    console.log('   Status: ✅ VERIFIED');
    if (status.backendVerification.uid) {
      console.log(`   UID: ${status.backendVerification.uid}`);
    }
    if (status.backendVerification.expiresInDays !== null) {
      const days = status.backendVerification.expiresInDays;
      const hours = Math.floor((status.backendVerification.expiresIn || 0) / 3600);
      console.log(`   Expires In: ${days} days (${hours} hours)`);
      if (days < 1) {
        console.log('   ⚠️  WARNING: Session expires soon!');
      } else if (days < 7) {
        console.log('   ⚠️  Session is getting old - refresh may be needed soon');
      } else {
        console.log('   ✅ Session is fresh and valid');
      }
    }
    if (status.backendVerification.isExpired) {
      console.log('   ❌ ERROR: Session is EXPIRED!');
    }
  } else {
    console.log('   Status: ❌ NOT VERIFIED');
    if (status.backendVerification.error) {
      console.log(`   Error: ${status.backendVerification.error}`);
    }
  }
  console.log('');
  
  console.log('💾 REDIS CACHE:');
  if (status.cacheStatus.cached) {
    console.log('   Status: ✅ CACHED');
    if (status.cacheStatus.uid) {
      console.log(`   UID: ${status.cacheStatus.uid}`);
    }
    if (status.cacheStatus.expiresIn !== null) {
      const days = Math.floor((status.cacheStatus.expiresIn || 0) / (24 * 60 * 60));
      console.log(`   Expires In: ${days} days`);
    }
  } else {
    console.log('   Status: ❌ NOT CACHED (may cause slower auth checks)');
  }
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════');
  
  // Overall assessment
  if (status.backendVerification.verified && !status.backendVerification.isExpired) {
    console.log('✅ OVERALL: Session is VALID and PERSISTING correctly');
  } else if (!status.hasCookie) {
    console.log('❌ OVERALL: No session cookie - user is NOT logged in');
  } else if (status.backendVerification.isExpired) {
    console.log('❌ OVERALL: Session is EXPIRED - user needs to log in again');
  } else {
    console.log('⚠️  OVERALL: Session status unclear - check errors above');
  }
  console.log('═══════════════════════════════════════════════════════\n');
  
  return status as any;
}

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).checkSessionStatus = checkSessionStatus;
  (window as any).printSessionStatus = printSessionStatus;
}

