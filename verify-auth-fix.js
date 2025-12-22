/**
 * 🧪 WildMind Auth Verification Script
 * 
 * INSTRUCTIONS:
 * 1. Go to https://www.wildmindai.com or https://studio.wildmindai.com
 * 2. Open Developer Tools (F12 or Right Click -> Inspect)
 * 3. Go to the "Console" tab
 * 4. Paste the code below and hit Enter
 */

(async () => {
  console.clear();
  console.log("%c🔐 Verifying WildMind Auth Fix...", "font-size: 16px; font-weight: bold; color: #3b82f6");

  const API_URL = "https://api.wildmindai.com/api/auth/me";
  
  // 1. Check Cookie Presence (Client-side)
  // Note: This only sees non-HttpOnly cookies. The real test is the API call.
  const cookies = document.cookie.split(';').map(c => c.trim());
  const hasSession = cookies.some(c => c.startsWith('app_session='));
  
  console.group("1. 🍪 Cookie Check (Client-side)");
  if (hasSession) {
    console.log("%c✅ 'app_session' cookie found in document.cookie", "color: green");
  } else {
    console.log("%cℹ️ 'app_session' cookie NOT visible in document.cookie", "color: orange");
    console.log("This is expected if the cookie is HttpOnly. The API check below is the real test.");
  }
  console.groupEnd();

  // 2. API Connectivity & Auth Check
  console.group("2. 📡 API Connection & Auth Check");
  console.log(`Target: ${API_URL}`);
  
  try {
    const start = performance.now();
    const res = await fetch(API_URL, {
      method: 'GET',
      credentials: 'include', // CRITICAL: This sends the cookie
      headers: { 'Content-Type': 'application/json' }
    });
    const duration = Math.round(performance.now() - start);
    
    if (res.ok) {
      const data = await res.json();
      console.log(`%c✅ SUCCESS (200 OK) - ${duration}ms`, "color: green; font-weight: bold");
      console.log("User:", data.data?.user?.email || "Unknown");
      console.log("%c🎉 FIX VERIFIED: The cookie was successfully sent to api.wildmindai.com!", "color: green; font-weight: bold");
    } else {
      console.error(`%c❌ FAILED (${res.status} ${res.statusText})`, "color: red; font-weight: bold");
      if (res.status === 401) {
        console.error("Reason: Unauthorized. The cookie was likely NOT sent.");
        console.error("Possible causes:");
        console.error("1. 'NEXT_PUBLIC_API_BASE_URL' is still pointing to onrender.com?");
        console.error("2. 'COOKIE_DOMAIN' is not set to .wildmindai.com?");
        console.error("3. You are actually logged out. Try logging in again.");
      } else {
        console.error("Reason: API Error. Check network tab for details.");
      }
    }
  } catch (err) {
    console.error("%c❌ NETWORK ERROR", "color: red");
    console.error(err);
    console.error("Check if 'api.wildmindai.com' is reachable and CORS is configured.");
  }
  console.groupEnd();
})();
