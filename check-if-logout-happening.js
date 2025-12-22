/**
 * Check if logout is currently happening
 * Run this in browser console to monitor logout activity
 */

(function() {
  console.log('🔍 LOGOUT MONITORING STARTED\n');
  console.log('═══════════════════════════════════════════════════════');
  
  // Track logout-related events
  const logoutEvents = [];
  
  // 1. Monitor console for logout messages
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('logout') || message.includes('401') || message.includes('Unauthorized') || 
        message.includes('clearing') || message.includes('clearAuth') || message.includes('signOut')) {
      logoutEvents.push({
        type: 'console.warn',
        message: message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      console.log('🚨 LOGOUT-RELATED WARNING:', ...args);
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('logout') || message.includes('401') || message.includes('Unauthorized') || 
        message.includes('clearing') || message.includes('clearAuth') || message.includes('signOut')) {
      logoutEvents.push({
        type: 'console.error',
        message: message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      console.log('🚨 LOGOUT-RELATED ERROR:', ...args);
    }
    originalConsoleError.apply(console, args);
  };
  
  // 2. Monitor fetch/axios calls to /api/auth/me
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('/api/auth/me')) {
      console.log('📡 [FETCH] /api/auth/me called:', {
        url: url,
        timestamp: new Date().toISOString()
      });
      
      return originalFetch.apply(this, args).then(response => {
        if (response.status === 401) {
          logoutEvents.push({
            type: 'api_401',
            url: url,
            status: 401,
            timestamp: new Date().toISOString(),
            message: '/api/auth/me returned 401 Unauthorized'
          });
          console.error('🚨 [FETCH] /api/auth/me returned 401 - This triggers logout cleanup!');
        }
        return response;
      });
    }
    return originalFetch.apply(this, args);
  };
  
  // 3. Monitor Redux state changes (if Redux is available)
  if (window.__REDUX_DEVTOOLS_EXTENSION__ || window.__REDUX_STORE__) {
    console.log('✅ Redux detected - monitoring state changes');
  }
  
  // 4. Monitor localStorage/sessionStorage changes
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (key.includes('auth') || key.includes('user') || key.includes('token') || key.includes('session')) {
      console.log('💾 [STORAGE] Setting:', { key, valueLength: value?.length, timestamp: new Date().toISOString() });
    }
    return originalSetItem.apply(this, arguments);
  };
  
  const originalRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function(key) {
    if (key.includes('auth') || key.includes('user') || key.includes('token') || key.includes('session')) {
      logoutEvents.push({
        type: 'storage_clear',
        key: key,
        timestamp: new Date().toISOString(),
        message: `Storage item removed: ${key}`
      });
      console.warn('🚨 [STORAGE] Removing:', { key, timestamp: new Date().toISOString() });
    }
    return originalRemoveItem.apply(this, arguments);
  };
  
  // 5. Monitor cookie changes
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || 
                                   Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
  
  if (originalCookieDescriptor && originalCookieDescriptor.set) {
    Object.defineProperty(document, 'cookie', {
      get: originalCookieDescriptor.get,
      set: function(value) {
        if (value.includes('app_session') && (value.includes('Max-Age=0') || value.includes('Expires='))) {
          logoutEvents.push({
            type: 'cookie_clear',
            cookie: value.substring(0, 100),
            timestamp: new Date().toISOString(),
            message: 'app_session cookie being cleared'
          });
          console.error('🚨 [COOKIE] Clearing app_session cookie:', value.substring(0, 100));
        }
        return originalCookieDescriptor.set.call(this, value);
      },
      configurable: true
    });
  }
  
  // 6. Check current state
  function checkCurrentState() {
    console.log('\n📊 CURRENT STATE CHECK:');
    console.log('═══════════════════════════════════════════════════════');
    
    // Check cookies
    const cookies = document.cookie.split(';').map(c => c.trim());
    const hasAppSession = cookies.some(c => c.startsWith('app_session='));
    console.log('Cookies:', {
      total: cookies.length,
      hasAppSession: hasAppSession,
      cookies: cookies
    });
    
    // Check localStorage
    const authKeys = ['authToken', 'user', 'me_cache'];
    const localStorageData = {};
    authKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        localStorageData[key] = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : null;
      } catch {}
    });
    console.log('localStorage:', localStorageData);
    
    // Check Redux state (if available)
    if (window.__REDUX_STORE__) {
      try {
        const state = window.__REDUX_STORE__.getState();
        console.log('Redux auth state:', {
          hasUser: !!state?.auth?.user,
          userId: state?.auth?.user?.uid || null
        });
      } catch {}
    }
    
    // Check Firebase auth (if available)
    if (window.firebase || window.__FIREBASE_AUTH__) {
      console.log('Firebase auth: Available (check auth.currentUser manually)');
    }
    
    console.log('═══════════════════════════════════════════════════════\n');
  }
  
  // 7. Function to show logout events
  window.showLogoutEvents = function() {
    console.log('\n🚨 LOGOUT EVENTS DETECTED:');
    console.log('═══════════════════════════════════════════════════════');
    if (logoutEvents.length === 0) {
      console.log('✅ No logout events detected!');
    } else {
      logoutEvents.forEach((event, idx) => {
        console.log(`\n${idx + 1}. [${event.type}] ${event.timestamp}`);
        console.log(`   Message: ${event.message || event.cookie || event.key || event.url}`);
        if (event.stack) {
          console.log(`   Stack: ${event.stack.split('\n').slice(1, 4).join('\n')}`);
        }
      });
    }
    console.log('═══════════════════════════════════════════════════════\n');
  };
  
  // 8. Function to check if logout is happening
  window.checkIfLogoutHappening = function() {
    checkCurrentState();
    showLogoutEvents();
    
    console.log('\n📋 ANALYSIS:');
    console.log('═══════════════════════════════════════════════════════');
    
    if (logoutEvents.length === 0) {
      console.log('✅ No logout activity detected');
      console.log('   - No 401 errors');
      console.log('   - No cookie clearing');
      console.log('   - No storage clearing');
    } else {
      console.log('⚠️ Logout activity detected!');
      console.log(`   - Total events: ${logoutEvents.length}`);
      
      const api401s = logoutEvents.filter(e => e.type === 'api_401');
      const cookieClears = logoutEvents.filter(e => e.type === 'cookie_clear');
      const storageClears = logoutEvents.filter(e => e.type === 'storage_clear');
      
      if (api401s.length > 0) {
        console.log(`   - 401 errors: ${api401s.length} (This triggers logout cleanup!)`);
      }
      if (cookieClears.length > 0) {
        console.log(`   - Cookie clears: ${cookieClears.length}`);
      }
      if (storageClears.length > 0) {
        console.log(`   - Storage clears: ${storageClears.length}`);
      }
      
      console.log('\n💡 Most likely cause:');
      if (api401s.length > 0) {
        console.log('   → /api/auth/me is returning 401');
        console.log('   → This triggers cleanup in me.ts and AuthBootstrap.tsx');
        console.log('   → User state is cleared (appears logged out)');
        console.log('   → But actual performLogout() is NOT called');
      }
    }
    console.log('═══════════════════════════════════════════════════════\n');
  };
  
  // Initial check
  checkCurrentState();
  
  console.log('\n✅ Monitoring started!');
  console.log('📋 Available commands:');
  console.log('   - checkIfLogoutHappening() - Check current state and events');
  console.log('   - showLogoutEvents() - Show all logout events');
  console.log('\n⏰ Monitoring will continue in background...\n');
  
})();

