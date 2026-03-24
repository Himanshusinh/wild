"use client";

export type CanvasInvitationStatus = 'pending' | 'accepted' | 'dismissed';

export interface CanvasProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  recipientEmail: string;
  recipientUsername: string;
  senderEmail?: string;
  senderUsername?: string;
  createdAt: number;
  status: CanvasInvitationStatus;
}

const STORAGE_KEY = 'wm_canvas_project_invitations';
const COOKIE_KEY = 'wm_canvas_project_invitations';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getCookieDomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  const { hostname } = window.location;
  if (hostname === 'wildmindai.com' || hostname.endsWith('.wildmindai.com')) {
    return '.wildmindai.com';
  }
  return null;
};

const serializeInvitations = (invitations: CanvasProjectInvitation[]) => encodeURIComponent(JSON.stringify(invitations));

const parseInvitations = (raw: string | null): CanvasProjectInvitation[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readFromLocalStorage = (): CanvasProjectInvitation[] => {
  if (typeof window === 'undefined') return [];
  try {
    return parseInvitations(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
};

const readFromCookie = (): CanvasProjectInvitation[] => {
  if (typeof document === 'undefined') return [];
  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${COOKIE_KEY}=`));
  if (!match) return [];
  const [, value = ''] = match.split('=');
  try {
    return parseInvitations(decodeURIComponent(value));
  } catch {
    return [];
  }
};

const dedupeInvitations = (invitations: CanvasProjectInvitation[]) => {
  const map = new Map<string, CanvasProjectInvitation>();
  invitations.forEach((invitation) => {
    if (!invitation?.id) return;
    map.set(invitation.id, invitation);
  });
  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
};

export const readAllCanvasInvitations = (): CanvasProjectInvitation[] =>
  dedupeInvitations([...readFromCookie(), ...readFromLocalStorage()]);

export const writeAllCanvasInvitations = (invitations: CanvasProjectInvitation[]) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invitations));
    } catch {}
  }

  if (typeof document !== 'undefined') {
    const domain = getCookieDomain();
    const parts = [
      `${COOKIE_KEY}=${serializeInvitations(invitations)}`,
      'Path=/',
      'Max-Age=31536000',
      'SameSite=Lax',
    ];
    if (domain) parts.push(`Domain=${domain}`);
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      parts.push('Secure');
    }
    document.cookie = parts.join('; ');
  }
};

export const getCanvasInvitationsForEmail = (email: string): CanvasProjectInvitation[] => {
  const normalizedEmail = normalizeEmail(email);
  return readAllCanvasInvitations().filter((invitation) => normalizeEmail(invitation.recipientEmail) === normalizedEmail);
};

export const updateCanvasInvitationStatus = (
  email: string,
  invitationId: string,
  status: CanvasInvitationStatus
): CanvasProjectInvitation | null => {
  const normalizedEmail = normalizeEmail(email);
  let updatedInvitation: CanvasProjectInvitation | null = null;

  const next = readAllCanvasInvitations().map((invitation) => {
    if (invitation.id === invitationId && normalizeEmail(invitation.recipientEmail) === normalizedEmail) {
      updatedInvitation = { ...invitation, status };
      return updatedInvitation;
    }
    return invitation;
  });

  writeAllCanvasInvitations(next);
  return updatedInvitation;
};
