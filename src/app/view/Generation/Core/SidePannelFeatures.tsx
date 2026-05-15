"use client";

import React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { CreditCard, GripVertical, History } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useCredits } from '@/hooks/useCredits';
import { APP_ROUTES, NAV_ROUTES, getSignInUrl } from '@/routes/routes';
import { ImagePopout } from './ImagePopout';
import { VideoPopout } from './VideoPopout';
import { AudioPopout } from './AudioPopout';
import { AppsPopout } from './AppsPopout';
import { useDispatch } from 'react-redux';
import { setSidebarExpanded } from '@/store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';


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
  <Image
    src="https://idr01.zata.ai/devstoragev1/public/core/logosquare.avif"
    alt="WildMind Logo"
    width={54}
    height={54}
    className="h-10 w-10 md:h-12 md:w-12 object-contain"
    unoptimized
  />
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

const DESKTOP_PRIMARY_ORDER = ['home', 'image', 'video', 'studio', 'genart', 'audio', 'apps'];
const DESKTOP_BOTTOM_ORDER = ['pricing', 'history'];
const MOBILE_ORDER = ['home', 'image', 'video', 'studio', 'genart', 'audio', 'apps'];

function getStorageKey(userId: string) {
  return `sidebar_item_order:${userId}`;
}

function loadOrder(): string[] {
  return [...DESKTOP_PRIMARY_ORDER, ...DESKTOP_BOTTOM_ORDER];
}

function saveOrder() {
  // Persistence disabled
}

function applyOrder(order: string[]): NavItemDef[] {
  return order.map((id) => DEFAULT_NAV_ITEMS.find((item) => item.id === id)).filter(Boolean) as NavItemDef[];
}

const SidePannelFeatures = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [imgError, setImgError] = React.useState(false);
  const [activePopout, setActivePopout] = React.useState<string | null>(null);
  const [popoutAnchor, setPopoutAnchor] = React.useState<number>(0);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const userData = useAppSelector((state: any) => state?.auth?.user || null);
  const authLoading = useAppSelector((state: any) => state?.auth?.loading ?? true);
  const sidebarExpanded = useAppSelector((state: any) => state?.ui?.sidebarExpanded);
  const dispatch = useDispatch();
  const { creditBalance, credits, loading: creditsLoading, refreshCredits } = useCredits();

  const storageKey = React.useMemo(() => getStorageKey(userData?.uid || userData?.email || userData?.username || 'guest'), [userData?.uid, userData?.email, userData?.username]);

  const [order, setOrder] = React.useState<string[]>(() => loadOrder());

  const orderedItems = React.useMemo(() => applyOrder(order), [order]);
  const desktopPrimaryItems = React.useMemo(() => orderedItems.filter((item) => DESKTOP_PRIMARY_ORDER.includes(item.id)), [orderedItems]);
  const desktopBottomItems = React.useMemo(() => orderedItems.filter((item) => DESKTOP_BOTTOM_ORDER.includes(item.id)), [orderedItems]);
  const mobileItems = React.useMemo(() => orderedItems.filter((item) => MOBILE_ORDER.includes(item.id)), [orderedItems]);

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [insertBeforeId, setInsertBeforeId] = React.useState<string | null>(null);
  const draggingIdRef = React.useRef<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setOrder(loadOrder());
  }, [storageKey]);

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
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      dispatch(setSidebarExpanded(false));
    }
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
        className="mx-1 my-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
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
          onClick={(e) => {
            if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              nav(item.url);
            }
          }}
          onMouseEnter={(e) => {
            handleMouseEnterItem(item.popoutId || null, e);
          }}
          className={`group relative select-none ${
            compact
              ? 'flex w-full flex-col items-center justify-center gap-[5px] rounded-[18px] px-1.5 py-[10px]'
              : 'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5'
          } ${
            isActive
              ? 'bg-[#1f2128] text-[#3B82F6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
              : 'text-[#8b8e98] hover:bg-white/[0.03] hover:text-zinc-200'
          }`}
        >
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
          className="mb-2 flex cursor-pointer items-center justify-center pt-2"
        >
          <LogoSvg />
        </div>

        <div
          ref={listRef}
          className="flex flex-1 flex-col gap-[6px] overflow-y-auto px-[6px] no-scrollbar"
        >
          {renderNavItems(desktopPrimaryItems, true)}
        </div>

        <div className="mx-auto my-2 h-px w-[30px] bg-white/[0.06]" />

        <div className="flex flex-col gap-[6px] px-[6px] pb-1.5">
          {renderNavItems(desktopBottomItems, true)}
        </div>

        <div className="mt-auto flex w-full flex-col items-center border-t border-white/5 py-3">
          <div className="group relative flex flex-col items-center gap-1" onMouseEnter={(e) => handleMouseEnterItem(null, e)}>
            <div className="relative cursor-pointer" onClick={() => nav(NAV_ROUTES.ACCOUNT_MANAGEMENT)}>
              <div className="h-9 w-9 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-tr from-slate-900 to-slate-800 transition-all group-hover:border-[#60a5fa]/50">
                {userData?.photoURL && !imgError ? (
                  <img src={userData.photoURL} alt="Avatar" className="h-full w-full object-cover" onError={() => setImgError(true)} />
                ) : authLoading ? (
                  <div className="h-full w-full animate-pulse bg-slate-700/50" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                    {userData?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {userData && (
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
              </div>
            )}
          </div>
          {!authLoading && !userData && (
            <button
              onClick={() => nav(getSignInUrl())}
              className="mt-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/90 transition hover:bg-white/20 hover:text-white"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarExpanded && (
          <>
            {/* Backdrop for Mobile Drawer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190] md:hidden"
              onClick={() => dispatch(setSidebarExpanded(false))}
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-[200] w-[280px] bg-[#0E0E12] border-r border-white/[0.06] flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between py-4 px-3 border-b border-white/[0.06]">
                <div onClick={() => nav(APP_ROUTES.LANDING)} className="flex items-center gap-3 cursor-pointer">
                  <LogoSvg />
                  <span className="text-white font-bold text-[17px] tracking-wide">WildMind AI</span>
                </div>
                <button 
                  onClick={() => dispatch(setSidebarExpanded(false))}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-0 space-y-1 no-scrollbar">
                {orderedItems.map((item) => {
                  const isActive = item.getIsActive(pathname);
                  return (
                    <a
                      href={item.url}
                      key={`mobile-${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        nav(item.url);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-[#1f2128] text-[#3B82F6] ring-1 ring-white/10' 
                          : 'text-[#8b8e98] hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center shrink-0">
                        {item.renderIcon()}
                      </span>
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Mobile User Profile in Drawer */}
              {userData ? (
                <div className="py-4 px-3 border-t border-white/[0.06] bg-black/20">
                  <button
                    onClick={() => nav(NAV_ROUTES.ACCOUNT_MANAGEMENT)}
                    className="flex w-full items-center gap-3 rounded-xl text-left transition hover:bg-white/[0.03]"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-tr from-slate-900 to-slate-800">
                      {userData?.photoURL && !imgError ? (
                        <img src={userData.photoURL} alt="Avatar" className="h-full w-full object-cover" onError={() => setImgError(true)} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                          {userData?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {userData?.username || userData?.displayName || 'User'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                        <span>Credits: {creditBalance ?? 0}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span>{((credits?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(1)}GB</span>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="py-3 px-3 border-t border-white/[0.06] bg-black/20">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => nav(getSignInUrl())}
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-tr from-slate-900 to-slate-800 text-xs font-bold text-slate-400 transition hover:border-white/20 hover:text-white"
                      aria-label="Sign in profile"
                    >
                      U
                    </button>
                    <button
                      onClick={() => nav(getSignInUrl())}
                      className="flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 hover:text-white"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>


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
