/**
 * Simple Session Test - Quick Check
 * 
 * Copy and paste this into browser console after logging in
 */

// Quick session check
(async () => {
  console.log('🔍 Quick Session Check...\n');
  
  // Check cookie
  const hasCookie = document.cookie.includes('app_session=');
  console.log(`Cookie: ${hasCookie ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check backend
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    
    if (data?.data?.verification?.status?.includes('verified')) {
      const days = data.data.jwt?.expiresInDays;
      console.log(`Backend: ✅ VERIFIED (expires in ${days} days)`);
      console.log(`Cache: ${data.data.cache?.found ? '✅ CACHED' : '⚠️ NOT CACHED'}`);
      console.log(`\n✅ Session is VALID and will persist!`);
    } else {
      console.log(`Backend: ❌ NOT VERIFIED`);
      console.log(`Error: ${data?.data?.verification?.error || 'Unknown'}`);
    }
  } catch (e) {
    console.log(`Backend: ❌ ERROR - ${e.message}`);
  }
  
  // Test API call
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    console.log(`API Call: ${res.ok ? '✅ SUCCESS' : `❌ FAILED (${res.status})`}`);
  } catch (e) {
    console.log(`API Call: ❌ ERROR`);
  }
  
  console.log('\n💡 Run printSessionStatus() for detailed report');
})();

