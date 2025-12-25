// Simple per-model generation duration statistics stored in localStorage.
// We keep a sliding window of recent durations to compute an adaptive timeout.

const STORAGE_KEY = 'wm_generation_stats_v1';
const MAX_SAMPLES = 50;
const DEFAULT_MIN_TIMEOUT_MS = 30 * 1000; // 30 seconds
const DEFAULT_FALLBACK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

type Stats = {
  [modelKey: string]: number[]; // durations in ms
};

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Stats;
  } catch (e) {
    console.error('[gen-stats] failed to load stats', e);
    return {};
  }
}

function saveStats(stats: Stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('[gen-stats] failed to save stats', e);
  }
}

export function recordGenerationDuration(modelKey: string | undefined, durationMs: number) {
  try {
    const key = modelKey || 'unknown';
    const stats = loadStats();
    const arr = stats[key] || [];
    arr.push(Math.max(0, Math.floor(durationMs)));
    // Keep only recent samples
    if (arr.length > MAX_SAMPLES) {
      arr.splice(0, arr.length - MAX_SAMPLES);
    }
    stats[key] = arr;
    saveStats(stats);
  } catch (e) {
    console.error('[gen-stats] record error', e);
  }
}

function percentile(arr: number[], p: number) {
  if (!arr || arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.max(0, sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]);
}

export function getAdaptiveTimeoutMs(modelKey: string | undefined) {
  try {
    const key = modelKey || 'unknown';
    const stats = loadStats();
    const samples = stats[key];
    if (!samples || samples.length === 0) return DEFAULT_FALLBACK_TIMEOUT_MS;

    // Use 90th percentile as baseline and add a multiplier/buffer
    const p90 = percentile(samples, 90);
    const timeout = Math.min(DEFAULT_MAX_TIMEOUT_MS, Math.max(DEFAULT_MIN_TIMEOUT_MS, Math.round(p90 * 1.5 + 15000))); // +15s buffer
    return timeout;
  } catch (e) {
    console.error('[gen-stats] getAdaptiveTimeout error', e);
    return DEFAULT_FALLBACK_TIMEOUT_MS;
  }
}

// For tests / debugging
export function _resetStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[gen-stats] reset error', e);
  }
}
