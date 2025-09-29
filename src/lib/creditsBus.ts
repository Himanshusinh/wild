export const CREDITS_REFRESH_EVENT = 'credits:refresh';

export function requestCreditsRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CREDITS_REFRESH_EVENT));
  }
}

export function onCreditsRefresh(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => listener();
  window.addEventListener(CREDITS_REFRESH_EVENT, handler);
  return () => window.removeEventListener(CREDITS_REFRESH_EVENT, handler);
}


