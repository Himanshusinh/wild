import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { getApiClient } from '@/lib/axiosInstance';

const STORAGE_KEY = 'wm_fx_rates_v1';

type FxPayload = {
  base: string;
  asOf: string;
  rates: Record<string, number>;
  suggestedCurrency?: string;
  detectedCountryCode?: string | null;
};

function loadCached(): { payload: FxPayload; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { payload: FxPayload; fetchedAt: number };
    if (!parsed?.payload?.rates || !parsed.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCached(payload: FxPayload) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ payload, fetchedAt: Date.now() }),
    );
  } catch {}
}

const TTL_MS = 24 * 60 * 60 * 1000;

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < TTL_MS;
}

/**
 * Display-only currency: INR is authoritative for billing; other amounts are indicative.
 * FX is cached in sessionStorage (~24h) to avoid refetching every navigation.
 */
export function useDisplayCurrency() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [fx, setFx] = useState<FxPayload | null>(null);
  const [fxLoading, setFxLoading] = useState(true);

  const displayCurrency = useMemo(() => {
    const fromUser = String((user as any)?.displayCurrency || '')
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(fromUser)) return fromUser;
    const sug = String(fx?.suggestedCurrency || '')
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(sug)) return sug;
    return 'INR';
  }, [user, fx?.suggestedCurrency]);

  /**
   * Use `useEffect` (not `useLayoutEffect`) so the first paint can run with `fx === null`.
   * Otherwise React applies sessionStorage cache in the same commit and the browser never
   * paints the price skeleton for non-INR display.
   */
  useEffect(() => {
    let cancelled = false;
    const cached = loadCached();
    if (cached && isFresh(cached.fetchedAt)) {
      setFx(cached.payload);
      setFxLoading(false);
      return;
    }

    setFxLoading(true);
    const api = getApiClient();
    api
      .get('/api/fx/rates')
      .then((res) => {
        const data = res?.data?.data || res?.data;
        if (!data?.rates) return;
        const payload: FxPayload = {
          base: data.base || 'INR',
          asOf: data.asOf || '',
          rates: data.rates,
          suggestedCurrency: data.suggestedCurrency,
          detectedCountryCode: data.detectedCountryCode,
        };
        if (!cancelled) {
          setFx(payload);
          saveCached(payload);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const convertInrAmount = useCallback(
    (amountInr: number, currency: string): number => {
      const c = currency.toUpperCase();
      if (c === 'INR' || !fx?.rates) return amountInr;
      const rate = fx.rates[c];
      if (typeof rate !== 'number' || !Number.isFinite(rate)) return amountInr;
      return amountInr * rate;
    },
    [fx],
  );

  const formatMoney = useCallback(
    (amountInr: number, currency?: string) => {
      const cur = (currency || displayCurrency).toUpperCase();
      const n = convertInrAmount(amountInr, cur);
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: cur,
          maximumFractionDigits: cur === 'JPY' || cur === 'KRW' ? 0 : 2,
        }).format(n);
      } catch {
        return `₹${amountInr.toLocaleString()}`;
      }
    },
    [convertInrAmount, displayCurrency],
  );

  const availableCurrencies = useMemo(() => {
    if (!fx?.rates) return [] as string[];
    return Object.keys(fx.rates)
      .filter((c) => /^[A-Z]{3}$/.test(c))
      .sort((a, b) => a.localeCompare(b));
  }, [fx?.rates]);

  const hasFxRates = Boolean(
    fx?.rates && Object.keys(fx.rates).length > 0,
  );

  return {
    displayCurrency,
    suggestedCurrency: fx?.suggestedCurrency,
    fxAsOf: fx?.asOf,
    formatMoney,
    convertInrAmount,
    availableCurrencies,
    fxLoading,
    hasFxRates,
  };
}
