/**
 * TypeScript type definitions for authentication
 */

export interface AuthUser {
  uid: string;
  email?: string;
  username?: string;
  photoURL?: string;
  displayName?: string;
  provider?: string;
  credits?: number;
  plan?: string;
  planCode?: string;
  canTogglePublicGenerations?: boolean;
  forcePublicGenerations?: boolean;
}

export interface SessionInfo {
  uid: string;
  exp?: number;
  issuedAt?: number;
  userAgent?: string;
  ip?: string;
}

export interface LogoutOptions {
  redirectTo?: string;
  clearLocalStorage?: boolean;
  clearCookies?: boolean;
  signOutFirebase?: boolean;
}

