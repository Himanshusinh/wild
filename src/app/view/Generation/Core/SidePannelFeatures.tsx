"use client";
import React from 'react';
import Image from 'next/image';
import { useAppSelector } from '@/store/hooks';
import { usePathname, useRouter } from 'next/navigation';
import {
  Hexagon,
  Home,
  Layers,
  ImageIcon,
  Film,
  Music,
  CreditCard,
  History,
  Menu,
  X,
  GripVertical
} from 'lucide-react';
import WSolid from '@/components/icons/WSolid';
import { useCredits } from '@/hooks/useCredits';
import { APP_ROUTES, NAV_ROUTES } from '@/routes/routes';
import { ImagePopout } from './ImagePopout';
import { VideoPopout } from './VideoPopout';
import { AudioPopout } from './AudioPopout';
import { AppsPopout } from './AppsPopout';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItemDef {
  id: string;
  label: string;
  url: string;
  popoutId?: string;
  getIsActive: (pathname: string | null) => boolean;
  renderIcon: () => React.ReactElement;
}

// ─── Default order ────────────────────────────────────────────────────────────
const DEFAULT_NAV_ITEMS: NavItemDef[] = [
  {
    id: 'home',
    label: 'Home',
    url: APP_ROUTES.HOME,
    getIsActive: (p) => p === APP_ROUTES.HOME || p === '/',
    renderIcon: () => <Home />,
  },
  {
    id: 'genart',
    label: 'Gen-Art',
    url: '/view/ArtStation',
    getIsActive: (p) => !!p?.includes('/ArtStation'),
    renderIcon: () => <Layers />,
  },
  {
    id: 'studio',
    label: 'Studio',
    url: '/canvas-projects',
    getIsActive: (p) => !!p?.includes('/canvas-projects'),
    renderIcon: () => <WSolid />,
  },
  {
    id: 'apps',
    label: 'Apps',
    url: NAV_ROUTES.WORKFLOWS,
    popoutId: 'apps',
    getIsActive: (p) => !!p?.includes('/view/workflows') || !!p?.includes('/workflows'),
    renderIcon: () => <Hexagon />,
  },
  {
    id: 'image',
    label: 'Image',
    url: '/text-to-image',
    popoutId: 'image',
    getIsActive: (p) => !!p?.includes('/text-to-image'),
    renderIcon: () => <ImageIcon />,
  },
  {
    id: 'video',
    label: 'Video',
    url: '/text-to-video',
    popoutId: 'video',
    getIsActive: (p) => !!p?.includes('/text-to-video'),
    renderIcon: () => <Film />,
  },
  {
    id: 'audio',
    label: 'Audio',
    url: '/text-to-music',
    popoutId: 'audio',
    getIsActive: (p) => !!p?.includes('/text-to-music'),
    renderIcon: () => <Music />,
  },
  {
    id: 'pricing',
    label: 'Pricing',
    url: NAV_ROUTES.PRICING,
    getIsActive: (p) => !!p?.includes('/pricing'),
    renderIcon: () => <CreditCard />,
  },
  {
    id: 'history',
    label: 'History',
    url: '/history',
    getIsActive: (p) => !!p?.includes('/history'),
    renderIcon: () => <History />,
  },
];

const STORAGE_KEY = 'sidebar_item_order';

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NAV_ITEMS.map((i) => i.id);
    const parsed: string[] = JSON.parse(raw);
    const merged = parsed.filter((id) => DEFAULT_NAV_ITEMS.some((d) => d.id === id));
    DEFAULT_NAV_ITEMS.forEach((d) => { if (!merged.includes(d.id)) merged.push(d.id); });
    return merged;
  } catch {
    return DEFAULT_NAV_ITEMS.map((i) => i.id);
  }
}

function saveOrder(order: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch { }
}

function applyOrder(order: string[]): NavItemDef[] {
  return order.map((id) => DEFAULT_NAV_ITEMS.find((d) => d.id === id)).filter(Boolean) as NavItemDef[];
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SidePannelFeatures = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarHovered, setIsSidebarHovered] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [activePopout, setActivePopout] = React.useState<string | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const userData = useAppSelector((state: any) => state?.auth?.user || null);
  const { creditBalance, credits, loading: creditsLoading, refreshCredits } = useCredits();

  // ── Order ──
  const [order, setOrder] = React.useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_NAV_ITEMS.map((i) => i.id);
    return loadOrder();
  });
  const navItems = React.useMemo(() => applyOrder(order), [order]);

  // ── Drag state ──
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [insertBeforeId, setInsertBeforeId] = React.useState<string | null>(null); // null = insert at end
  const [ghostPos, setGhostPos] = React.useState({ x: 0, y: 0 });
  const [ghostLabel, setGhostLabel] = React.useState('');
  const [ghostIcon, setGhostIcon] = React.useState<React.ReactElement | null>(null);
  const draggingIdRef = React.useRef<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);
  const didMoveRef = React.useRef(false);

  // ── Popout hover ──
  const handleMouseEnterItem = (id: string | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActivePopout(id);
  };

  const handleMouseLeaveSidebar = () => {
    setIsSidebarHovered(false);
    hoverTimeoutRef.current = setTimeout(() => setActivePopout(null), 150);
  };

  const nav = (url: string) => {
    setIsMobileSidebarOpen(false);
    router.push(url);
  };

  // ── Compute insertBeforeId from mouse Y ──
  const computeInsertBeforeId = React.useCallback((clientY: number): string | null => {
    if (!listRef.current) return null;
    const itemEls = listRef.current.querySelectorAll<HTMLElement>('[data-navid]');
    for (const el of Array.from(itemEls)) {
      const id = el.dataset.navid!;
      if (id === draggingIdRef.current) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return id;
    }
    return null; // means: append at end
  }, []);

  // ── Mouse drag handlers ──
  const handleMouseDown = (item: NavItemDef, e: React.MouseEvent) => {
    // Only left button + not ctrl/meta (those open new tab)
    if (e.button !== 0 || e.ctrlKey || e.metaKey) return;
    e.preventDefault();

    draggingIdRef.current = item.id;
    isDraggingRef.current = false;
    didMoveRef.current = false;

    const startX = e.clientX;
    const startY = e.clientY;

    const onMouseMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      // Start actual drag only after 4px movement to avoid killing clicks
      if (!isDraggingRef.current && Math.hypot(dx, dy) < 4) return;

      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        didMoveRef.current = true;
        setDraggingId(item.id);
        setGhostLabel(item.label);
        setGhostIcon(item.renderIcon());
      }

      setGhostPos({ x: me.clientX, y: me.clientY });
      setInsertBeforeId(computeInsertBeforeId(me.clientY));
    };

    const onMouseUp = (me: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (!isDraggingRef.current) {
        // Was a click, not a drag — navigate
        nav(item.url);
        draggingIdRef.current = null;
        return;
      }

      // Commit reorder
      const fromId = draggingIdRef.current!;
      const toBeforeId = computeInsertBeforeId(me.clientY);

      setOrder((prev) => {
        if (!fromId) return prev;
        const next = prev.filter((id) => id !== fromId);
        if (toBeforeId === null) {
          next.push(fromId);
        } else {
          const toIdx = next.indexOf(toBeforeId);
          if (toIdx === -1) next.push(fromId);
          else next.splice(toIdx, 0, fromId);
        }
        saveOrder(next);
        return next;
      });

      isDraggingRef.current = false;
      draggingIdRef.current = null;
      setDraggingId(null);
      setInsertBeforeId(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Prevent ghost from flickering when re-rendering
  const isDragging = draggingId !== null;

  // Build list with insertion indicator
  const renderNavItems = () => {
    const result: React.ReactNode[] = [];

    const insertLine = (
      <div
        key="insert-line"
        className="mx-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent my-0.5 pointer-events-none"
        style={{ boxShadow: '0 0 6px 1px rgba(255,255,255,0.5)' }}
      />
    );

    for (const item of navItems) {
      // Insert line BEFORE this item if it's the insertion point
      if (isDragging && insertBeforeId === item.id && draggingId !== item.id) {
        result.push(insertLine);
      }

      const isActive = item.getIsActive(pathname);
      const isBeingDragged = draggingId === item.id;

      result.push(
        <div
          key={item.id}
          data-navid={item.id}
          onMouseEnter={() => {
            if (isDragging) return;
            setIsSidebarHovered(true);
            handleMouseEnterItem(item.popoutId || null);
          }}
          onMouseDown={(e) => handleMouseDown(item, e)}
          style={{
            opacity: isBeingDragged ? 0.2 : 1,
            transition: isDragging ? 'none' : 'opacity 0.15s',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          className={`group relative flex items-center justify-start md:flex-col md:justify-center py-2 px-2 md:px-2 mx-2 md:mx-1 rounded-xl mb-1 select-none
            ${isBeingDragged
              ? 'border border-dashed border-white/30 bg-white/5'
              : isActive
                ? 'bg-white/10 ring-1 ring-white/20 text-white shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
        >
          {/* Grip handle */}
          <span className="hidden md:flex absolute -left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity duration-200 text-white pointer-events-none">
            <GripVertical size={11} strokeWidth={2.5} />
          </span>

          <div className={`transition-all duration-300 ${isActive ? 'text-white' : 'text-current'} pointer-events-none`}>
            {React.isValidElement(item.renderIcon()) &&
              React.cloneElement(item.renderIcon() as React.ReactElement<{ size?: number; strokeWidth?: number }>, {
                size: 18,
                strokeWidth: 2,
              })}
          </div>

          <span className={`ml-3 md:ml-0 md:mt-1.5 mt-0 text-[9px] uppercase font-bold tracking-wider transition-colors duration-300 pointer-events-none
            ${isActive ? 'text-white' : 'text-current'}`}>
            {item.label}
          </span>

          {/* Tooltip */}
          <span className="hidden md:block md:mt-1 text-[9px] uppercase font-bold tracking-widest scale-0 group-hover:scale-100 transition-all duration-300 absolute left-full ml-2 bg-black/80 px-2 py-1 rounded border border-white/10 whitespace-nowrap z-[120] pointer-events-none opacity-0 group-hover:opacity-100">
            {item.label}
          </span>
        </div>
      );
    }

    // Insert line at the very end
    if (isDragging && insertBeforeId === null && draggingId !== navItems[navItems.length - 1]?.id) {
      result.push(insertLine);
    }

    return result;
  };

  return (
    <>
      {/* Mobile Toggle */}
      {!isMobileSidebarOpen && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-0 left-0 z-[60] md:hidden flex items-center gap-2 px-2 py-2"
        >
          <Menu size={24} className="text-[#f9fafb]" strokeWidth={2.5} />
        </button>
      )}

      {/* Main Sidebar */}
      <div
        onMouseLeave={handleMouseLeaveSidebar}
        className={`fixed top-0 bottom-0 left-0 flex flex-col transition-all duration-500 ease-in-out bg-[#050505]/95 backdrop-blur-2xl
          ${isMobileSidebarOpen ? 'w-56 translate-x-0 z-[110]' : '-translate-x-full md:translate-x-0 z-[110] md:w-20'}`}
      >
        {/* Mobile Close */}
        <div className="flex items-center justify-between px-3 pt-3 md:hidden">
          <button onClick={() => setIsMobileSidebarOpen(false)} className="flex items-center gap-0 px-0 py-1">
            <X size={24} className="text-slate-100" />
          </button>
        </div>

        {/* Logo */}
        <div
          onClick={() => nav(APP_ROUTES.LANDING)}
          onMouseEnter={() => handleMouseEnterItem(null)}
          className="group relative flex items-center justify-start md:flex-col md:items-center md:justify-center pt-2 py-0 md:pl-3 pl-2 pr-3 transition-all duration-300 cursor-pointer opacity-100"
        >
          <div className="relative w-[40px] h-[40px] md:w-[40px] md:h-[40px] flex items-center justify-center">
            <Image src="/core/logosquare.png" alt="WildMind Logo" fill className="object-contain" sizes="40px" unoptimized />
          </div>
        </div>

        {/* Nav Items */}
        <div ref={listRef} className="flex flex-col gap-0.5 flex-1 overflow-y-auto no-scrollbar mx-1 md:pt-3 pt-1">
          {renderNavItems()}
        </div>

        {/* Profile & Credits */}
        <div className="mt-auto py-5 flex flex-col items-start md:items-center pl-3 md:pl-0 border-t border-white/5">
          <div
            className="relative group flex flex-col items-start md:items-center gap-1.5"
            onMouseEnter={() => handleMouseEnterItem(null)}
          >
            <div className="relative cursor-pointer" onClick={() => nav(NAV_ROUTES.ACCOUNT_MANAGEMENT)}>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/10 overflow-hidden group-hover:border-[#60a5fa]/50 transition-all">
                {userData?.photoURL && !imgError ? (
                  <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {userData?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            <div
              onClick={(e) => { e.stopPropagation(); refreshCredits(); }}
              className="cursor-pointer transition-all duration-300 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
            >
              <div className="bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[#60a5fa] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg hover:bg-[#60a5fa]/20 transition-colors mb-1 text-center">
                {creditsLoading ? '...' : (creditBalance ?? 0)}
              </div>
              {userData && (
                <div className="flex flex-col gap-0.5 w-full min-w-[60px]">
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (((credits?.storageUsed || 0) / (credits?.storageQuota || 1)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[7px] text-slate-400 text-center font-mono">
                    {((credits?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(1)}GB
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Drag Ghost ── */}
      {isDragging && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: ghostPos.x + 14,
            top: ghostPos.y - 20,
            transform: 'rotate(-4deg) scale(1.08)',
            transition: 'none',
          }}
        >
          <div className="flex md:flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-2xl text-white"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)', minWidth: 60 }}>
            <div className="pointer-events-none">
              {ghostIcon && React.cloneElement(ghostIcon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 20, strokeWidth: 2 })}
            </div>
            <span className="text-[9px] uppercase font-black tracking-wider mt-0.5">{ghostLabel}</span>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Popouts */}
      <ImagePopout isVisible={activePopout === 'image'} onMouseEnter={() => handleMouseEnterItem('image')} onMouseLeave={handleMouseLeaveSidebar} />
      <VideoPopout isVisible={activePopout === 'video'} onMouseEnter={() => handleMouseEnterItem('video')} onMouseLeave={handleMouseLeaveSidebar} />
      <AudioPopout isVisible={activePopout === 'audio'} onMouseEnter={() => handleMouseEnterItem('audio')} onMouseLeave={handleMouseLeaveSidebar} />
      <AppsPopout isVisible={activePopout === 'apps'} onMouseEnter={() => handleMouseEnterItem('apps')} onMouseLeave={handleMouseLeaveSidebar} />
    </>
  );
};

export default SidePannelFeatures;
