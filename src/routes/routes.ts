// Authentication Routes
export const AUTH_ROUTES = {
  SIGN_IN: '/view/signin',
  SIGN_UP: '/view/signup',
  FORGOT_PASSWORD: '/view/forgot-password',
} as const;

// Main Application Routes
export const APP_ROUTES = {
  HOME: '/view/HomePage',
  LANDING: '/',
  SIGNUP:'/view/signup',
  LOGIN: '/view/signup', // Login uses the same page with different form state
  ACCOUNT_MANAGEMENT: '/view/account-management'
} as const;

// Feature Routes
export const FEATURE_ROUTES = {
  IMAGE_GENERATION: '/text-to-image',
  VIDEO_GENERATION: '/text-to-video',
  SKETCH_TO_IMAGE: '/text-to-image', // Legacy path now points to the live text-to-image experience
  REAL_TIME_GENERATION: '/text-to-video', // Reuse the closest available live route
} as const;

// Image Generation Features (Text to Image, Image to Image, Logo, Sticker)
export const IMAGEGENERATION = {
  TEXT_TO_IMAGE: '/text-to-image',
  IMAGE_TO_IMAGE: '/image-to-image', // Should use same ImageGeneration component
  LOGO_GENERATION: '/logo-generation',
  STICKER_GENERATION: '/sticker-generation',
  INPAINT_FLUX_API: '/inpaint-fluxapi'
} as const;

// Video Generation Features (Text to Video, Image to Video)
export const VIDEOGENERATION = {
  TEXT_TO_VIDEO: '/text-to-video',
  IMAGE_TO_VIDEO: '/image-to-video', // Should use same VideoGeneration component
} as const;

// Music Generation Features (Text to Music)
export const MUSICGENERATION = {
  TEXT_TO_MUSIC: '/text-to-music',
} as const;

// Branding Kit Features (Product, Logo, Mockup, etc.)
export const BRANDINGKIT = {
  PRODUCT_GENERATION: '/product-generation',
  LOGO_GENERATION: '/logo-generation', // Uses ImageGeneration component
  MOCKUP_GENERATION: '/mockup-generation',
  PRODUCT_WITH_MODEL_POSE: '/product-generation', // Same as product generation
  AD_GENERATION: '/ad-generation',
} as const;

// Navigation Routes
export const NAV_ROUTES = {
  TEMPLATES: '/view/workflows',
  ART_STATION: '/view/ArtStation',
  PRICING: '/view/pricing',
  BLOG: '/view/Landingpage',
  CONTACT: '/view/Landingpage?section=contact',
  SUPPORT: '/view/Landingpage?section=support',
  ABOUT: '/view/Landingpage?section=about',
  BOOKMARK:'/bookmarks',
  LANDING:'/view/Landingpage',
  LIVE_CHAT: '/view/Generation/wildmindskit/LiveChat',
  ACCOUNT_MANAGEMENT: '/view/account-management',
  WORKFLOWS: '/view/workflows',
} as const;

// Legal Routes
export const LEGAL_ROUTES = {
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  COOKIES: '/legal/cookie',
  LEGAL_NOTICE: '/legal',
  DMCA: '/legal/dmca',
  AUP: '/legal/aup',
  API_TERMS: '/legal/api-terms',
  RELATIONSHIP: '/legal/relationship',
  THIRD_PARTY: '/legal/thirdparty',
} as const;

// Footer Navigation Links
export const FOOTER_NAV_LINKS = {
  HOME: {
    FEATURES: '/features',
    TEMPLATES: NAV_ROUTES.TEMPLATES,
    ART_STATION: NAV_ROUTES.ART_STATION,
    PRICING: NAV_ROUTES.PRICING,
  },
  FEATURES: {
    TEXT_TO_IMAGE: FEATURE_ROUTES.IMAGE_GENERATION,
    TEXT_TO_VIDEO: FEATURE_ROUTES.VIDEO_GENERATION,
    SKETCH_TO_IMAGE: FEATURE_ROUTES.SKETCH_TO_IMAGE,
    REAL_TIME_GENERATION: FEATURE_ROUTES.REAL_TIME_GENERATION,
  },
  COMPANY: {
    BLOG: NAV_ROUTES.BLOG,
    CONTACT: NAV_ROUTES.CONTACT,
    SUPPORT: NAV_ROUTES.SUPPORT,
    ABOUT: NAV_ROUTES.ABOUT,
  },
} as const;

// Social Media Links
export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://www.instagram.com/wildmindai_/',
  FACEBOOK: 'https://www.facebook.com/profile.php?id=61577831188341',
  X: 'https://x.com/WildMind_AI',
  YOUTUBE: 'https://www.youtube.com/@Wild-Mind-2025',
  THREADS: 'https://www.threads.com/@wildmindai_',
  LINKEDIN: 'https://www.linkedin.com/company/wild-mind-ai/?viewAsMember=true',
} as const;

// Type for route parameters
export type RouteParams = {
  [key: string]: string | number;
};

// Helper function to generate dynamic routes
export const generateRoute = (route: string, params?: RouteParams): string => {
  if (!params) return route;
  
  let generatedRoute = route;
  Object.entries(params).forEach(([key, value]) => {
    generatedRoute = generatedRoute.replace(`:${key}`, String(value));
  });
  
  return generatedRoute;
};

// Export all routes as a single object for easy access
export const ROUTES = {
  ...AUTH_ROUTES,
  ...APP_ROUTES,
  ...FEATURE_ROUTES,
  ...NAV_ROUTES,
  ...LEGAL_ROUTES,
  ...IMAGEGENERATION,
  ...BRANDINGKIT,
  ...VIDEOGENERATION,
  ...MUSICGENERATION,
} as const;