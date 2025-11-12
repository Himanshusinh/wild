"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type IOEvent = {
  ts: number;
  type: 'observe' | 'intersect' | 'skip' | 'load-start' | 'load-end' | 'disconnect';
  detail?: any;
};

function formatTs(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

function useIsDebugEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get('debug');
      if (q === '1') localStorage.setItem('wild_debug', '1');
      if (q === '0') localStorage.removeItem('wild_debug');
      setEnabled(localStorage.getItem('wild_debug') === '1');
    } catch {}
  }, []);
  return enabled;
}

export default function InfiniteScrollDebugOverlay({
  hasMore,
  loading,
  totalCount,
  nextCursor,
  containerRef,
  sentinelRef,
  events,
}: {
  hasMore: boolean; loading: boolean; totalCount: number; nextCursor: number | null;
  containerRef: React.RefObject<HTMLElement | null>;
  sentinelRef: React.RefObject<HTMLElement | null>;
  events: IOEvent[];
}) {
  const isDebug = useIsDebugEnabled();
  const [metrics, setMetrics] = useState({
    container: { scrollTop: 0, scrollHeight: 0, clientHeight: 0 },
    sentinel: { top: 0, bottomGap: 0 },
    viewport: { h: 0 },
  });

  useEffect(() => {
    if (!isDebug) return;
    const tick = () => {
      const el = containerRef?.current as HTMLElement | null;
      const sent = sentinelRef?.current as HTMLElement | null;
      const st = el ? el.scrollTop : (typeof window !== 'undefined' ? window.scrollY || 0 : 0);
      const sh = el ? el.scrollHeight : (typeof document !== 'undefined' ? document.body.scrollHeight : 0);
      const ch = el ? el.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 0);
      let top = 0, bottomGap = 0;
      try {
        const rect = sent?.getBoundingClientRect();
        if (rect) {
          top = rect.top;
          bottomGap = (window.innerHeight || ch) - rect.top;
        }
      } catch {}
      setMetrics({
        container: { scrollTop: st, scrollHeight: sh, clientHeight: ch },
        sentinel: { top, bottomGap },
        viewport: { h: (typeof window !== 'undefined' ? window.innerHeight : 0) },
      });
    };
    const id = window.setInterval(tick, 300);
    tick();
    return () => window.clearInterval(id);
  }, [isDebug, containerRef, sentinelRef]);

  if (!isDebug) return null;

  return (
    <div style={{
      position: 'fixed', right: 12, bottom: 12, zIndex: 99999,
      background: 'rgba(17,17,17,0.9)', color: '#e2e8f0',
      padding: '10px 12px', borderRadius: 8, width: 360,
      boxShadow: '0 6px 20px rgba(0,0,0,0.4)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12,
    }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6}}>
        <strong>Infinite Scroll Debug</strong>
        <span style={{opacity: 0.7}}>now {formatTs(Date.now())}</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        <div>
          <div><b>State</b></div>
          <div>hasMore: <b style={{color: hasMore ? '#22c55e' : '#ef4444'}}>{String(hasMore)}</b></div>
          <div>loading: <b style={{color: loading ? '#f59e0b' : '#22c55e'}}>{String(loading)}</b></div>
          <div>total: {totalCount}</div>
          <div>nextCursor: {nextCursor ?? 'null'}</div>
        </div>
        <div>
          <div><b>Container</b></div>
          <div>scrollTop: {Math.round(metrics.container.scrollTop)}</div>
          <div>clientHeight: {metrics.container.clientHeight}</div>
          <div>scrollHeight: {metrics.container.scrollHeight}</div>
        </div>
        <div>
          <div><b>Sentinel</b></div>
          <div>rect.top: {Math.round(metrics.sentinel.top)}</div>
          <div>bottomGap: {Math.round(metrics.sentinel.bottomGap)}</div>
        </div>
        <div>
          <div><b>Viewport</b></div>
          <div>height: {metrics.viewport.h}</div>
        </div>
      </div>
      <div style={{marginTop:8}}>
        <div style={{marginBottom:4}}><b>Events</b></div>
        <div style={{maxHeight: 140, overflowY:'auto', border:'1px solid rgba(148,163,184,0.2)', borderRadius:6}}>
          {(events || []).slice(-10).reverse().map((e, idx) => (
            <div key={idx} style={{padding:'4px 6px', borderBottom:'1px solid rgba(148,163,184,0.12)'}}>
              <span style={{opacity:0.7}}>{formatTs(e.ts)}</span> · <b>{e.type}</b> {e.detail ? <span style={{opacity:0.9}}> {JSON.stringify(e.detail)}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
