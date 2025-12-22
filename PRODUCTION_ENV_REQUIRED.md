# Production Environment Variables - Required List

## 🚨 **CRITICAL - Required for Production**

You **MUST** set these environment variables in your production deployment platform (Vercel, Netlify, Render, etc.):

### **Frontend (Wild) - Required Variables**

```env
# ============================================
# API Configuration (REQUIRED)
# ============================================
NEXT_PUBLIC_API_BASE_URL=https://api.wildmindai.com

# ============================================
# Storage Configuration (REQUIRED)
# ============================================
NEXT_PUBLIC_ZATA_PREFIX=https://idr01.zata.ai/devstoragev1/

# ============================================
# Firebase Configuration (REQUIRED)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your-production-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-production-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# ============================================
# Cookie Domain (Recommended)
# ============================================
NEXT_PUBLIC_COOKIE_DOMAIN=.wildmindai.com
```

### **Backend (API Gateway) - Required Variables**

See `api-gateway-services-wildmind/env.example.production` for the complete list.

**Critical ones:**
- `NEXT_PUBLIC_API_BASE_URL` - Your production API URL
- `NEXT_PUBLIC_ZATA_PREFIX` - Your Zata storage URL
- All Firebase config variables
- `COOKIE_DOMAIN` - For cross-subdomain auth

## 📋 **Quick Checklist**

### Frontend Production Setup:
- [ ] `NEXT_PUBLIC_API_BASE_URL` - Set to your production API URL
- [ ] `NEXT_PUBLIC_ZATA_PREFIX` - Set to your Zata storage URL
- [ ] All `NEXT_PUBLIC_FIREBASE_*` variables
- [ ] `NEXT_PUBLIC_COOKIE_DOMAIN` (recommended)

### Backend Production Setup:
- [ ] `NEXT_PUBLIC_API_BASE_URL` - Same as frontend
- [ ] `ZATA_ENDPOINT`, `ZATA_BUCKET`, `ZATA_REGION`, `ZATA_ACCESS_KEY_ID`, `ZATA_SECRET_ACCESS_KEY`
- [ ] All `FIREBASE_*` variables
- [ ] `COOKIE_DOMAIN=.wildmindai.com`
- [ ] `FRONTEND_ORIGIN` and `ALLOWED_ORIGINS`
- [ ] All API keys (BFL, FAL, Replicate, etc.)

## 📝 **Files to Reference**

1. **`wild/env.example.production`** - Frontend production env template
2. **`api-gateway-services-wildmind/env.example.production`** - Backend production env template

## ⚠️ **Important Notes**

1. **No Fallbacks**: The code now has NO hardcoded fallbacks. If variables are missing, the app will fail.

2. **NEXT_PUBLIC_ Prefix**: Frontend variables MUST start with `NEXT_PUBLIC_` to be accessible in the browser.

3. **Set in Deployment Platform**: 
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Render: Environment → Environment Variables

4. **Both Frontend AND Backend**: You need to set environment variables for BOTH:
   - Frontend (wild) - for browser/client-side
   - Backend (api-gateway-services-wildmind) - for server-side

