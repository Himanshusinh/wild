# 🧪 Fast Verification: The "Token Kill" Test

You don't need to wait hours to test if the fix works. You can simulate the "missing/expired token" scenario right now.

**The Goal:** Verify that your app stays logged in using the **Session Cookie** even if the **Firebase Token** is missing or dead.

### Step-by-Step Instructions

1.  **Log In** to your app (`www.wildmindai.com` or `studio.wildmindai.com`).
2.  Open **Developer Tools** (F12 or Right Click -> Inspect).
3.  Go to the **Application** tab (top menu).
4.  In the left sidebar, verify you have the cookie:
    *   Expand **Cookies** -> Select your domain.
    *   Confirm `app_session` exists.
5.  **🔥 The Kill Step (Simulate Token Loss):**
    *   In the left sidebar, expand **IndexedDB**.
    *   Look for `firebaseLocalStorageDb` (or similar).
    *   Right-click it and select **Delete database** (or clear the object store inside it).
    *   *This deletes the local Firebase ID token, simulating what happens when it expires or is lost.*
6.  **The Test:**
    *   **Reload the page.**
    *   **Navigate to a protected page** (like `/studio`).

### ✅ Success Criteria
*   **You stay logged in.**
*   The app loads normally.
*   The backend accepts your `app_session` cookie and lets you in.

### ❌ Failure Criteria
*   You are immediately redirected to the login page.
*   This means your app is *ignoring* the cookie and relying 100% on the Firebase token (which we just deleted).

**Why this works:**
The "401 after some hours" happens because the Firebase token expires/fails, and the app wasn't falling back to the Cookie correctly. By forcibly killing the token, we prove the Cookie fallback is working!
