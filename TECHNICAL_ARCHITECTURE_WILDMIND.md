# WildMind Frontend - Technical Architecture & Dataflow Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Application Structure](#application-structure)
5. [State Management](#state-management)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Authentication Flow](#authentication-flow)
8. [Generation Flow](#generation-flow)
9. [API Integration](#api-integration)
10. [Routing & Navigation](#routing--navigation)
11. [Storage & Caching](#storage--caching)
12. [UI Components](#ui-components)
13. [Security](#security)
14. [Performance Optimizations](#performance-optimizations)
15. [Deployment](#deployment)

---

## Overview

WildMind is a Next.js 15-based frontend application that provides a unified interface for AI-powered image, video, and music generation. It integrates with multiple AI providers (BFL, Replicate, Runway, MiniMax, FAL) through a centralized API Gateway backend.

### Key Responsibilities
- **User Interface**: Modern, responsive UI for generation workflows
- **State Management**: Redux Toolkit for global state
- **Authentication**: Firebase Auth with session cookie management
- **Credit Management**: Real-time credit balance tracking and validation
- **Generation Management**: Handle image, video, and music generation requests
- **History & Bookmarks**: Track and manage user generations
- **File Upload**: Handle image/video uploads to Firebase Storage
- **API Communication**: Centralized axios client with interceptors

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Browser                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js 15 Application                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Pages      │→ │  Components  │→ │   Redux      │  │   │
│  │  │  (App Router)│  │  (React 19)  │  │   Store      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │         │                  │                  │           │   │
│  │         ▼                  ▼                  ▼           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Services    │  │   Firebase   │  │   Axios      │  │   │
│  │  │   (lib/)     │  │   (Auth/DB)  │  │   Client     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS
                             │ CORS + Cookies
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway Services (Backend)                      │
│  https://api-gateway-services-wildmind.onrender.com             │
└────────────────────────────┬──────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Firebase    │    │    Redis     │    │    Zata      │
│  (Auth + DB) │    │   (Cache)    │    │   (Storage)  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Component Hierarchy

```
RootLayout
├── ReduxProvider
│   └── AuthBootstrap
│       └── App
│           ├── LandingPage (Public)
│           ├── HomePage (Protected)
│           │   └── MainLayout
│           │       ├── Nav
│           │       ├── SidePannelFeatures
│           │       └── PageRouter
│           │           ├── TextToImage
│           │           ├── TextToVideo
│           │           ├── TextToMusic
│           │           ├── History
│           │           └── Bookmarks
│           └── Signup/Login Pages
└── Toaster (React Hot Toast)
```

---

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15.4.7 (App Router)
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit 2.8.2
- **HTTP Client**: Axios 1.12.2
- **Authentication**: Firebase 12.1.0
- **Notifications**: React Hot Toast 2.6.0
- **Icons**: Lucide React 0.540.0, Tabler Icons 3.34.1

### Key Dependencies
- **Animation**: GSAP 3.13.0, Motion 12.23.12
- **3D Graphics**: OGL 1.0.11
- **AI SDKs**: 
  - Replicate SDK 1.2.0
  - FAL Client 1.6.2
  - OpenAI SDK 5.23.2
- **Utilities**: 
  - clsx 2.1.1 (class names)
  - tailwind-merge 3.3.1
  - dotted-map 2.2.3

---

## Application Structure

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (MainPages)/              # Route groups
│   │   ├── text-to-image/        # Image generation page
│   │   ├── text-to-video/        # Video generation page
│   │   ├── text-to-music/        # Music generation page
│   │   ├── logo-generation/      # Logo generation page
│   │   ├── sticker-generation/   # Sticker generation page
│   │   ├── product-generation/   # Product generation page
│   │   ├── mockup-generation/    # Mockup generation page
│   │   └── ad-generation/        # Ad generation page
│   ├── api/                      # Next.js API routes (proxies)
│   │   ├── auth/                 # Auth proxy routes
│   │   ├── fal/                  # FAL proxy routes
│   │   ├── local/                 # Local processing routes
│   │   └── proxy/                 # Generic proxy routes
│   ├── view/                      # Main application views
│   │   ├── Landingpage/           # Landing page
│   │   ├── HomePage/              # Home page
│   │   ├── Generation/            # Generation features
│   │   │   ├── Core/              # Core components (Nav, SidePanel, etc.)
│   │   │   ├── ImageGeneration/   # Image generation features
│   │   │   ├── VideoGeneration/    # Video generation features
│   │   │   ├── MusicGeneration/   # Music generation features
│   │   │   ├── ProductGeneration/ # Product generation
│   │   │   ├── MockupGeneation/   # Mockup generation
│   │   │   └── AdGeneration/      # Ad generation
│   │   ├── account-management/    # Account settings
│   │   ├── pricing/               # Pricing page
│   │   ├── signup/                # Signup page
│   │   └── workflows/              # Workflows page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                    # Root page
│   ├── middleware.ts               # Next.js middleware (auth protection)
│   └── globals.css                 # Global styles
├── components/                     # Reusable components
│   ├── providers/                  # Context providers
│   │   ├── ReduxProvider.tsx       # Redux store provider
│   │   └── AuthBootstrap.tsx      # Auth initialization
│   ├── ui/                         # UI components
│   │   ├── Button.tsx
│   │   ├── CreditsDisplay.tsx
│   │   ├── FilterPopover.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── NotificationToast.tsx
│   └── media/                      # Media components
│       └── SmartImage.tsx
├── store/                          # Redux store
│   ├── index.ts                    # Store configuration
│   ├── hooks.ts                    # Typed Redux hooks
│   └── slices/                     # Redux slices
│       ├── authSlice.ts           # Authentication state
│       ├── creditsSlice.ts        # Credits state
│       ├── generationSlice.ts     # Generation state
│       ├── historySlice.ts        # History state
│       ├── bookmarksSlice.ts      # Bookmarks state
│       ├── uiSlice.ts             # UI state
│       └── generationsApi.ts     # Generation API thunks
├── lib/                            # Services and utilities
│   ├── axiosInstance.ts           # Axios client with interceptors
│   ├── firebase.ts                 # Firebase initialization
│   ├── me.ts                       # User data caching
│   ├── creditsBus.ts              # Credit update event bus
│   ├── imageUpload.ts             # Image upload to Firebase
│   ├── videoUpload.ts             # Video upload to Firebase
│   ├── audioUpload.ts             # Audio upload to Firebase
│   ├── historyService.ts          # History management
│   ├── minimaxService.ts          # MiniMax integration
│   ├── runwayService.ts           # Runway integration
│   └── promptCompiler.ts          # Prompt compilation utilities
├── hooks/                          # Custom React hooks
│   └── useCredits.ts              # Credits hook
├── types/                          # TypeScript types
│   ├── generation.ts              # Generation types
│   ├── history.ts                 # History types
│   ├── videoGeneration.ts         # Video generation types
│   └── backendPrompt.ts           # Backend prompt types
├── utils/                          # Utility functions
│   ├── modelMapping.ts            # Model name mapping
│   ├── modelDisplayNames.ts       # Model display names
│   ├── modelCredits.ts            # Model credit costs
│   ├── creditDistribution.ts      # Credit distribution rules
│   └── downloadUtils.ts           # Download utilities
└── routes/                         # Route definitions
    ├── routes.ts                  # Main routes
    └── imageroute.ts              # Image routes
```

---

## State Management

### Redux Store Structure

The application uses **Redux Toolkit** for centralized state management:

```typescript
Store {
  ui: {
    currentView: 'landing' | 'generation' | 'history' | 'bookmarks',
    currentGenerationType: 'text-to-image' | 'text-to-video' | 'text-to-music' | ...,
    // UI state
  },
  auth: {
    user: AuthUser | null,
    loading: boolean,
    error: string | null,
  },
  credits: {
    credits: { creditBalance: number, planCode: string },
    transactions: CreditTransaction[],
    loading: boolean,
    error: string | null,
    lastValidation: CreditValidation | null,
  },
  generation: {
    // Current generation state
    prompt: string,
    model: string,
    images: GeneratedImage[],
    // ...
  },
  history: {
    entries: HistoryEntry[],
    loading: boolean,
    error: string | null,
  },
  bookmarks: {
    items: BookmarkedItem[],
    loading: boolean,
  },
}
```

### Redux Slices

1. **authSlice** (`store/slices/authSlice.ts`)
   - Manages user authentication state
   - Actions: `fetchMe`, `loginWithEmail`, `createSessionFromIdToken`, `logout`
   - State: `user`, `loading`, `error`

2. **creditsSlice** (`store/slices/creditsSlice.ts`)
   - Manages credit balance and transactions
   - Actions: `fetchUserCredits`, `validateCreditRequirement`, `reserveCredits`, `syncCreditsWithBackend`
   - Optimistic updates: `deductCreditsOptimistic`, `rollbackCreditsOptimistic`

3. **generationSlice** (`store/slices/generationSlice.ts`)
   - Manages current generation state
   - Actions: `setPrompt`, `setModel`, `addImage`, `clearGenerationState`

4. **historySlice** (`store/slices/historySlice.ts`)
   - Manages generation history
   - Actions: `addHistoryEntry`, `updateHistoryEntry`, `deleteHistoryEntry`

5. **bookmarksSlice** (`store/slices/bookmarksSlice.ts`)
   - Manages bookmarked generations
   - Actions: `addBookmark`, `removeBookmark`, `toggleBookmark`

6. **uiSlice** (`store/slices/uiSlice.ts`)
   - Manages UI state (current view, generation type, etc.)
   - Actions: `setCurrentView`, `setCurrentGenerationType`

7. **generationsApi** (`store/slices/generationsApi.ts`)
   - Async thunks for generation API calls
   - Thunks: `bflGenerate`, `runwayGenerate`, `minimaxGenerate`, `minimaxMusic`, `listGenerations`

---

## Data Flow Patterns

### 1. **Authentication Flow**

```
User Action (Login/Signup)
    │
    ▼
[Firebase Auth]
    │
    ├─→ [Email/Password] → Firebase signInWithEmailAndPassword
    ├─→ [Google OAuth] → Firebase signInWithPopup
    └─→ [Email OTP] → Firebase sendSignInLinkToEmail
    │
    ▼
[Get ID Token] → auth.currentUser.getIdToken()
    │
    ▼
[Create Session] → POST /api/auth/session
    │
    ├─→ [Backend] → Creates session cookie (app_session)
    │
    └─→ [Response] → Sets cookie with domain=.wildmindai.com
    │
    ▼
[Fetch User] → GET /api/auth/me
    │
    ├─→ [Backend] → Verifies session cookie, returns user data
    │
    └─→ [Redux] → dispatch(setUser(user))
    │
    ▼
[Initialize Credits] → GET /api/credits/me
    │
    └─→ [Redux] → dispatch(fetchUserCredits())
    │
    ▼
[Update UI] → User authenticated, credits loaded
```

### 2. **Generation Request Flow**

```
User Input (Prompt, Model, Parameters)
    │
    ▼
[Validate Credits] → dispatch(validateCreditRequirement({ requiredCredits, modelName }))
    │
    ├─→ [Check Balance] → Redux state: credits.credits.creditBalance
    │
    ├─→ [Insufficient] → Show error, prevent generation
    │
    └─→ [Sufficient] → Continue
    │
    ▼
[Optimistic Update] → dispatch(deductCreditsOptimistic(cost))
    │
    ▼
[Start Generation] → dispatch(bflGenerate({ prompt, model, ... }))
    │
    ├─→ [Axios Interceptor] → Attach Authorization header
    │
    ├─→ [API Gateway] → POST /api/bfl/generate
    │   │
    │   ├─→ [Backend] → Validates credits, calls BFL API
    │   │
    │   └─→ [Response] → Returns generation result
    │
    ├─→ [Success] → 
    │   │
    │   ├─→ [Update Redux] → dispatch(addImage(result))
    │   │
    │   ├─→ [Upload to Firebase] → uploadGeneratedImage(image)
    │   │
    │   ├─→ [Save to History] → dispatch(addHistoryEntry(entry))
    │   │
    │   └─→ [Sync Credits] → dispatch(syncCreditsWithBackend())
    │
    └─→ [Failure] →
        │
        ├─→ [Rollback Credits] → dispatch(rollbackCreditsOptimistic(cost))
        │
        └─→ [Show Error] → toast.error(error.message)
```

### 3. **Credit Management Flow**

```
Credit Balance Check
    │
    ▼
[Fetch Credits] → dispatch(fetchUserCredits())
    │
    ├─→ [Try /api/credits/me] → Primary endpoint
    │   │
    │   └─→ [Success] → Update Redux state
    │
    └─→ [Fallback /api/auth/me] → If credits endpoint fails
        │
        └─→ [Extract credits] → From user object
    │
    ▼
[Update UI] → CreditsDisplay component shows balance
    │
    ▼
[Credit Bus] → onCreditsRefresh event
    │
    └─→ [Refresh Credits] → Automatically refetch on credit changes
```

### 4. **File Upload Flow**

```
User Uploads Image/Video
    │
    ▼
[File Selection] → <input type="file">
    │
    ▼
[Create Preview] → URL.createObjectURL(file)
    │
    ▼
[Upload to Firebase Storage] → uploadBytes(ref, file)
    │
    ├─→ [Storage Path] → generated-images/{fileName}
    │
    ├─→ [Get Download URL] → getDownloadURL(ref)
    │
    └─→ [Update State] → Set uploadedImages array
    │
    ▼
[Use in Generation] → Include in generation request
```

---

## Authentication Flow

### Authentication Methods

1. **Email/Password**
   - Firebase `signInWithEmailAndPassword`
   - Creates Firebase ID token
   - Exchanges for session cookie

2. **Google OAuth**
   - Firebase `signInWithPopup`
   - Google OAuth flow
   - Creates Firebase ID token
   - Exchanges for session cookie

3. **Email OTP (Magic Link)**
   - Firebase `sendSignInLinkToEmail`
   - User clicks link in email
   - Creates Firebase ID token
   - Exchanges for session cookie

### Session Management

- **Session Cookie**: `app_session` (domain: `.wildmindai.com` for cross-subdomain)
- **Cookie Attributes**:
  - `SameSite=None` (production), `Lax` (development)
  - `Secure=true` (production)
  - `HttpOnly=true` (set by backend)
- **Token Storage**: Firebase ID token in localStorage (fallback)
- **Session Creation**: `POST /api/auth/session` with ID token
- **Session Validation**: Automatic via axios interceptor

### Auth Bootstrap

`AuthBootstrap` component runs on app mount:
1. Calls `getMeCached()` to fetch user data
2. Stores in Redux via `dispatch(setUser(me))`
3. Warms cache for subsequent pages

### Middleware Protection

Next.js middleware (`middleware.ts`) protects routes:
- **Public Routes**: `/view/Landingpage`, `/view/signup`, `/view/pricing`
- **Protected Routes**: All other routes require `app_session` cookie
- **Redirect**: Unauthenticated users → `/view/signup?next={pathname}`

---

## Generation Flow

### Image Generation (BFL/Replicate/MiniMax)

```
1. User Input
   ├─→ Prompt text
   ├─→ Model selection
   ├─→ Frame size
   ├─→ Number of images (n)
   ├─→ Style options
   └─→ Reference images (optional)

2. Credit Validation
   ├─→ Calculate cost (modelCredits.ts)
   ├─→ Check balance
   └─→ Show error if insufficient

3. Optimistic Update
   ├─→ Deduct credits in Redux
   └─→ Update UI immediately

4. API Call
   ├─→ POST /api/bfl/generate (or /api/replicate/generate, /api/minimax/generate)
   ├─→ Backend validates credits
   ├─→ Backend calls AI provider
   └─→ Returns generation result

5. Success Handling
   ├─→ Upload images to Firebase Storage
   ├─→ Add to Redux state
   ├─→ Save to history
   ├─→ Sync credits with backend
   └─→ Show success notification

6. Error Handling
   ├─→ Rollback optimistic credit deduction
   ├─→ Show error notification
   └─→ Log error for debugging
```

### Video Generation (Runway/Replicate)

```
1. User Input
   ├─→ Prompt text
   ├─→ Model selection (Runway Gen4, Kling, WAN, etc.)
   ├─→ Duration
   ├─→ Resolution
   ├─→ Quality settings
   └─→ Reference image (optional)

2. Submit Job
   ├─→ POST /api/runway/video (or /api/replicate/wan-2-5-t2v/submit)
   ├─→ Returns requestId/jobId
   └─→ Store in Redux

3. Poll Status
   ├─→ GET /api/runway/status/{taskId}
   ├─→ Check status: "submitted" | "processing" | "completed" | "failed"
   └─→ Update UI with progress

4. Get Result
   ├─→ GET /api/runway/result/{taskId} (or /api/replicate/queue/result)
   ├─→ Returns video URL
   ├─→ Upload to Firebase Storage
   └─→ Save to history
```

### Music Generation (MiniMax)

```
1. User Input
   ├─→ Prompt text
   ├─→ Duration
   └─→ Style preferences

2. API Call
   ├─→ POST /api/minimax/music
   ├─→ Backend calls MiniMax API
   └─→ Returns audio URL

3. Success Handling
   ├─→ Upload audio to Firebase Storage
   ├─→ Add to Redux state
   └─→ Save to history
```

---

## API Integration

### Axios Client Configuration

**Location**: `lib/axiosInstance.ts`

**Features**:
- **Base URL**: `https://api-gateway-services-wildmind.onrender.com`
- **Credentials**: `withCredentials: true` (sends cookies)
- **Request Interceptor**:
  - Attaches `Authorization: Bearer {token}` header
  - Adds device headers (`X-Device-Id`, `X-Device-Name`, `X-Device-Info`)
  - Handles auth hint cookie delays
  - Routes auth endpoints directly to backend
- **Response Interceptor**:
  - Handles 401 errors
  - Refreshes ID token
  - Retries request with new token
  - Creates session cookie as fallback (throttled)

### API Endpoints Used

**Authentication**:
- `POST /api/auth/session` - Create session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Logout

**Credits**:
- `GET /api/credits/me` - Get credit balance

**Generations**:
- `POST /api/bfl/generate` - BFL image generation
- `POST /api/replicate/generate` - Replicate image generation
- `POST /api/replicate/wan-2-5-t2v/submit` - WAN video generation
- `POST /api/replicate/kling-t2v/submit` - Kling video generation
- `GET /api/replicate/queue/status` - Get job status
- `GET /api/replicate/queue/result` - Get job result
- `POST /api/runway/generate` - Runway image generation
- `POST /api/runway/video` - Runway video generation
- `GET /api/runway/status/{taskId}` - Runway job status
- `POST /api/minimax/generate` - MiniMax image generation
- `POST /api/minimax/music` - MiniMax music generation
- `GET /api/generations` - List generations

---

## Routing & Navigation

### Next.js App Router

**File-based routing**:
- `app/page.tsx` → `/` (root)
- `app/view/Landingpage/page.tsx` → `/view/Landingpage`
- `app/view/HomePage/page.tsx` → `/view/HomePage`
- `app/(MainPages)/text-to-image/page.tsx` → `/text-to-image`
- `app/(MainPages)/text-to-video/page.tsx` → `/text-to-video`
- `app/(MainPages)/text-to-music/page.tsx` → `/text-to-music`

### Route Protection

**Middleware** (`middleware.ts`):
- Checks for `app_session` cookie
- Allows `auth_hint` cookie as temporary bypass
- Redirects unauthenticated users to `/view/signup?next={pathname}`

### Navigation Flow

```
Landing Page (Public)
    │
    ├─→ Signup/Login
    │   │
    │   └─→ Home Page (Protected)
    │       │
    │       ├─→ Text-to-Image
    │       ├─→ Text-to-Video
    │       ├─→ Text-to-Music
    │       ├─→ History
    │       └─→ Bookmarks
    │
    └─→ Pricing (Public)
```

---

## Storage & Caching

### Firebase Storage

**Purpose**: Store generated images, videos, and audio files

**Upload Flow**:
1. Download from AI provider URL
2. Convert to Blob
3. Upload to Firebase Storage (`generated-images/{fileName}`)
4. Get download URL
5. Update Redux state with Firebase URL

**Utilities**:
- `lib/imageUpload.ts` - Image upload
- `lib/videoUpload.ts` - Video upload
- `lib/audioUpload.ts` - Audio upload

### Caching Strategy

1. **User Data Cache** (`lib/me.ts`):
   - **Memory Cache**: 120 seconds TTL
   - **Storage Cache**: sessionStorage/localStorage
   - **Deduplication**: In-flight request deduplication

2. **Redux State**:
   - Persistent across page navigation
   - Cleared on logout

3. **Firebase Auth**:
   - Token cached by Firebase SDK
   - Auto-refreshed when expired

---

## UI Components

### Core Components

1. **Nav** (`app/view/HomePage/compo/Nav.tsx`)
   - Top navigation bar
   - Profile dropdown
   - Credits display
   - Logout button

2. **SidePannelFeatures** (`app/view/Generation/Core/SidePannelFeatures.tsx`)
   - Side navigation panel
   - Feature categories
   - Canvas Studio link

3. **InputBox** (Generation components)
   - Prompt input
   - Model selection
   - Parameter controls
   - Generate button

4. **CreditsDisplay** (`components/ui/CreditsDisplay.tsx`)
   - Shows credit balance
   - Refresh button
   - Loading state

5. **NotificationToast** (`components/ui/NotificationToast.tsx`)
   - Toast notifications
   - Success/error states
   - Auto-dismiss

### Generation Components

**Image Generation**:
- `TextToImage.tsx` - Main component
- `InputBox.tsx` - Input controls
- `ModelsDropdown.tsx` - Model selection
- `FrameSizeDropdown.tsx` - Aspect ratio selection
- `ImageCountDropdown.tsx` - Number of images
- `ImagePreviewModal.tsx` - Preview modal

**Video Generation**:
- `TextToVideo.tsx` - Main component
- `VideoModelsDropdown.tsx` - Model selection
- `DurationDropdown.tsx` - Duration selection
- `ResolutionDropdown.tsx` - Resolution selection
- `VideoPreviewModal.tsx` - Preview modal

---

## Security

### Security Headers (Middleware)

- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` - Allow OAuth popups
- `Content-Security-Policy` - Restrict resource loading

### Authentication Security

- **Session Cookie**: HttpOnly, Secure (production)
- **Token Storage**: localStorage (fallback, not primary)
- **Token Refresh**: Automatic via Firebase SDK
- **CSRF Protection**: SameSite cookie attribute

### API Security

- **CORS**: Configured on backend
- **Credentials**: Cookies sent with requests
- **Authorization**: Bearer token in header
- **Device Tracking**: Device ID and info headers

---

## Performance Optimizations

### Code Splitting

- **Next.js Automatic**: Route-based code splitting
- **Dynamic Imports**: Lazy load heavy components
- **Image Optimization**: Next.js Image component

### State Management

- **Redux Toolkit**: Efficient state updates
- **Selectors**: Memoized selectors for derived state
- **Optimistic Updates**: Immediate UI feedback

### Caching

- **User Data**: 120-second TTL cache
- **Redux State**: Persistent across navigation
- **Firebase Auth**: Token caching and auto-refresh

### Network Optimization

- **Request Deduplication**: In-flight request deduplication
- **Batch Requests**: Group related API calls
- **Error Retry**: Automatic retry on 401 with token refresh

---

## Deployment

### Environment Variables

**Required**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_BASE_URL` (defaults to API Gateway URL)

**Optional**:
- `NEXT_PUBLIC_API_DEBUG` - Enable API debug logging

### Build & Deploy

```bash
# Development
npm run dev

# Production Build
npm run build

# Start Production Server
npm start
```

### Deployment Platforms

- **Vercel** (Recommended): Automatic deployments from Git
- **Other Platforms**: Build and deploy `out` directory

---

## Key Design Patterns

1. **Container/Presenter Pattern**: Separation of logic and UI
2. **Custom Hooks**: Reusable logic (useCredits, etc.)
3. **Redux Thunks**: Async action creators
4. **Optimistic Updates**: Immediate UI feedback
5. **Error Boundaries**: Graceful error handling
6. **Lazy Loading**: Code splitting for performance
7. **Memoization**: React.memo, useMemo, useCallback

---

## Future Considerations

1. **Service Worker**: Offline support, caching
2. **WebSocket**: Real-time generation updates
3. **Progressive Web App**: PWA features
4. **GraphQL**: Alternative to REST API
5. **React Query**: Alternative to Redux for server state
6. **Internationalization**: Multi-language support
7. **Accessibility**: ARIA labels, keyboard navigation

---

## Conclusion

The WildMind frontend provides a robust, scalable architecture for AI generation workflows. It leverages Next.js 15's App Router, Redux Toolkit for state management, and Firebase for authentication and storage. The architecture supports multiple AI providers, real-time credit management, and a seamless user experience with optimistic updates and error handling.

