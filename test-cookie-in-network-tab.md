# How to Check if Cookie is Being Sent - Network Tab Guide

## 🔍 Problem

Cookie exists but API returns 401. Need to verify if cookie is actually being sent with the request.

## ✅ Solution: Check Network Tab

### Step 1: Open Network Tab

1. Open `studio.wildmindai.com` in browser
2. Open DevTools (F12)
3. Go to **Network** tab
4. **Check "Preserve log"** checkbox (important!)

### Step 2: Make API Call

1. The page will automatically make a call to `/api/auth/me`
2. Look for the request in Network tab
3. Click on the request to see details

### Step 3: Check Request Headers

1. Click on the `/api/auth/me` request
2. Go to **Headers** tab
3. Scroll down to **Request Headers** section
4. Look for **Cookie** header

**What to look for:**

✅ **GOOD (Cookie is being sent):**
```
Cookie: app_session=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

❌ **BAD (Cookie is NOT being sent):**
```
Cookie: _ga=GA1.1.1968927500.1762510965; _ga_S8H5QSFV5Z=GS2.1...
```
(Only Google Analytics cookies, no `app_session`)

### Step 4: Check Response

1. Go to **Response** tab
2. Check the response body
3. Should show error message

**If Cookie header is missing `app_session`:**
- Cookie is not being sent from browser
- This means cookie domain is not set correctly
- Solution: Set `COOKIE_DOMAIN=.wildmindai.com` in backend

**If Cookie header has `app_session` but still 401:**
- Cookie is being sent but backend rejects it
- Check backend logs for token verification errors
- Cookie might be expired or invalid

---

## 📋 Quick Checklist

- [ ] Open Network tab
- [ ] Find `/api/auth/me` request
- [ ] Check Request Headers → Cookie
- [ ] Verify `app_session` is in Cookie header
- [ ] If not, cookie domain is not set correctly
- [ ] If yes but still 401, check backend logs

---

## 🎯 Expected Results

### Scenario 1: Cookie NOT in Request Headers
**Problem:** Cookie domain not set
**Fix:** Set `COOKIE_DOMAIN=.wildmindai.com` in Render.com

### Scenario 2: Cookie in Request Headers but 401
**Problem:** Cookie is expired or invalid
**Fix:** Log in again to get fresh cookie

### Scenario 3: Cookie in Request Headers and 200 OK
**Problem:** None - everything working!
**Status:** ✅ Working correctly

