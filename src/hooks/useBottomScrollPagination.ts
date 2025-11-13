import { useEffect, useRef } from 'react';

interface UseBottomScrollPaginationArgs {
  containerRef?: React.RefObject<HTMLElement | null>;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
  bottomOffset?: number; // distance from bottom to trigger
  throttleMs?: number; // minimal interval between triggers
  requireUserScroll?: boolean; // gate until user actually scrolls
  enabled?: boolean; // allow runtime disable
  /** After a loadMore completes, require an actual scroll movement before allowing another */
  requireScrollAfterLoad?: boolean;
  /** Cooldown window after a loadMore call during which further triggers are suppressed */
  postLoadCooldownMs?: number;
  /** External boolean ref to hard block load triggers (e.g. generation in progress) */
  blockLoadRef?: React.RefObject<boolean>;
}

/**
 * Reusable scroll-bottom pagination logic mirroring the working History page behavior.
 * Attaches listeners to both the container (if provided) and window to stay robust
 * against layout shifts. Triggers when within bottomOffset px of the bottom, with
 * a throttle and guards (hasMore, loading, localBusy).
 */
export function useBottomScrollPagination({
  containerRef,
  hasMore,
  loading,
  loadMore,
  bottomOffset = 800,
  throttleMs = 200,
  requireUserScroll = true,
  enabled = true,
  requireScrollAfterLoad = false,
  postLoadCooldownMs = 0,
  blockLoadRef,
}: UseBottomScrollPaginationArgs) {
  const busyRef = useRef(false);
  const lastTriggerRef = useRef(0);
  const userScrolledRef = useRef(false);
  const awaitingUserScrollRef = useRef(false);
  const postLoadCooldownUntilRef = useRef(0);
  const lastScrollPosRef = useRef<{ container: number; window: number }>({ container: 0, window: 0 });

  useEffect(() => {
    if (!enabled) return;
    const containerEl = containerRef?.current || null;

    const performLoadMore = (source: 'container' | 'window') => {
      try {
        const now = Date.now();
        if (blockLoadRef?.current) return; // external hard block
        if (now < postLoadCooldownUntilRef.current) return; // post-load cooldown
        if (awaitingUserScrollRef.current) return; // waiting for user movement after last load
        if (now - lastTriggerRef.current < throttleMs) return; // throttle bursts
        if (!hasMore || loading || busyRef.current) return;
        busyRef.current = true;
        lastTriggerRef.current = now;
        loadMore()
          .catch(() => { /* swallow */ })
          .finally(() => {
            busyRef.current = false;
            // Enter post-load cooldown & scroll requirement states
            if (postLoadCooldownMs > 0) {
              postLoadCooldownUntilRef.current = Date.now() + postLoadCooldownMs;
            }
            if (requireScrollAfterLoad) {
              awaitingUserScrollRef.current = true;
            }
          });
      } catch { /* silent */ }
    };

    const handleContainerScroll = () => {
      if (!containerEl) return;
      if (requireUserScroll && !userScrolledRef.current && containerEl.scrollTop > 0) {
        userScrolledRef.current = true;
      }
      if (requireUserScroll && !userScrolledRef.current) return;
      // Detect user movement to clear awaiting scroll requirement
      if (awaitingUserScrollRef.current) {
        const last = lastScrollPosRef.current.container;
        if (Math.abs(containerEl.scrollTop - last) > 4) {
          awaitingUserScrollRef.current = false;
        }
        lastScrollPosRef.current.container = containerEl.scrollTop;
      }
      const remaining = containerEl.scrollHeight - containerEl.scrollTop - containerEl.clientHeight;
      if (remaining <= bottomOffset) performLoadMore('container');
    };

    const handleWindowScroll = () => {
      if (requireUserScroll && !userScrolledRef.current && window.scrollY > 0) {
        userScrolledRef.current = true;
      }
      if (requireUserScroll && !userScrolledRef.current) return;
      // Detect user movement for window scroll to clear awaiting scroll requirement
      if (awaitingUserScrollRef.current) {
        const last = lastScrollPosRef.current.window;
        if (Math.abs(window.scrollY - last) > 4) {
          awaitingUserScrollRef.current = false;
        }
        lastScrollPosRef.current.window = window.scrollY;
      }
      const winBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      if (docHeight - winBottom <= bottomOffset) performLoadMore('window');
    };

    // Attach listeners (both) for robustness
    if (containerEl) {
      try { containerEl.addEventListener('scroll', handleContainerScroll as any, { passive: true } as any); } catch {}
    }
    window.addEventListener('scroll', handleWindowScroll as any, { passive: true } as any);
    window.addEventListener('wheel', handleWindowScroll as any, { passive: true } as any);
    window.addEventListener('touchmove', handleWindowScroll as any, { passive: true } as any);

    return () => {
      if (containerEl) {
        try { containerEl.removeEventListener('scroll', handleContainerScroll as any); } catch {}
      }
      window.removeEventListener('scroll', handleWindowScroll as any);
      window.removeEventListener('wheel', handleWindowScroll as any);
      window.removeEventListener('touchmove', handleWindowScroll as any);
    };
  }, [containerRef, hasMore, loading, loadMore, bottomOffset, throttleMs, requireUserScroll, enabled]);

  return { userScrolledRef, awaitingUserScrollRef };
}

export default useBottomScrollPagination;
