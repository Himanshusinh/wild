export interface AuthUser {
  uid: string;
  email?: string;
  username?: string;
  photoURL?: string;
  displayName?: string;
  provider?: string;
  credits?: number;
  plan?: string;
  roles?: string[];
  metadata?: Record<string, any>;
}

export interface AuthSessionInfo {
  token?: string;
  createdAt?: number;
  expiresAt?: number;
  lastVerifiedAt?: number;
}

declare global {
  interface Window {
    __AUTH_DEBUG__?: boolean;
  }
}

export {};

