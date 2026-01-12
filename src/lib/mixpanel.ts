import mixpanel from 'mixpanel-browser';

export const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '98b8658bcd19508deab537d5560d63d6';

let isInitialized = false;

export const initMixpanel = () => {
  if (isInitialized) return;

  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token not found, skipping initialization');
    return;
  }

  const isProd = process.env.NODE_ENV === 'production';

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: !isProd,
    track_pageview: true,
    persistence: 'localStorage',
    record_sessions_percent: isProd ? 100 : 0, // Disable Session Replay in dev to prevent mutex timeouts
    record_heatmap_data: isProd,
    autocapture: isProd,
  });

  isInitialized = true;
};

export const track = (name: string, props: Record<string, any> = {}) => {
  if (!MIXPANEL_TOKEN) return;
  mixpanel.track(name, props);
};

export const identify = (id: string) => {
  if (!MIXPANEL_TOKEN) return;
  mixpanel.identify(id);
};

export const reset = () => {
  if (!MIXPANEL_TOKEN) return;
  mixpanel.reset();
};
