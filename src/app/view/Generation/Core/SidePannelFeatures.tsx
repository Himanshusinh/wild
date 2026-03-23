"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CreditCard, GripVertical, History } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useCredits } from '@/hooks/useCredits';
import { APP_ROUTES, NAV_ROUTES } from '@/routes/routes';
import { ImagePopout } from './ImagePopout';
import { VideoPopout } from './VideoPopout';
import { AudioPopout } from './AudioPopout';
import { AppsPopout } from './AppsPopout';

interface IconProps {
  className?: string;
}

interface NavItemDef {
  id: string;
  label: string;
  url: string;
  popoutId?: string;
  getIsActive: (pathname: string | null) => boolean;
  renderIcon: (className?: string) => React.ReactElement;
}

const LogoSvg = () => (
  <svg viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-10">
    <line x1="8" y1="8" x2="8" y2="60" stroke="white" strokeWidth="9" strokeLinecap="round" />
    <polyline points="8,60 24,36 36,52" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="36" y1="52" x2="48" y2="16" stroke="white" strokeWidth="9" strokeLinecap="round" />
    <line x1="48" y1="16" x2="62" y2="52" stroke="white" strokeWidth="9" strokeLinecap="round" />
    <line x1="62" y1="52" x2="74" y2="28" stroke="white" strokeWidth="9" strokeLinecap="round" />
    <line x1="74" y1="28" x2="74" y2="64" stroke="white" strokeWidth="9" strokeLinecap="round" />
  </svg>
);

const HomeSvg = ({ className }: IconProps) => (
  <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none">
    <path d="M4.5 8.1L9.5 4l5 4.1V14a1 1 0 0 1-1 1h-2.9V11h-2.2v4H5.5a1 1 0 0 1-1-1V8.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AppsSvg = ({ className }: IconProps) => (
  <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none">
    <path d="M9.5 2.2l6.5 3.75v7.5l-6.5 3.75-6.5-3.75v-7.5L9.5 2.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const AudioSvg = ({ className }: IconProps) => (
  <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none">
    <path d="M7.5 14.5V6l8.5-2v8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5.5" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="14" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const ImageSvg = ({ className }: IconProps) => (
  <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none">
    <rect x="2" y="2" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2 13l4-4 3 3 2.5-2.5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6.5" cy="7" r="1.2" fill="currentColor" />
  </svg>
);

const StudioSvg = ({ className }: IconProps) => (
  <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none">
    <path d="M2 12.5l7.5 4 7.5-4M2 8.5l7.5 4 7.5-4M9.5 2.5L2 6.5l7.5 4 7.5-4-7.5-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const GenArtSvg = ({ className }: IconProps) => (
  <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none">
    <path d="M9.5 1.5v2.8M9.5 14.7v2.8M1.5 9.5h2.8M14.7 9.5h2.8M3.72 3.72l2 2M13.28 13.28l2 2M3.72 15.28l2-2M13.28 5.72l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="9.5" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const VideoSvg = ({ className }: IconProps) => (
  <svg className={className} width="19" height="19" viewBox="0 0 19 19" fill="none">
    <rect x="2" y="5" width="15" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5.5 5V3.5M9.5 5V3.5M13.5 5V3.5M5.5 16v-2M9.5 16v-2M13.5 16v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 8l3.5 1.5L8 11V8z" fill="currentColor" />
  </svg>
);

const DEFAULT_NAV_ITEMS: NavItemDef[] = [
  {
    id: 'home',
    label: 'Home',
    url: APP_ROUTES.HOME,
    getIsActive: (p) => p === APP_ROUTES.HOME || p === '/',
    renderIcon: (className) => <HomeSvg className={className} />,
  },
  {
    id: 'apps',
    label: 'Apps',
    url: NAV_ROUTES.WORKFLOWS,
    popoutId: 'apps',
    getIsActive: (p) => !!p?.includes('/view/workflows') || !!p?.includes('/workflows'),
    renderIcon: (className) => <AppsSvg className={className} />,
  },
  {
    id: 'audio',
    label: 'Audio',
    url: '/text-to-music',
    popoutId: 'audio',
    getIsActive: (p) => !!p?.includes('/text-to-music'),
    renderIcon: (className) => <AudioSvg className={className} />,
  },
  {
    id: 'image',
    label: 'Image',
    url: '/text-to-image',
    popoutId: 'image',
    getIsActive: (p) => !!p?.includes('/text-to-image'),
    renderIcon: (className) => <ImageSvg className={className} />,
  },
  {
    id: 'studio',
    label: 'Studio',
    url: '/canvas-projects',
    getIsActive: (p) => !!p?.includes('/canvas-projects'),
    renderIcon: (className) => <StudioSvg className={className} />,
  },
  {
    id: 'genart',
    label: 'Gen-Art',
    url: '/view/ArtStation',
    getIsActive: (p) => !!p?.includes('/ArtStation'),
    renderIcon: (className) => <GenArtSvg className={className} />,
  },
  {
    id: 'video',
    label: 'Video',
    url: '/text-to-video',
    popoutId: 'video',
    getIsActive: (p) => !!p?.includes('/text-to-video'),
    renderIcon: (className) => <VideoSvg className={className} />,
  },
  {
    id: 'pricing',
    label: 'Pricing',
    url: NAV_ROUTES.PRICING,
    getIsActive: (p) => !!p?.includes('/pricing'),
    renderIcon: () => <CreditCard size={19} strokeWidth={1.6} />,
  },
  {
    id: 'history',
    label: 'History',
    url: '/history',
    getIsActive: (p) => !!p?.includes('/history'),
    renderIcon: () => <History size={19} strokeWidth={1.6} />,
  },
];

const STORAGE_KEY = 'sidebar_item_order';
const DESKTOP_PRIMARY_ORDER = ['home', 'apps', 'audio', 'image', 'studio', 'genart', 'video'];
const DESKTOP_BOTTOM_ORDER = ['pricing', 'history'];
const MOBILE_ORDER = ['genart', 'image', 'video', 'audio', 'apps'];

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NAV_ITEMS.map((item) => item.id);
    const parsed: string[] = JSON.parse(raw);
    const merged = parsed.filter((id) => DEFAULT_NAV_ITEMS.some((item) => item.id === id));
    DEFAULT_NAV_ITEMS.forEach((item) => {
      if (!merged.includes(item.id)) merged.push(item.id);
    });
    return merged;
  } catch {
    return DEFAULT_NAV_ITEMS.map((item) => item.id);
  }
}

function saveOrder(order: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {}
}

function applyOrder(order: string[]): NavItemDef[] {
  return order.map((id) => DEFAULT_NAV_ITEMS.find((item) => item.id === id)).filter(Boolean) as NavItemDef[];
}

function pickByOrder(items: NavItemDef[], order: string[]) {
  return order.map((id) => items.find((item) => item.id === id)).filter(Boolean) as NavItemDef[];
}

const SidePannelFeatures = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [imgError, setImgError] = React.useState(false);
  const [activePopout, setActivePopout] = React.useState<string | null>(null);
  const [popoutAnchor, setPopoutAnchor] = React.useState<number>(0);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const userData = useAppSelector((state: any) => state?.auth?.user || null);
  const { creditBalance, credits, loading: creditsLoading, refreshCredits } = useCredits();

  const [order, setOrder] = React.useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_NAV_ITEMS.map((item) => item.id);
    return loadOrder();
  });

  const orderedItems = React.useMemo(() => applyOrder(order), [order]);
  const desktopPrimaryItems = React.useMemo(() => pickByOrder(orderedItems, DESKTOP_PRIMARY_ORDER), [orderedItems]);
  const desktopBottomItems = React.useMemo(() => pickByOrder(orderedItems, DESKTOP_BOTTOM_ORDER), [orderedItems]);
  const mobileItems = React.useMemo(() => pickByOrder(orderedItems, MOBILE_ORDER), [orderedItems]);

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [insertBeforeId, setInsertBeforeId] = React.useState<string | null>(null);
  const draggingIdRef = React.useRef<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnterItem = (id: string | null, e?: React.MouseEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPopoutAnchor(rect.top + rect.height / 2);
    }
    setActivePopout(id);
  };

  const handleMouseLeaveSidebar = () => {
    hoverTimeoutRef.current = setTimeout(() => setActivePopout(null), 150);
  };

  const nav = (url: string) => {
    router.push(url);
  };

  const computeInsertBeforeId = React.useCallback((clientY: number): string | null => {
    if (!listRef.current) return null;
    const itemEls = listRef.current.querySelectorAll<HTMLElement>('[data-navid]');
    for (const el of Array.from(itemEls)) {
      const id = el.dataset.navid;
      if (!id || id === draggingIdRef.current) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return id;
    }
    return null;
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>, item: NavItemDef) => {
    draggingIdRef.current = item.id;
    setDraggingId(item.id);

    const fullUrl = new URL(item.url, window.location.origin).toString();
    e.dataTransfer.setData('text/uri-list', fullUrl);
    e.dataTransfer.setData('text/plain', fullUrl);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingIdRef.current) return;
    e.dataTransfer.dropEffect = 'move';
    setInsertBeforeId(computeInsertBeforeId(e.clientY));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingIdRef.current) return;

    const fromId = draggingIdRef.current;
    const toBeforeId = computeInsertBeforeId(e.clientY);

    setOrder((prev) => {
      const next = prev.filter((id) => id !== fromId);
      if (toBeforeId === null) next.push(fromId);
      else {
        const toIdx = next.indexOf(toBeforeId);
        if (toIdx === -1) next.push(fromId);
        else next.splice(toIdx, 0, fromId);
      }
      saveOrder(next);
      return next;
    });

    setDraggingId(null);
    draggingIdRef.current = null;
    setInsertBeforeId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    draggingIdRef.current = null;
    setInsertBeforeId(null);
  };

  const isDragging = draggingId !== null;

  const renderNavItems = (items: NavItemDef[], compact = false) => {
    const result: React.ReactNode[] = [];
    const insertLine = (
      <div
        key="insert-line"
        className="mx-1 my-0.5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
        style={{ boxShadow: '0 0 6px 1px rgba(255,255,255,0.28)' }}
      />
    );

    for (const item of items) {
      if (isDragging && insertBeforeId === item.id && draggingId !== item.id) {
        result.push(insertLine);
      }

      const isActive = item.getIsActive(pathname);
      const isBeingDragged = draggingId === item.id;

      result.push(
        <a
          href={item.url}
          key={item.id}
          data-navid={item.id}
          draggable={compact}
          onDragStart={compact ? (e) => handleDragStart(e, item) : undefined}
          onDragEnd={compact ? handleDragEnd : undefined}
          onClick={(e) => {
            if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              nav(item.url);
            }
          }}
          onMouseEnter={(e) => {
            if (isDragging) return;
            handleMouseEnterItem(item.popoutId || null, e);
          }}
          style={{
            opacity: isBeingDragged ? 0.25 : 1,
            transition: isDragging ? 'none' : 'background-color 0.15s, color 0.15s, opacity 0.15s',
            cursor: compact ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          }}
          className={`group relative select-none ${
            compact
              ? 'flex w-full flex-col items-center justify-center gap-[5px] rounded-[18px] px-1.5 py-[10px]'
              : 'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5'
          } ${
            isBeingDragged
              ? 'border border-dashed border-white/25 bg-white/[0.04]'
              : isActive
                ? 'bg-[#1f2128] text-[#3B82F6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                : 'text-[#8b8e98] hover:bg-white/[0.03] hover:text-zinc-200'
          }`}
        >
          {compact && (
            <span className="pointer-events-none absolute -left-0.5 top-1/2 hidden -translate-y-1/2 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-40 lg:flex">
              <GripVertical size={11} strokeWidth={2.5} />
            </span>
          )}

          <span className="pointer-events-none flex h-5 w-5 items-center justify-center">
            {item.renderIcon()}
          </span>

          <span className="pointer-events-none text-center text-[8px] font-semibold uppercase leading-none tracking-[0.08em]">
            {item.label}
          </span>
        </a>
      );
    }

    if (isDragging && insertBeforeId === null && draggingId !== items[items.length - 1]?.id) {
      result.push(insertLine);
    }

    return result;
  };

  return (
    <>
      <aside
        onMouseLeave={handleMouseLeaveSidebar}
        className="fixed left-0 top-0 bottom-0 z-[110] hidden w-[72px] min-w-[72px] flex-col border-r border-white/[0.06] bg-[#0E0E12] md:flex"
      >
        <div
          onClick={() => nav(APP_ROUTES.LANDING)}
          onMouseEnter={(e) => handleMouseEnterItem(null, e)}
          className="mb-7 flex cursor-pointer items-center justify-center pt-[18px]"
        >
          <LogoSvg />
        </div>

        <div
          ref={listRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex flex-1 flex-col gap-[6px] overflow-y-auto px-[6px] no-scrollbar"
        >
          {renderNavItems(desktopPrimaryItems, true)}
        </div>

        <div className="mx-auto my-2 h-px w-[30px] bg-white/[0.06]" />

        <div className="flex flex-col gap-[6px] px-[6px] pb-1.5">
          {renderNavItems(desktopBottomItems, true)}
        </div>

        <div className="mt-auto flex w-full flex-col items-center border-t border-white/5 py-5">
          <div className="group relative flex flex-col items-center gap-1.5" onMouseEnter={(e) => handleMouseEnterItem(null, e)}>
            <div className="relative cursor-pointer" onClick={() => nav(NAV_ROUTES.ACCOUNT_MANAGEMENT)}>
              <div className="h-9 w-9 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-tr from-slate-900 to-slate-800 transition-all group-hover:border-[#60a5fa]/50">
                {userData?.photoURL && !imgError ? (
                  <img src={userData.photoURL} alt="Avatar" className="h-full w-full object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                    {userData?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                refreshCredits();
              }}
              className="translate-y-1 cursor-pointer opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <div className="mb-1 rounded-full border border-[#60a5fa]/20 bg-[#60a5fa]/10 px-2 py-0.5 text-center text-[9px] font-black text-[#60a5fa] shadow-lg transition-colors hover:bg-[#60a5fa]/20">
                {creditsLoading ? '...' : (creditBalance ?? 0)}
              </div>
              {userData && (
                <div className="flex min-w-[60px] flex-col gap-0.5">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, ((credits?.storageUsed || 0) / (credits?.storageQuota || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-center font-mono text-[7px] text-slate-400">
                    {((credits?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(1)}GB
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-[110] border-t border-white/[0.08] bg-[#0E0E12]/95 px-2 pt-1.5 pb-[calc(4px+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-1">
          {renderNavItems(mobileItems, false)}
        </div>
      </nav>

      <ImagePopout
        isVisible={activePopout === 'image'}
        anchorTop={popoutAnchor}
        onMouseEnter={() => handleMouseEnterItem('image')}
        onMouseLeave={handleMouseLeaveSidebar}
      />
      <VideoPopout
        isVisible={activePopout === 'video'}
        anchorTop={popoutAnchor}
        onMouseEnter={() => handleMouseEnterItem('video')}
        onMouseLeave={handleMouseLeaveSidebar}
      />
      <AudioPopout
        isVisible={activePopout === 'audio'}
        anchorTop={popoutAnchor}
        onMouseEnter={() => handleMouseEnterItem('audio')}
        onMouseLeave={handleMouseLeaveSidebar}
      />
      <AppsPopout
        isVisible={activePopout === 'apps'}
        anchorTop={popoutAnchor}
        onMouseEnter={() => handleMouseEnterItem('apps')}
        onMouseLeave={handleMouseLeaveSidebar}
      />
    </>
  );
};

export default SidePannelFeatures;
